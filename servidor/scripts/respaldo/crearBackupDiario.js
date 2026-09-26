import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createReadStream, createWriteStream, existsSync, unlinkSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';
import { cifrarContenido } from '../pruebas/recuperacion/servicioCifradoBackup.js';
import { generarManifest, validarManifest } from '../pruebas/recuperacion/servicioManifest.js';
import { subirObjetoBackup } from './clienteR2Backup.js';

const ejecutarComando = promisify(execFile);

function obtenerUrlBasesDatos() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('La variable de entorno DATABASE_URL es obligatoria y no está definida.');
  }
  return url;
}

function construirClaveFull(fecha) {
  const d = fecha.toISOString().slice(0, 10);
  return `database-backups/full/${d}/backup.enc`;
}

function construirClaveManifest(fecha) {
  const d = fecha.toISOString().slice(0, 10);
  return `database-backups/full/${d}/manifest.json`;
}

async function obtenerVersionPostgres(clienteCoord) {
  const res = await clienteCoord.query('SELECT version() as v;');
  return res.rows[0].v;
}

async function ejecutarPgDump(databaseUrl, snapshotId, rutaSalida) {
  const parsedUrl = new URL(databaseUrl);
  const args = [
    '--snapshot', snapshotId,
    '--format', 'plain',
    '--no-password',
    '--file', rutaSalida,
    databaseUrl
  ];

  const resultado = await ejecutarComando('pg_dump', args, {
    env: { ...process.env, PGPASSWORD: parsedUrl.password },
    timeout: 5 * 60 * 1000
  });

  return resultado;
}

export async function ejecutarBackupDiario({ claveEncriptado, subirAR2 = true, generadorDumpPersonalizado = null } = {}) {
  const databaseUrl = obtenerUrlBasesDatos();
  const clave = claveEncriptado ?? process.env.BACKUP_ENCRYPTION_KEY;

  if (!clave) {
    throw new Error('La variable de entorno BACKUP_ENCRYPTION_KEY es obligatoria para el backup.');
  }

  const fechaBackup = new Date();
  const rutaTemporal = join(tmpdir(), `dump_${randomBytes(8).toString('hex')}.sql`);

  const clienteCoord = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
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

  if (subirAR2) {
    const claveBackup = construirClaveFull(fechaBackup);
    const claveManif = construirClaveManifest(fechaBackup);
    await subirObjetoBackup(claveBackup, bufferCifrado);
    await subirObjetoBackup(claveManif, Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
  }

  return { manifest, tamanoBytes: bufferCifrado.length, snapshotId, snapshotMvcc };
}
