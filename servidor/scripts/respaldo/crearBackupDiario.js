import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';
import { cifrarContenido } from '../../pruebas/recuperacion/servicioCifradoBackup.js';
import { generarManifest, validarManifest } from '../../pruebas/recuperacion/servicioManifest.js';

const ejecutarComando = promisify(execFile);

function obtenerUrlBasesDatos() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('La variable de entorno DATABASE_URL es obligatoria y no está definida.');
  }
  return url;
}

function resolverDirectorioSalida(directorioParametro) {
  const dir = directorioParametro ?? process.env.BACKUP_OUTPUT_DIR ?? join(tmpdir(), 'sostenibilidad-backup-salida');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function obtenerVersionPostgres(clienteCoord) {
  const res = await clienteCoord.query('SELECT version() as v;');
  return res.rows[0].v;
}

export function parsearVersionPgDump(cadenaVersion) {
  if (!cadenaVersion || typeof cadenaVersion !== 'string') {
    throw new Error('Salida de versión de pg_dump inválida o vacía.');
  }
  const coincidencia = cadenaVersion.match(/pg_dump\s+\(PostgreSQL\)\s+(\d+)(?:\.(\d+))?/i);
  if (!coincidencia) {
    throw new Error(`No se pudo determinar la versión de pg_dump a partir de la salida: "${cadenaVersion.trim()}"`);
  }
  const versionMayor = parseInt(coincidencia[1], 10);
  const versionMenor = coincidencia[2] ? parseInt(coincidencia[2], 10) : 0;
  return { versionMayor, versionMenor, versionCompleta: `${versionMayor}.${versionMenor}` };
}

export function validarVersionPgDumpMinimo18(cadenaVersion) {
  const { versionMayor, versionCompleta } = parsearVersionPgDump(cadenaVersion);
  if (versionMayor < 18) {
    throw new Error(`Versión de pg_dump incompatible: se detectó versión ${versionCompleta}, pero se requiere como mínimo PostgreSQL 18.x para coincidir con el motor de Neon.`);
  }
  return true;
}

export const validarVersionPgDumpMayor18 = validarVersionPgDumpMinimo18;

export function obtenerBinarioPgDump() {
  return process.env.PG_DUMP_BIN ?? 'pg_dump';
}

export async function verificarBinarioPgDump18(binario = obtenerBinarioPgDump()) {
  const { stdout } = await ejecutarComando(binario, ['--version']);
  return validarVersionPgDumpMinimo18(stdout);
}

async function ejecutarPgDump(databaseUrl, snapshotId, rutaSalida) {
  const binario = obtenerBinarioPgDump();
  await verificarBinarioPgDump18(binario);

  const parsedUrl = new URL(databaseUrl);
  const args = [
    '--snapshot', snapshotId,
    '--format', 'plain',
    '--no-password',
    '--file', rutaSalida,
    databaseUrl
  ];

  const resultado = await ejecutarComando(binario, args, {
    env: { ...process.env, PGPASSWORD: parsedUrl.password },
    timeout: 5 * 60 * 1000
  });

  return resultado;
}

function determinarSsl(url) {
  const esLocal = url.includes('localhost') || url.includes('127.0.0.1') || process.env.DESHABILITAR_SSL === 'true';
  return esLocal ? false : { rejectUnauthorized: false };
}

export async function ejecutarBackupDiario({ claveEncriptado, directorioSalida = null, generadorDumpPersonalizado = null } = {}) {
  const databaseUrl = obtenerUrlBasesDatos();
  const clave = claveEncriptado ?? process.env.BACKUP_ENCRYPTION_KEY;

  if (!clave) {
    throw new Error('La variable de entorno BACKUP_ENCRYPTION_KEY es obligatoria para el backup.');
  }

  const dirDestino = resolverDirectorioSalida(directorioSalida);
  const rutaTemporal = join(tmpdir(), `dump_${randomBytes(8).toString('hex')}.sql`);

  const clienteCoord = new Client({ connectionString: databaseUrl, ssl: determinarSsl(databaseUrl) });
  await clienteCoord.connect();

  let snapshotId;
  let snapshotMvcc;
  let postgresVersion;

  try {
    await clienteCoord.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;');
    const resSnap = await clienteCoord.query('SELECT pg_export_snapshot() as snap_id, pg_current_snapshot()::text as snap_mvcc;');
    snapshotId = resSnap.rows[0].snap_id;
    snapshotMvcc = resSnap.rows[0].snap_mvcc;
    postgresVersion = await obtenerVersionPostgres(clienteCoord);

    if (generadorDumpPersonalizado) {
      await generadorDumpPersonalizado({ databaseUrl, snapshotId, rutaSalida: rutaTemporal, clienteCoord });
    } else {
      await ejecutarPgDump(databaseUrl, snapshotId, rutaTemporal);
    }

    await clienteCoord.query('COMMIT;');
  } catch (err) {
    await clienteCoord.query('ROLLBACK;').catch(() => {});
    if (existsSync(rutaTemporal)) {
      unlinkSync(rutaTemporal);
    }
    throw err;
  } finally {
    await clienteCoord.end();
  }

  let bufferCifrado;
  try {
    const contenidoPlano = await readFile(rutaTemporal);
    bufferCifrado = cifrarContenido(contenidoPlano, clave);
  } finally {
    await unlink(rutaTemporal).catch(() => {});
  }

  const manifest = generarManifest({
    snapshot: snapshotMvcc,
    postgresVersion,
    versionEsquema: '1.0.0',
    bufferDumpCifrado: bufferCifrado
  });

  const { valido, errores } = validarManifest(manifest, bufferCifrado);
  if (!valido) {
    throw new Error(`Validación SHA-256 del manifest fallida: ${errores.join('; ')}`);
  }

  const rutaBackupEnc = join(dirDestino, 'backup.enc');
  const rutaManifestJson = join(dirDestino, 'manifest.json');

  writeFileSync(rutaBackupEnc, bufferCifrado);
  writeFileSync(rutaManifestJson, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    manifest,
    tamanoBytes: bufferCifrado.length,
    snapshotId,
    snapshotMvcc,
    directorioSalida: dirDestino,
    rutaBackupEnc,
    rutaManifestJson
  };
}
