import crypto from 'node:crypto';

const VERSION_FORMATO_MANIFEST = 1;
const ALGORITMO_CIFRADO = 'AES-256-GCM';

export function calcularSha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function generarManifest({
  snapshot,
  postgresVersion,
  versionEsquema,
  bufferDumpCifrado
}) {
  if (!snapshot || !postgresVersion || !bufferDumpCifrado) {
    throw new Error('Parámetros obligatorios del manifest faltantes: snapshot, postgresVersion, bufferDumpCifrado.');
  }

  const sha256DumpCifrado = calcularSha256Hex(bufferDumpCifrado);

  return {
    version: VERSION_FORMATO_MANIFEST,
    fechaBackup: new Date().toISOString(),
    snapshot,
    postgresVersion,
    versionEsquema: versionEsquema ?? 'desconocida',
    algoritmoCifrado: ALGORITMO_CIFRADO,
    sha256DumpCifrado,
    tamanoDumpCifradoBytes: bufferDumpCifrado.length
  };
}

export function validarManifest(manifest, bufferDumpCifrado) {
  const errores = [];

  if (manifest.version !== VERSION_FORMATO_MANIFEST) {
    errores.push(`Versión de formato no reconocida: ${manifest.version}`);
  }
  if (!manifest.snapshot || typeof manifest.snapshot !== 'string') {
    errores.push('Campo snapshot ausente o inválido.');
  }
  if (!manifest.postgresVersion) {
    errores.push('Campo postgresVersion ausente.');
  }
  if (!manifest.sha256DumpCifrado) {
    errores.push('Campo sha256DumpCifrado ausente.');
  }
  if (!manifest.algoritmoCifrado || manifest.algoritmoCifrado !== ALGORITMO_CIFRADO) {
    errores.push(`Algoritmo de cifrado inesperado: ${manifest.algoritmoCifrado}`);
  }

  if (bufferDumpCifrado) {
    const sha256Real = calcularSha256Hex(bufferDumpCifrado);
    if (sha256Real !== manifest.sha256DumpCifrado) {
      errores.push(`Integridad SHA-256 fallida. Esperado: ${manifest.sha256DumpCifrado}. Obtenido: ${sha256Real}`);
    }
  }

  if (manifest.tamanoDumpCifradoBytes !== undefined && bufferDumpCifrado) {
    if (bufferDumpCifrado.length !== manifest.tamanoDumpCifradoBytes) {
      errores.push(`Tamaño cifrado inconsistente. Manifest: ${manifest.tamanoDumpCifradoBytes}. Real: ${bufferDumpCifrado.length}`);
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}
