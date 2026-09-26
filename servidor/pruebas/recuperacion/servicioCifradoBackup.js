import crypto from 'node:crypto';

const ALGORITMO_CIFRADO = 'aes-256-gcm';
const LONGITUD_VECTOR_INICIALIZACION_BYTES = 12;
const LONGITUD_ETIQUETA_AUTENTICACION_BYTES = 16;
const LONGITUD_CLAVE_BYTES = 32;

export function normalizarClaveCifrado(claveEntrada) {
  if (Buffer.isBuffer(claveEntrada)) {
    if (claveEntrada.length === LONGITUD_CLAVE_BYTES) {
      return claveEntrada;
    }
    return crypto.createHash('sha256').update(claveEntrada).digest();
  }
  if (typeof claveEntrada === 'string') {
    if (claveEntrada.length === 64 && /^[0-9a-fA-F]+$/.test(claveEntrada)) {
      return Buffer.from(claveEntrada, 'hex');
    }
    return crypto.createHash('sha256').update(claveEntrada, 'utf8').digest();
  }
  throw new Error('Formato de clave de cifrado inválido. Se requiere cadena de texto o Buffer.');
}

export function cifrarContenido(datosEntrada, claveEntrada) {
  const claveBinaria = normalizarClaveCifrado(claveEntrada);
  const bufferDatos = Buffer.isBuffer(datosEntrada)
    ? datosEntrada
    : Buffer.from(typeof datosEntrada === 'string' ? datosEntrada : JSON.stringify(datosEntrada), 'utf8');

  const vectorInicializacion = crypto.randomBytes(LONGITUD_VECTOR_INICIALIZACION_BYTES);
  const cifrador = crypto.createCipheriv(ALGORITMO_CIFRADO, claveBinaria, vectorInicializacion);

  const datosCifrados = Buffer.concat([cifrador.update(bufferDatos), cifrador.final()]);
  const etiquetaAutenticacion = cifrador.getAuthTag();

  return Buffer.concat([
    vectorInicializacion,
    etiquetaAutenticacion,
    datosCifrados
  ]);
}

export function descifrarContenido(paqueteCifrado, claveEntrada) {
  const claveBinaria = normalizarClaveCifrado(claveEntrada);
  const bufferPaquete = Buffer.isBuffer(paqueteCifrado)
    ? paqueteCifrado
    : Buffer.from(paqueteCifrado);

  const longitudMinima = LONGITUD_VECTOR_INICIALIZACION_BYTES + LONGITUD_ETIQUETA_AUTENTICACION_BYTES;
  if (bufferPaquete.length < longitudMinima) {
    throw new Error('El paquete cifrado está truncado o es inválido.');
  }

  const vectorInicializacion = bufferPaquete.subarray(0, LONGITUD_VECTOR_INICIALIZACION_BYTES);
  const etiquetaAutenticacion = bufferPaquete.subarray(
    LONGITUD_VECTOR_INICIALIZACION_BYTES,
    longitudMinima
  );
  const cargaCifrada = bufferPaquete.subarray(longitudMinima);

  const descifrador = crypto.createDecipheriv(ALGORITMO_CIFRADO, claveBinaria, vectorInicializacion);
  descifrador.setAuthTag(etiquetaAutenticacion);

  return Buffer.concat([descifrador.update(cargaCifrada), descifrador.final()]);
}
