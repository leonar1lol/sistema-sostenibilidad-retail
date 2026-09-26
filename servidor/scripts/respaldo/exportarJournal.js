import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from 'pg';
import { cifrarContenido } from '../../pruebas/recuperacion/servicioCifradoBackup.js';
import { calcularSha256Hex } from '../../pruebas/recuperacion/servicioManifest.js';

function obtenerUrlBasesDatos() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('La variable de entorno DATABASE_URL es obligatoria y no está definida.');
  }
  return url;
}

function resolverDirectorioSalida(directorioParametro) {
  const dir = directorioParametro ?? process.env.BACKUP_OUTPUT_DIR ?? join(tmpdir(), 'sostenibilidad-journal-salida');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function determinarSsl(url) {
  const esLocal = url.includes('localhost') || url.includes('127.0.0.1') || process.env.DESHABILITAR_SSL === 'true';
  return esLocal ? false : { rejectUnauthorized: false };
}

export async function exportarJournal({ desde, hasta, claveEncriptado, directorioSalida = null } = {}) {
  const databaseUrl = obtenerUrlBasesDatos();
  const clave = claveEncriptado ?? process.env.BACKUP_ENCRYPTION_KEY;

  if (!clave) {
    throw new Error('La variable de entorno BACKUP_ENCRYPTION_KEY es obligatoria para exportar el journal.');
  }

  const dirDestino = resolverDirectorioSalida(directorioSalida);
  const desdeDate = desde ? new Date(desde) : new Date(Date.now() - 2 * 60 * 60 * 1000);
  const hastaDate = hasta ? new Date(hasta) : new Date();

  const cliente = new Client({ connectionString: databaseUrl, ssl: determinarSsl(databaseUrl) });
  await cliente.connect();

  let eventos;
  try {
    const res = await cliente.query(
      `SELECT
        id_registro,
        nombre_tabla,
        operacion,
        clave_primaria,
        datos_anteriores,
        datos_nuevos,
        fecha_evento,
        fecha_cierre_transaccion_aprox,
        xid_transaccion,
        id_transaccion
      FROM registro_recuperacion
      WHERE fecha_evento >= $1
        AND fecha_evento < $2
      ORDER BY id_registro ASC;`,
      [desdeDate.toISOString(), hastaDate.toISOString()]
    );
    eventos = res.rows;
  } finally {
    await cliente.end();
  }

  const jsonEventos = JSON.stringify({
    ventanaDesde: desdeDate.toISOString(),
    ventanaHasta: hastaDate.toISOString(),
    totalEventos: eventos.length,
    eventos
  }, null, 2);

  const bufferCifrado = cifrarContenido(jsonEventos, clave);
  const sha256JournalCifrado = calcularSha256Hex(bufferCifrado);

  const metadatos = {
    tipo: 'journal',
    version: 1,
    ventanaDesde: desdeDate.toISOString(),
    ventanaHasta: hastaDate.toISOString(),
    totalEventos: eventos.length,
    algoritmoCifrado: 'AES-256-GCM',
    sha256JournalCifrado,
    tamanoBytes: bufferCifrado.length,
    generadoEn: new Date().toISOString()
  };

  const rutaJournalEnc = join(dirDestino, 'journal.enc');
  const rutaManifestJson = join(dirDestino, 'manifest.json');

  writeFileSync(rutaJournalEnc, bufferCifrado);
  writeFileSync(rutaManifestJson, JSON.stringify(metadatos, null, 2), 'utf8');

  return {
    metadatos,
    tamanoBytes: bufferCifrado.length,
    directorioSalida: dirDestino,
    rutaJournalEnc,
    rutaManifestJson
  };
}
