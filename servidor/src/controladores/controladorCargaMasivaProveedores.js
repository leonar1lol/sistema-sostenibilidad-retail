import multer from 'multer';
import ExcelJS from 'exceljs';
import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';
import { validarFilaProveedor, TIPOS_VALIDOS, TAMANOS_VALIDOS, ANIOS_OPERACION_VALIDOS } from '../servicios/servicioValidacionProveedor.js';

// ponytail: límites elegidos tras revisar las cuotas reales de los servicios en uso
// (Cloud Run admite hasta 32 MiB por solicitud HTTP/1 y hasta 60 min de tiempo de
// espera, hoy configurado en 300s/540s; Neon soporta cientos de conexiones
// concurrentes sin contención para esta carga). 8 MiB y 1000 filas dejan margen
// amplio y mantienen el procesamiento muy por debajo del tiempo de espera
// configurado. Si algún día se necesitan archivos más grandes, subir el límite de
// filas junto con el timeout de Cloud Run, o migrar a un parser en streaming.
const TAMANO_MAXIMO_ARCHIVO_BYTES = 8 * 1024 * 1024;
const MAXIMO_FILAS_POR_CARGA = 1000;
const TIEMPO_MAXIMO_ANALISIS_MS = 20000;

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const subidaExcelMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_ARCHIVO_BYTES },
  fileFilter: (peticion, archivo, callback) => {
    // Solo .xlsx real (Office Open XML). Se rechazan explícitamente formatos legacy
    // (.xls) y archivos con macros (.xlsm), aunque el nombre del archivo diga .xlsx.
    callback(null, archivo.mimetype === MIME_XLSX);
  }
}).single('archivo');

const ENCABEZADOS = [
  { clave: 'ruc', titulo: 'RUC', obligatorio: true, ancho: 14 },
  { clave: 'razonSocial', titulo: 'Razón Social', obligatorio: true, ancho: 32 },
  { clave: 'nombreComercial', titulo: 'Nombre Comercial', obligatorio: false, ancho: 26 },
  { clave: 'tipo', titulo: 'Tipo', obligatorio: true, ancho: 12 },
  { clave: 'correo', titulo: 'Correo', obligatorio: true, ancho: 28 },
  { clave: 'representante', titulo: 'Representante', obligatorio: false, ancho: 24 },
  { clave: 'cargoRepresentante', titulo: 'Cargo del Representante', obligatorio: false, ancho: 24 },
  { clave: 'telefono', titulo: 'Teléfono', obligatorio: false, ancho: 16 },
  { clave: 'direccionFiscal', titulo: 'Dirección Fiscal', obligatorio: false, ancho: 30 },
  { clave: 'departamento', titulo: 'Departamento', obligatorio: false, ancho: 18 },
  { clave: 'industriaNombre', titulo: 'Industria', obligatorio: true, ancho: 22 },
  { clave: 'unidadesNombres', titulo: 'Unidades de Negocio', obligatorio: true, ancho: 34 },
  { clave: 'unidadesCriticasNombres', titulo: 'Unidades Críticas', obligatorio: false, ancho: 30 },
  { clave: 'tamanoEmpresa', titulo: 'Tamaño de Empresa', obligatorio: false, ancho: 16 },
  { clave: 'aniosOperacion', titulo: 'Años de Operación', obligatorio: false, ancho: 18 },
  { clave: 'sitioWeb', titulo: 'Sitio Web', obligatorio: false, ancho: 26 }
];

const COLOR_ENCABEZADO = 'FF1D4E89';
const COLOR_OBLIGATORIO = 'FFFFF2CC';

export const descargarPlantillaCargaMasiva = async (peticion, respuesta) => {
  try {
    const [industrias, unidades] = await Promise.all([
      consultarBaseDatos('SELECT TRIM(nombre) AS nombre FROM industria ORDER BY nombre ASC'),
      consultarBaseDatos('SELECT TRIM(nombre) AS nombre FROM unidad_negocio ORDER BY nombre ASC')
    ]);

    const libro = new ExcelJS.Workbook();
    libro.creator = 'Plataforma de Sostenibilidad de Proveedores';
    libro.created = new Date();

    // --- Hoja 1: Proveedores -------------------------------------------------
    const hoja = libro.addWorksheet('Proveedores', { views: [{ state: 'frozen', ySplit: 1 }] });
    hoja.columns = ENCABEZADOS.map((e) => ({ header: e.titulo, key: e.clave, width: e.ancho }));

    const filaEncabezado = hoja.getRow(1);
    filaEncabezado.eachCell((celda, indice) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
      celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if (ENCABEZADOS[indice - 1]?.obligatorio) {
        celda.note = 'Campo obligatorio';
      }
    });
    filaEncabezado.height = 26;

    hoja.addRow({
      ruc: '20100070970',
      razonSocial: 'Ejemplo Proveedor S.A.C.',
      nombreComercial: 'Ejemplo',
      tipo: 'Retail',
      correo: 'contacto@ejemplo.com.pe',
      representante: 'Nombre Apellido',
      cargoRepresentante: 'Gerente General',
      telefono: '+51 1 2345678',
      direccionFiscal: 'Av. Siempre Viva 123, Lima',
      departamento: 'Lima',
      industriaNombre: industrias.rows[0]?.nombre || '',
      unidadesNombres: unidades.rows[0]?.nombre || '',
      unidadesCriticasNombres: '',
      tamanoEmpresa: 'MYPE',
      aniosOperacion: 'De 2 a 5 años',
      sitioWeb: 'https://www.ejemplo.com.pe'
    });
    const filaEjemplo = hoja.getRow(2);
    filaEjemplo.eachCell((celda) => {
      celda.font = { italic: true, color: { argb: 'FF888888' } };
    });
    hoja.getCell('A2').note = 'Fila de ejemplo: bórrela antes de subir el archivo.';

    ENCABEZADOS.forEach((e, indice) => {
      if (e.obligatorio) {
        hoja.getColumn(indice + 1).eachCell({ includeEmpty: true }, (celda, numeroFila) => {
          if (numeroFila > 1) {
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_OBLIGATORIO } };
          }
        });
      }
    });

    const colTipo = ENCABEZADOS.findIndex((e) => e.clave === 'tipo') + 1;
    const colTamano = ENCABEZADOS.findIndex((e) => e.clave === 'tamanoEmpresa') + 1;
    const colAnios = ENCABEZADOS.findIndex((e) => e.clave === 'aniosOperacion') + 1;
    const colIndustria = ENCABEZADOS.findIndex((e) => e.clave === 'industriaNombre') + 1;
    // Excel limita a 255 caracteres la fórmula de una validación de lista en línea;
    // si el catálogo de industrias la supera, se omite el desplegable (la hoja de
    // instrucciones y la validación del servidor siguen exigiendo un nombre válido).
    const listaIndustrias = industrias.rows.map((i) => i.nombre).join(',');
    const industriaConDesplegable = listaIndustrias.length > 0 && listaIndustrias.length <= 255;

    for (let fila = 2; fila <= MAXIMO_FILAS_POR_CARGA + 1; fila += 1) {
      hoja.getCell(fila, colTipo).dataValidation = {
        type: 'list', allowBlank: false, formulae: [`"${TIPOS_VALIDOS.join(',')}"`],
        showErrorMessage: true, errorTitle: 'Tipo inválido', error: `Use uno de: ${TIPOS_VALIDOS.join(', ')}`
      };
      hoja.getCell(fila, colTamano).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${TAMANOS_VALIDOS.join(',')}"`],
        showErrorMessage: true, errorTitle: 'Tamaño inválido', error: `Use uno de: ${TAMANOS_VALIDOS.join(', ')}`
      };
      hoja.getCell(fila, colAnios).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${ANIOS_OPERACION_VALIDOS.join(',')}"`],
        showErrorMessage: true, errorTitle: 'Valor inválido', error: `Use uno de: ${ANIOS_OPERACION_VALIDOS.join(', ')}`
      };
      if (industriaConDesplegable) {
        hoja.getCell(fila, colIndustria).dataValidation = {
          type: 'list', allowBlank: false, formulae: [`"${listaIndustrias}"`],
          showErrorMessage: true, errorTitle: 'Industria inválida', error: 'Seleccione una industria de la lista de referencia.'
        };
      }
    }

    // --- Hoja 2: Instrucciones -----------------------------------------------
    const hojaInstrucciones = libro.addWorksheet('Instrucciones');
    hojaInstrucciones.columns = [
      { header: 'Campo', key: 'campo', width: 24 },
      { header: '¿Obligatorio?', key: 'obligatorio', width: 14 },
      { header: 'Cómo completarlo', key: 'detalle', width: 80 }
    ];
    hojaInstrucciones.getRow(1).eachCell((celda) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
    });

    const filasInstrucciones = [
      ['RUC', 'Sí', 'Exactamente 11 dígitos numéricos. Es la clave única del proveedor: si sube un RUC que ya existe en la plataforma, se actualizan sus datos; si no existe, se crea un proveedor nuevo.'],
      ['Razón Social', 'Sí', 'Nombre legal completo de la empresa.'],
      ['Nombre Comercial', 'No', 'Nombre con el que opera comercialmente, si es distinto a la razón social.'],
      ['Tipo', 'Sí', `Uno de: ${TIPOS_VALIDOS.join(' / ')}. Use el desplegable de la celda.`],
      ['Correo', 'Sí', 'Correo de contacto del proveedor, con formato válido (nombre@dominio.com).'],
      ['Representante', 'No', 'Nombre completo del representante legal.'],
      ['Cargo del Representante', 'No', 'Cargo que ocupa el representante dentro de la empresa.'],
      ['Teléfono', 'No', 'Teléfono de contacto, en cualquier formato.'],
      ['Dirección Fiscal', 'No', 'Dirección fiscal registrada.'],
      ['Departamento', 'No', 'Departamento/región del Perú donde opera.'],
      ['Industria', 'Sí', 'Debe coincidir exactamente con uno de los nombres de la hoja "Listas de referencia". Use el desplegable de la celda.'],
      ['Unidades de Negocio', 'Sí', 'Una o varias unidades de la hoja "Listas de referencia", separadas por coma. Ejemplo: Promart, Oechsle'],
      ['Unidades Críticas', 'No', 'Subconjunto de las unidades indicadas en la columna anterior para las que el proveedor es crítico, separadas por coma.'],
      ['Tamaño de Empresa', 'No', `Uno de: ${TAMANOS_VALIDOS.join(' / ')}.`],
      ['Años de Operación', 'No', `Uno de: ${ANIOS_OPERACION_VALIDOS.join(' / ')}.`],
      ['Sitio Web', 'No', 'URL del sitio web del proveedor, si tiene.']
    ];
    filasInstrucciones.forEach((fila) => hojaInstrucciones.addRow(fila));
    hojaInstrucciones.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

    hojaInstrucciones.addRow([]);
    hojaInstrucciones.addRow(['Límite por archivo', '', `Hasta ${MAXIMO_FILAS_POR_CARGA} proveedores por carga. Para padrones más grandes, divida la información en varios archivos.`]);
    hojaInstrucciones.addRow(['Fila de ejemplo', '', 'Elimine la fila de ejemplo (fila 2 de la hoja "Proveedores") antes de subir el archivo; si la deja, será tratada como un proveedor real.']);

    // --- Hoja 3: Listas de referencia ----------------------------------------
    const hojaListas = libro.addWorksheet('Listas de referencia');
    hojaListas.columns = [
      { header: 'Industrias disponibles', key: 'industria', width: 30 },
      { header: 'Unidades de negocio disponibles', key: 'unidad', width: 30 }
    ];
    hojaListas.getRow(1).eachCell((celda) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
    });
    const maximoFilas = Math.max(industrias.rows.length, unidades.rows.length);
    for (let i = 0; i < maximoFilas; i += 1) {
      hojaListas.addRow({
        industria: industrias.rows[i]?.nombre || '',
        unidad: unidades.rows[i]?.nombre || ''
      });
    }

    respuesta.setHeader('Content-Type', MIME_XLSX);
    respuesta.setHeader('Content-Disposition', 'attachment; filename="plantilla_carga_masiva_proveedores.xlsx"');
    await libro.xlsx.write(respuesta);
    respuesta.end();
  } catch (error) {
    console.error('Error al generar la plantilla de carga masiva:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al generar la plantilla de carga masiva.' });
  }
};

function leerCeldaTexto(fila, indiceColumna) {
  const celda = fila.getCell(indiceColumna);
  const valor = celda.value;
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object' && 'text' in valor) return String(valor.text); // rich text
  if (typeof valor === 'object' && 'result' in valor) return String(valor.result ?? ''); // fórmula ya calculada
  return String(valor);
}

export const cargaMasivaProveedores = async (peticion, respuesta) => {
  if (!peticion.file) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Adjunte un archivo .xlsx generado a partir de la plantilla.' });
  }

  let libro;
  try {
    libro = new ExcelJS.Workbook();
    const analisis = libro.xlsx.load(peticion.file.buffer);
    const agotado = new Promise((_, rechazar) =>
      setTimeout(() => rechazar(new Error('tiempo_agotado')), TIEMPO_MAXIMO_ANALISIS_MS)
    );
    await Promise.race([analisis, agotado]);
  } catch (error) {
    return respuesta.status(400).json({
      exito: false,
      mensaje: error.message === 'tiempo_agotado'
        ? 'El archivo tardó demasiado en analizarse. Verifique que sea un .xlsx válido y no esté dañado.'
        : 'No se pudo leer el archivo. Verifique que sea un .xlsx válido, generado a partir de la plantilla.'
    });
  }

  const hoja = libro.getWorksheet('Proveedores') || libro.worksheets[0];
  if (!hoja) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El archivo no contiene ninguna hoja de datos.' });
  }

  const filaEncabezado = hoja.getRow(1);
  const indiceColumnaPorClave = {};
  filaEncabezado.eachCell((celda, indiceColumna) => {
    const titulo = String(celda.value || '').trim().toLowerCase();
    const encabezado = ENCABEZADOS.find((e) => e.titulo.toLowerCase() === titulo);
    if (encabezado) indiceColumnaPorClave[encabezado.clave] = indiceColumna;
  });
  const faltantes = ENCABEZADOS.filter((e) => e.obligatorio && !indiceColumnaPorClave[e.clave]);
  if (faltantes.length > 0) {
    return respuesta.status(400).json({
      exito: false,
      mensaje: `El archivo no tiene las columnas esperadas: ${faltantes.map((e) => e.titulo).join(', ')}. Use la plantilla oficial.`
    });
  }

  const totalFilasHoja = hoja.rowCount - 1;
  if (totalFilasHoja > MAXIMO_FILAS_POR_CARGA) {
    return respuesta.status(400).json({
      exito: false,
      mensaje: `El archivo tiene ${totalFilasHoja} filas de datos; el máximo permitido por carga es ${MAXIMO_FILAS_POR_CARGA}. Divídalo en varios archivos.`
    });
  }

  const [industriasFila, unidadesFila] = await Promise.all([
    consultarBaseDatos('SELECT id_industria AS "idIndustria", TRIM(nombre) AS nombre FROM industria'),
    consultarBaseDatos('SELECT id_unidad AS "idUnidad", TRIM(nombre) AS nombre FROM unidad_negocio')
  ]);
  const mapaIndustrias = new Map(industriasFila.rows.map((i) => [i.nombre.toLowerCase(), i.idIndustria]));
  const mapaUnidades = new Map(unidadesFila.rows.map((u) => [u.nombre.toLowerCase(), { idUnidad: u.idUnidad, nombre: u.nombre }]));

  const filasValidadas = [];
  const rucsVistos = new Map();

  for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila += 1) {
    const fila = hoja.getRow(numeroFila);
    const bruto = {};
    for (const [clave, indiceColumna] of Object.entries(indiceColumnaPorClave)) {
      bruto[clave] = leerCeldaTexto(fila, indiceColumna);
    }

    const rucNormalizado = String(bruto.ruc || '').trim();
    const filaCompletamenteVacia = Object.values(bruto).every((v) => !String(v || '').trim());
    if (filaCompletamenteVacia) continue;

    const resultado = validarFilaProveedor(bruto, { mapaIndustrias, mapaUnidades });

    if (rucNormalizado && rucsVistos.has(rucNormalizado)) {
      resultado.valido = false;
      resultado.errores.push(`RUC duplicado en el archivo (ya aparece en la fila ${rucsVistos.get(rucNormalizado)}).`);
    } else if (rucNormalizado) {
      rucsVistos.set(rucNormalizado, numeroFila);
    }

    filasValidadas.push({ numeroFila, ruc: rucNormalizado || '(sin RUC)', resultado });
  }

  if (filasValidadas.length === 0) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El archivo no contiene filas de datos para procesar.' });
  }

  const filasValidas = filasValidadas.filter((f) => f.resultado.valido);
  const filasInvalidas = filasValidadas.filter((f) => !f.resultado.valido);

  const reporte = filasInvalidas.map((f) => ({
    fila: f.numeroFila,
    ruc: f.ruc,
    estado: 'rechazado',
    mensaje: f.resultado.errores.join(' ')
  }));

  if (filasValidas.length > 0) {
    try {
      // ponytail: se agrupan los proveedores y sus unidades en un puñado de
      // sentencias multi-fila en lugar de una consulta por proveedor — una
      // prueba de carga real mostró ~380ms por fila con el enfoque fila a fila
      // (300 filas ≈ 115s), un margen demasiado ajustado frente al tiempo de
      // espera de Cloud Run. Agrupando, el costo deja de crecer con la
      // cantidad de filas y se mantiene en un puñado de round-trips.
      const COLUMNAS_PROVEEDOR = ['ruc', 'razon_social', 'nombre_comercial', 'direccion_fiscal', 'departamento', 'representante', 'cargo_representante', 'telefono', 'correo', 'tipo', 'tamano_empresa', 'anios_operacion', 'sitio_web', 'id_unidad', 'id_industria'];

      const resultadosCommit = await ejecutarTransaccion(async (cliente) => {
        const marcadoresProveedor = [];
        const parametrosProveedor = [];
        filasValidas.forEach((f, indice) => {
          const d = f.resultado.datos;
          const base = indice * COLUMNAS_PROVEEDOR.length;
          marcadoresProveedor.push(`(${COLUMNAS_PROVEEDOR.map((_, i) => `$${base + i + 1}`).join(',')})`);
          parametrosProveedor.push(
            d.ruc, d.razonSocial, d.nombreComercial, d.direccionFiscal, d.departamento,
            d.representante, d.cargoRepresentante, d.telefono, d.correo, d.tipo,
            d.tamanoEmpresa, d.aniosOperacion, d.sitioWeb, d.idsUnidad[0], d.idIndustria
          );
        });

        const resultadoUpsert = await cliente.query(
          `INSERT INTO proveedor (${COLUMNAS_PROVEEDOR.join(', ')})
           VALUES ${marcadoresProveedor.join(', ')}
           ON CONFLICT (ruc) DO UPDATE SET
             razon_social = EXCLUDED.razon_social,
             nombre_comercial = EXCLUDED.nombre_comercial,
             direccion_fiscal = EXCLUDED.direccion_fiscal,
             departamento = EXCLUDED.departamento,
             representante = EXCLUDED.representante,
             cargo_representante = EXCLUDED.cargo_representante,
             telefono = EXCLUDED.telefono,
             correo = EXCLUDED.correo,
             tipo = EXCLUDED.tipo,
             tamano_empresa = EXCLUDED.tamano_empresa,
             anios_operacion = EXCLUDED.anios_operacion,
             sitio_web = EXCLUDED.sitio_web,
             id_industria = EXCLUDED.id_industria
           RETURNING id_proveedor AS "idProveedor", ruc, (xmax = 0) AS "esNuevo"`,
          parametrosProveedor
        );
        const mapaRucAProveedor = new Map(resultadoUpsert.rows.map((r) => [r.ruc, r]));

        const idsAfectados = resultadoUpsert.rows.map((r) => r.idProveedor);
        await cliente.query('DELETE FROM proveedor_unidad_negocio WHERE id_proveedor = ANY($1)', [idsAfectados]);

        const marcadoresUnidad = [];
        const parametrosUnidad = [];
        let contador = 0;
        for (const f of filasValidas) {
          const d = f.resultado.datos;
          const { idProveedor } = mapaRucAProveedor.get(d.ruc);
          for (const idUnidad of d.idsUnidad) {
            marcadoresUnidad.push(`($${contador + 1}, $${contador + 2}, $${contador + 3})`);
            parametrosUnidad.push(idProveedor, idUnidad, d.idsUnidadesCriticas.includes(idUnidad));
            contador += 3;
          }
        }
        if (marcadoresUnidad.length > 0) {
          await cliente.query(
            `INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad, es_critico) VALUES ${marcadoresUnidad.join(', ')}`,
            parametrosUnidad
          );
        }

        const salida = filasValidas.map((f) => {
          const d = f.resultado.datos;
          const { esNuevo } = mapaRucAProveedor.get(d.ruc);
          return { fila: f.numeroFila, ruc: d.ruc, estado: esNuevo ? 'creado' : 'actualizado', mensaje: null };
        });

        await registrarAuditoria({
          idUsuario: peticion.usuario.idUsuario,
          accion: `Carga masiva de proveedores: ${salida.filter((s) => s.estado === 'creado').length} creados, ${salida.filter((s) => s.estado === 'actualizado').length} actualizados, ${filasInvalidas.length} rechazados`,
          cliente
        });

        return salida;
      });
      reporte.push(...resultadosCommit);
    } catch (error) {
      console.error('Error al aplicar la carga masiva de proveedores:', error);
      return respuesta.status(500).json({
        exito: false,
        mensaje: 'No se pudo aplicar la carga masiva (no se guardó ningún cambio). Intente nuevamente; si el problema persiste, divida el archivo en lotes más pequeños.'
      });
    }
  }

  reporte.sort((a, b) => a.fila - b.fila);
  const resumen = {
    total: reporte.length,
    creados: reporte.filter((r) => r.estado === 'creado').length,
    actualizados: reporte.filter((r) => r.estado === 'actualizado').length,
    rechazados: reporte.filter((r) => r.estado === 'rechazado').length
  };

  return respuesta.status(200).json({ exito: true, resumen, filas: reporte });
};
