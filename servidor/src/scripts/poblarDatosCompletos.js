import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const permisos = [
  { codigo: 'GESTION_PROVEEDORES', descripcion: 'Visualizar, editar y gestionar estado de proveedores' },
  { codigo: 'BANCO_PREGUNTAS', descripcion: 'Crear y actualizar preguntas y alternativas de evaluación' },
  { codigo: 'CONFIGURACION_SISTEMA', descripcion: 'Administrar unidades de negocio e industrias' },
  { codigo: 'USUARIOS_ROLES', descripcion: 'Gestión de accesos, roles y usuarios del sistema' },
  { codigo: 'BITACORA_AUDITORIA', descripcion: 'Consulta de bitácora inmutable de trazabilidad' },
  { codigo: 'EXPORTAR_REPORTES', descripcion: 'Exportación de datos y consolidados a Excel' }
];

const proveedores = [
  { ruc: '20100070970', razonSocial: 'Alicorp S.A.A.', representante: 'Manuel Romero Caro', correo: 'contacto@alicorp.com.pe', tipo: 'Crítico', esCritico: true, idUnidad: 1, idIndustria: 1 },
  { ruc: '20100119227', razonSocial: 'Gloria S.A.', representante: 'Claudio Rodríguez Huaco', correo: 'proveedores@gloria.com.pe', tipo: 'Crítico', esCritico: true, idUnidad: 1, idIndustria: 1 },
  { ruc: '20512345678', razonSocial: 'Distribuidora Alimentos del Norte S.A.C.', representante: 'Carlos Mendoza Alva', correo: 'contacto@proveedor.com.pe', tipo: 'Regular', esCritico: false, idUnidad: 1, idIndustria: 1 },
  { ruc: '20254053822', razonSocial: 'Aceros Arequipa S.A.', representante: 'Ricardo Cillóniz Champin', correo: 'sostenibilidad@acerosarequipa.pe', tipo: 'Crítico', esCritico: true, idUnidad: 2, idIndustria: 4 },
  { ruc: '20452398411', razonSocial: 'Cementos Pacasmayo S.A.A.', representante: 'Humberto Nadal del Carpio', correo: 'proveedor@pacasmayo.com.pe', tipo: 'Crítico', esCritico: true, idUnidad: 2, idIndustria: 4 },
  { ruc: '20338574921', razonSocial: 'Textiles Camones S.A.', representante: 'Carlos Camones Sánchez', correo: 'ventas@camones.com.pe', tipo: 'Crítico', esCritico: true, idUnidad: 3, idIndustria: 3 },
  { ruc: '20601248593', razonSocial: 'Confecciones Andinas del Sur E.I.R.L.', representante: 'María Luisa Quispe', correo: 'informes@andinasur.pe', tipo: 'Regular', esCritico: false, idUnidad: 3, idIndustria: 3 },
  { ruc: '20509823417', razonSocial: 'Operador Logístico Ransa Comercial S.A.', representante: 'Tomás Moro Belmont', correo: 'atencion@ransa.net', tipo: 'Crítico', esCritico: true, idUnidad: 4, idIndustria: 2 },
  { ruc: '20100142806', razonSocial: 'Laboratorios Farmindustria S.A.', representante: 'Jorge Arévalo Silva', correo: 'corporativo@farmindustria.com.pe', tipo: 'Crítico', esCritico: true, idUnidad: 5, idIndustria: 5 },
  { ruc: '20491823741', razonSocial: 'Droguería Médica del Pacífico S.A.C.', representante: 'Elena Villacorta Peña', correo: 'contacto@medpacc.pe', tipo: 'Regular', esCritico: false, idUnidad: 5, idIndustria: 5 },
  { ruc: '20556677889', razonSocial: 'Soluciones Inmobiliarias y Propiedades S.A. (SIP)', representante: 'Fernando Carrillo Otero', correo: 'operaciones@sipcorp.pe', tipo: 'Crítico', esCritico: true, idUnidad: 6, idIndustria: 4 },
  { ruc: '20609988771', razonSocial: 'Shanghai Global Sourcing Retail Ltd.', representante: 'Wei Zhang Lin', correo: 'asia-support@intercorpretail.pe', tipo: 'Crítico', esCritico: true, idUnidad: 7, idIndustria: 2 }
];

const itemsPreguntas = [
  { codigo: 'AMB-01', enunciado: '¿La empresa cuenta con una política formalizada y documentada de gestión de residuos y reciclaje?', peso: 25.00, idDimension: 1 },
  { codigo: 'AMB-02', enunciado: '¿La empresa mide anualmente sus emisiones de gases de efecto invernadero (huella de carbono)?', peso: 25.00, idDimension: 1 },
  { codigo: 'SOC-01', enunciado: '¿Cuenta con un programa anual estructurado de desarrollo comunitario y apoyo local?', peso: 25.00, idDimension: 2 },
  { codigo: 'ETI-15', enunciado: '¿La empresa cuenta con un canal formalizado de denuncias anónimas para faltas éticas o fraude?', peso: 25.00, idDimension: 3 },
  { codigo: 'ETI-16', enunciado: '¿El canal de denuncias es administrado por una firma independiente que garantiza confidencialidad absoluta?', peso: 15.00, idDimension: 3 },
  { codigo: 'LAB-01', enunciado: '¿Todos los colaboradores se encuentran registrados en planilla electrónica conforme a la legislación peruana?', peso: 25.00, idDimension: 4 }
];

const alternativasPorItem = [
  { codigoItem: 'AMB-01', texto: 'Sí, formalizada, documentada y auditada anualmente', puntaje: 100.00 },
  { codigoItem: 'AMB-01', texto: 'Sí, formalizada pero sin auditoría externa', puntaje: 70.00 },
  { codigoItem: 'AMB-01', texto: 'En proceso de elaboración e implementación', puntaje: 40.00 },
  { codigoItem: 'AMB-01', texto: 'No cuenta con política formal de residuos', puntaje: 0.00 },
  { codigoItem: 'AMB-02', texto: 'Sí, con medición y certificación de Alcance 1, 2 y 3', puntaje: 100.00 },
  { codigoItem: 'AMB-02', texto: 'Sí, medición de Alcance 1 y 2 sin certificación externa', puntaje: 70.00 },
  { codigoItem: 'AMB-02', texto: 'En proceso de cálculo inicial', puntaje: 30.00 },
  { codigoItem: 'AMB-02', texto: 'No realiza medición de emisiones de carbono', puntaje: 0.00 },
  { codigoItem: 'SOC-01', texto: 'Sí, con presupuesto asignado e indicadores de impacto medidos', puntaje: 100.00 },
  { codigoItem: 'SOC-01', texto: 'Sí, con actividades periódicas sin indicadores formales', puntaje: 65.00 },
  { codigoItem: 'SOC-01', texto: 'Participaciones esporádicas no planificadas', puntaje: 35.00 },
  { codigoItem: 'SOC-01', texto: 'No cuenta con programas comunitarios', puntaje: 0.00 },
  { codigoItem: 'ETI-15', texto: 'Sí, canal gestionado por un tercero independiente con protección al denunciante', puntaje: 100.00 },
  { codigoItem: 'ETI-15', texto: 'Sí, canal interno formalizado y publicado', puntaje: 75.00 },
  { codigoItem: 'ETI-15', texto: 'Buzón de sugerencias o correo sin garantía de anonimato', puntaje: 30.00 },
  { codigoItem: 'ETI-15', texto: 'No dispone de canal de denuncias formal', puntaje: 0.00 },
  { codigoItem: 'ETI-16', texto: 'Sí, firma externa internacional con certificación de secreto profesional', puntaje: 100.00 },
  { codigoItem: 'ETI-16', texto: 'Sí, estudio jurídico externo nacional', puntaje: 70.00 },
  { codigoItem: 'ETI-16', texto: 'Comité interno de cumplimiento corporativo', puntaje: 40.00 },
  { codigoItem: 'ETI-16', texto: 'No cuenta con administración externa ni especializada', puntaje: 0.00 },
  { codigoItem: 'LAB-01', texto: '100% formalizados en planilla electrónica con auditorías laborales periódicas', puntaje: 100.00 },
  { codigoItem: 'LAB-01', texto: '100% formalizados en planilla sin auditorías periódicas', puntaje: 80.00 },
  { codigoItem: 'LAB-01', texto: 'Mayoría en planilla con personal bajo regularización', puntaje: 40.00 },
  { codigoItem: 'LAB-01', texto: 'No se tiene registro formal unificado', puntaje: 0.00 }
];

const usuarios = [
  { nombre: 'Leonardo Raul Solano Pio Huaman', correo: 'lsolano@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 1, idUnidad: 1 },
  { nombre: 'Carloman Coronel Cruz', correo: 'ccoronel@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 2, idUnidad: 1 },
  { nombre: 'Carlos Juniors Chiroque Silva', correo: 'cchiroque@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 2, idUnidad: 1 },
  { nombre: 'Frank Alex Beltran Ponce', correo: 'fbeltran@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 2, idUnidad: 2 },
  { nombre: 'Gianfranco Daniel Navarro Flores', correo: 'gnavarro@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 4, idUnidad: 4 },
  { nombre: 'Mariella Prado', correo: 'mprado@intercorpretail.pe', claveHash: 'hash_demo_123', idRol: 1, idUnidad: 1 }
];

const registrosAuditoria = [
  { accion: 'Inicio de sesión exitoso en consola administrativa corporativa', fecha: '2026-09-12 14:42:51', correoUsuario: 'lsolano@intercorpretail.pe' },
  { accion: 'Validación de código OTP para acceso de proveedor', fecha: '2026-09-12 14:07:05', correoUsuario: 'lsolano@intercorpretail.pe' },
  { accion: 'Exportación a Excel del consolidado maestro de proveedores', fecha: '2026-09-12 13:58:30', correoUsuario: 'lsolano@intercorpretail.pe' },
  { accion: 'Actualización de criticidad y clasificación de proveedor', fecha: '2026-09-11 16:20:15', correoUsuario: 'cchiroque@intercorpretail.pe' },
  { accion: 'Registro de ítem condicional ETI-16 en banco de preguntas', fecha: '2026-09-10 10:14:02', correoUsuario: 'ccoronel@intercorpretail.pe' }
];

async function poblar() {
  const cliente = new Client({
    connectionString: process.env.URL_BASE_DATOS,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await cliente.connect();
    console.log('Conectado a Neon PostgreSQL para poblar datos...');

    for (const perm of permisos) {
      await cliente.query(`
        INSERT INTO permiso (codigo, descripcion)
        VALUES ($1, $2)
        ON CONFLICT (codigo) DO NOTHING;
      `, [perm.codigo, perm.descripcion]);
    }

    const resPerms = await cliente.query('SELECT id_permiso FROM permiso;');
    for (const p of resPerms.rows) {
      await cliente.query(`
        INSERT INTO rol_permiso (fk_id_rol, fk_id_permiso)
        VALUES (1, $1)
        ON CONFLICT DO NOTHING;
      `, [p.id_permiso]);
    }

    for (const p of proveedores) {
      await cliente.query(`
        INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, es_critico, fk_id_unidad, fk_id_industria)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (ruc) DO UPDATE SET
          razon_social = EXCLUDED.razon_social,
          representante = EXCLUDED.representante,
          correo = EXCLUDED.correo,
          tipo = EXCLUDED.tipo,
          es_critico = EXCLUDED.es_critico;
      `, [p.ruc, p.razonSocial, p.representante, p.correo, p.tipo, p.esCritico, p.idUnidad, p.idIndustria]);
    }

    for (const item of itemsPreguntas) {
      await cliente.query(`
        INSERT INTO item (codigo, enunciado, peso, fk_id_dimension)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (codigo) DO UPDATE SET
          enunciado = EXCLUDED.enunciado,
          peso = EXCLUDED.peso;
      `, [item.codigo, item.enunciado, item.peso, item.idDimension]);
    }

    const mapaItems = {};
    const resItemsQuery = await cliente.query('SELECT id_item, codigo FROM item;');
    for (const fila of resItemsQuery.rows) {
      mapaItems[fila.codigo] = fila.id_item;
    }

    await cliente.query('DELETE FROM respuesta;');
    await cliente.query('DELETE FROM alternativa;');
    await cliente.query('DELETE FROM regla_condicional;');
    await cliente.query('DELETE FROM auditoria;');

    for (const alt of alternativasPorItem) {
      const idItem = mapaItems[alt.codigoItem];
      if (idItem) {
        await cliente.query(`
          INSERT INTO alternativa (texto, puntaje, fk_id_item)
          VALUES ($1, $2, $3);
        `, [alt.texto, alt.puntaje, idItem]);
      }
    }

    const resIndustriasQuery = await cliente.query('SELECT id_industria FROM industria;');
    for (const itemCod of Object.keys(mapaItems)) {
      const idItem = mapaItems[itemCod];
      for (const ind of resIndustriasQuery.rows) {
        await cliente.query(`
          INSERT INTO item_industria (obligatorio, fk_id_item, fk_id_industria)
          VALUES (true, $1, $2)
          ON CONFLICT (fk_id_item, fk_id_industria) DO NOTHING;
        `, [idItem, ind.id_industria]);
      }
    }

    if (mapaItems['ETI-15'] && mapaItems['ETI-16']) {
      await cliente.query(`
        INSERT INTO regla_condicional (valor_disparador, accion, fk_id_item_origen, fk_id_item_destino)
        VALUES ('100', 'Habilitar', $1, $2);
      `, [mapaItems['ETI-15'], mapaItems['ETI-16']]);
    }

    for (const u of usuarios) {
      await cliente.query(`
        INSERT INTO usuario (nombre, correo, clave_hash, estado, fk_id_rol, fk_id_unidad)
        VALUES ($1, $2, $3, true, $4, $5)
        ON CONFLICT (correo) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          fk_id_rol = EXCLUDED.fk_id_rol;
      `, [u.nombre, u.correo, u.claveHash, u.idRol, u.idUnidad]);
    }

    const resAlicorp = await cliente.query("SELECT id_proveedor FROM proveedor WHERE ruc = '20100070970';");
    const resGloria = await cliente.query("SELECT id_proveedor FROM proveedor WHERE ruc = '20100119227';");
    const resRansa = await cliente.query("SELECT id_proveedor FROM proveedor WHERE ruc = '20509823417';");

    const proveedoresEvaluados = [
      { idProveedor: resAlicorp.rows[0]?.id_proveedor, puntajeTotal: 88.00, ambiental: 85.00, social: 90.00, etica: 92.00, laboral: 85.00 },
      { idProveedor: resGloria.rows[0]?.id_proveedor, puntajeTotal: 82.00, ambiental: 78.00, social: 85.00, etica: 88.00, laboral: 77.00 },
      { idProveedor: resRansa.rows[0]?.id_proveedor, puntajeTotal: 95.00, ambiental: 96.00, social: 94.00, etica: 95.00, laboral: 95.00 }
    ];

    for (const pe of proveedoresEvaluados) {
      if (pe.idProveedor) {
        const token = `eval-${pe.idProveedor}-2026`;
        const resEval = await cliente.query(`
          INSERT INTO evaluacion (token, estado, fecha_envio, puntaje_total, fk_id_campania, fk_id_proveedor)
          VALUES ($1, 'Completada', CURRENT_TIMESTAMP, $2, 1, $3)
          ON CONFLICT (token) DO UPDATE SET puntaje_total = EXCLUDED.puntaje_total
          RETURNING id_evaluacion;
        `, [token, pe.puntajeTotal, pe.idProveedor]);

        const idEval = resEval.rows[0].id_evaluacion;

        const scores = [
          { dim: 1, val: pe.ambiental },
          { dim: 2, val: pe.social },
          { dim: 3, val: pe.etica },
          { dim: 4, val: pe.laboral }
        ];

        for (const s of scores) {
          await cliente.query(`
            INSERT INTO puntaje_dimension (valor, fk_id_evaluacion, fk_id_dimension)
            VALUES ($1, $2, $3)
            ON CONFLICT (fk_id_evaluacion, fk_id_dimension) DO UPDATE SET valor = EXCLUDED.valor;
          `, [s.val, idEval, s.dim]);
        }

        const resAltsParaResp = await cliente.query('SELECT id_alternativa FROM alternativa LIMIT 5;');
        for (const altR of resAltsParaResp.rows) {
          await cliente.query(`
            INSERT INTO respuesta (fk_id_evaluacion, fk_id_alternativa)
            VALUES ($1, $2);
          `, [idEval, altR.id_alternativa]);
        }
      }
    }

    const resUserAdmin = await cliente.query("SELECT id_usuario FROM usuario WHERE correo = 'lsolano@intercorpretail.pe';");
    const idAdmin = resUserAdmin.rows[0]?.id_usuario;

    for (const aud of registrosAuditoria) {
      await cliente.query(`
        INSERT INTO auditoria (accion, fecha, fk_id_usuario)
        VALUES ($1, $2::timestamp, $3);
      `, [aud.accion, aud.fecha, idAdmin || 1]);
    }

    console.log('Poblado integral completado con exito.');
    await cliente.end();
  } catch (error) {
    console.error('Error al poblar:', error);
    await cliente.end();
    process.exit(1);
  }
}

poblar();
