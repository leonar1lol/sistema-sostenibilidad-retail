// Reglas de validación de datos de proveedor, compartidas entre el alta individual
// (admin y portal) y la carga masiva por Excel, para que ambos caminos exijan lo mismo.

export const TIPOS_VALIDOS = ['Retail', 'No retail'];
export const TAMANOS_VALIDOS = ['MYPE', 'PYME', 'Gran empresa'];
export const ANIOS_OPERACION_VALIDOS = ['Menos de 2 años', 'De 2 a 5 años', 'De 6 a 10 años', 'Más de 10 años'];

const LIMITES_LONGITUD = {
  ruc: 11,
  razonSocial: 200,
  nombreComercial: 200,
  direccionFiscal: 255,
  departamento: 100,
  representante: 160,
  cargoRepresentante: 120,
  telefono: 30,
  correo: 160,
  tamanoEmpresa: 80,
  aniosOperacion: 50,
  sitioWeb: 255
};

const PATRON_RUC = /^\d{11}$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ponytail: se rechaza cualquier campo de texto cuyo valor (tras recortar espacios)
// empiece con un disparador de fórmula de hoja de cálculo (=, +, -, @) en vez de
// neutralizarlo en silencio, para no transformar datos del usuario sin avisarle y
// para que un intento de inyección de fórmulas (CSV/XLSX injection) quede como fila
// rechazada, nunca como fila cargada.
const INICIA_CON_DISPARADOR_FORMULA = /^[=+\-@]/;

export function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return '';
  // elimina caracteres de control (incluye null byte) y recorta espacios en los extremos
  return String(valor).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export function normalizarTamanoEmpresa(valorCrudo) {
  const valor = normalizarTexto(valorCrudo);
  if (!valor) return '';
  if (TAMANOS_VALIDOS.includes(valor)) return valor;
  if (/micro|pequeñ|mype/i.test(valor)) return 'MYPE';
  if (/median|pyme/i.test(valor)) return 'PYME';
  if (/gran/i.test(valor)) return 'Gran empresa';
  return null; // valor presente pero no reconocible
}

function campoFormulaInsegura(valor) {
  return INICIA_CON_DISPARADOR_FORMULA.test(valor);
}

function validarLongitud(errores, etiqueta, valor, clave) {
  if (valor && valor.length > LIMITES_LONGITUD[clave]) {
    errores.push(`${etiqueta} supera los ${LIMITES_LONGITUD[clave]} caracteres permitidos.`);
  }
}

/**
 * Valida y normaliza una fila de datos de proveedor.
 * @param {object} fila - campos crudos de la fila (strings, posiblemente vacíos)
 * @param {object} contexto - { mapaIndustrias: Map<nombreLower, idIndustria>, mapaUnidades: Map<nombreLower, {idUnidad, nombre}> }
 * @returns {{valido: boolean, errores: string[], datos: object}}
 */
export function validarFilaProveedor(fila, contexto) {
  const errores = [];
  const { mapaIndustrias, mapaUnidades } = contexto;

  const ruc = normalizarTexto(fila.ruc);
  const razonSocial = normalizarTexto(fila.razonSocial);
  const nombreComercial = normalizarTexto(fila.nombreComercial);
  const correo = normalizarTexto(fila.correo).toLowerCase();
  const representante = normalizarTexto(fila.representante);
  const cargoRepresentante = normalizarTexto(fila.cargoRepresentante);
  const telefono = normalizarTexto(fila.telefono);
  const direccionFiscal = normalizarTexto(fila.direccionFiscal);
  const departamento = normalizarTexto(fila.departamento);
  const sitioWeb = normalizarTexto(fila.sitioWeb);
  const tipoCrudo = normalizarTexto(fila.tipo);
  const industriaNombre = normalizarTexto(fila.industriaNombre);
  const aniosOperacion = normalizarTexto(fila.aniosOperacion);

  if (!PATRON_RUC.test(ruc)) {
    errores.push('El RUC debe tener exactamente 11 dígitos numéricos.');
  }
  if (!razonSocial) {
    errores.push('La razón social es obligatoria.');
  }
  if (!correo || !PATRON_CORREO.test(correo)) {
    errores.push('El correo no tiene un formato válido.');
  }

  const tipo = TIPOS_VALIDOS.find((t) => t.toLowerCase() === tipoCrudo.toLowerCase());
  if (!tipo) {
    errores.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  let idIndustria = null;
  if (!industriaNombre) {
    errores.push('La industria es obligatoria.');
  } else {
    idIndustria = mapaIndustrias.get(industriaNombre.toLowerCase()) || null;
    if (!idIndustria) {
      errores.push(`La industria "${industriaNombre}" no existe en el catálogo.`);
    }
  }

  const nombresUnidades = normalizarTexto(fila.unidadesNombres)
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  const idsUnidad = [];
  if (nombresUnidades.length === 0) {
    errores.push('Debe indicar al menos una unidad de negocio.');
  } else {
    for (const nombre of nombresUnidades) {
      const unidad = mapaUnidades.get(nombre.toLowerCase());
      if (!unidad) {
        errores.push(`La unidad de negocio "${nombre}" no existe en el catálogo.`);
      } else if (!idsUnidad.includes(unidad.idUnidad)) {
        idsUnidad.push(unidad.idUnidad);
      }
    }
  }

  const nombresUnidadesCriticas = normalizarTexto(fila.unidadesCriticasNombres)
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  const idsUnidadesCriticas = [];
  for (const nombre of nombresUnidadesCriticas) {
    const unidad = mapaUnidades.get(nombre.toLowerCase());
    if (!unidad) {
      errores.push(`La unidad crítica "${nombre}" no existe en el catálogo.`);
    } else if (!idsUnidad.includes(unidad.idUnidad)) {
      errores.push(`La unidad crítica "${nombre}" debe estar también en la lista de unidades de negocio.`);
    } else {
      idsUnidadesCriticas.push(unidad.idUnidad);
    }
  }

  let tamanoEmpresa = '';
  if (fila.tamanoEmpresa !== undefined && normalizarTexto(fila.tamanoEmpresa) !== '') {
    tamanoEmpresa = normalizarTamanoEmpresa(fila.tamanoEmpresa);
    if (tamanoEmpresa === null) {
      errores.push(`El tamaño de empresa debe ser uno de: ${TAMANOS_VALIDOS.join(', ')}.`);
      tamanoEmpresa = '';
    }
  }

  if (aniosOperacion && !ANIOS_OPERACION_VALIDOS.includes(aniosOperacion)) {
    errores.push(`Los años de operación deben ser uno de: ${ANIOS_OPERACION_VALIDOS.join(', ')}.`);
  }

  const camposTexto = { razonSocial, nombreComercial, representante, cargoRepresentante, direccionFiscal, departamento, sitioWeb };
  for (const [clave, valor] of Object.entries(camposTexto)) {
    if (valor && campoFormulaInsegura(valor)) {
      errores.push(`El campo "${clave}" no puede iniciar con =, +, - ni @ (posible fórmula insegura).`);
    }
  }

  validarLongitud(errores, 'La razón social', razonSocial, 'razonSocial');
  validarLongitud(errores, 'El nombre comercial', nombreComercial, 'nombreComercial');
  validarLongitud(errores, 'La dirección fiscal', direccionFiscal, 'direccionFiscal');
  validarLongitud(errores, 'El departamento', departamento, 'departamento');
  validarLongitud(errores, 'El representante', representante, 'representante');
  validarLongitud(errores, 'El cargo del representante', cargoRepresentante, 'cargoRepresentante');
  validarLongitud(errores, 'El teléfono', telefono, 'telefono');
  validarLongitud(errores, 'El correo', correo, 'correo');
  validarLongitud(errores, 'El sitio web', sitioWeb, 'sitioWeb');

  return {
    valido: errores.length === 0,
    errores,
    datos: {
      ruc,
      razonSocial,
      nombreComercial: nombreComercial || null,
      correo,
      representante: representante || null,
      cargoRepresentante: cargoRepresentante || null,
      telefono: telefono || null,
      direccionFiscal: direccionFiscal || null,
      departamento: departamento || null,
      sitioWeb: sitioWeb || null,
      tipo: tipo || null,
      idIndustria,
      idsUnidad,
      idsUnidadesCriticas,
      tamanoEmpresa: tamanoEmpresa || null,
      aniosOperacion: aniosOperacion || null
    }
  };
}
