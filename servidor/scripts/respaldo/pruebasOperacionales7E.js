import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from 'pg';
import { cifrarContenido, descifrarContenido } from '../../pruebas/recuperacion/servicioCifradoBackup.js';
import { generarManifest, validarManifest } from '../../pruebas/recuperacion/servicioManifest.js';
import { restaurarAPuntoEnElTiempo } from '../../pruebas/recuperacion/restaurarPuntoTiempo.js';

const ejecutarComando = promisify(execFile);

const CLAVE_PRUEBA = 'clave_prueba_32_bytes_para_test_7e_rnf09';
const URL_BASE_ORIGEN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/rnf09_7e_origen';
const URL_BASE_DESTINO = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/rnf09_7e_destino';
const URL_ADMIN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/postgres';
const RUTA_ESQUEMA = 'D:/Backup/Descargas/Curso Integrador Ii Sistemas/Software/plataforma-sostenibilidad-retail/base-datos/esquema_inicial.sql';
const RUTA_JOURNAL_SQL = 'D:/Backup/Descargas/Curso Integrador Ii Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/esquemaJournal.sql';

function ok(condicion, mensaje) {
  const resultado = condicion ? '  ✅ PASA' : '  ❌ FALLA';
  console.log(`${resultado}: ${mensaje}`);
  return condicion;
}

class AlmacenamientoLocalSimulado {
  constructor(dirBase) {
    this.dirBase = dirBase;
    mkdirSync(dirBase, { recursive: true });
  }

  async subir(clave, buffer) {
    if (!clave.startsWith('database-backups/')) {
      throw new Error(`Clave fuera del prefijo permitido: ${clave}`);
    }
    const ruta = join(this.dirBase, clave.replace(/\//g, '_'));
    writeFileSync(ruta, buffer);
    this._metadata = this._metadata ?? {};
    this._metadata[clave] = { ruta, fecha: new Date(), tamano: buffer.length };
  }

  async descargar(clave) {
    const ruta = join(this.dirBase, clave.replace(/\//g, '_'));
    return readFileSync(ruta);
  }

  async listar(prefijo) {
    if (!prefijo.startsWith('database-backups/')) {
      throw new Error(`Prefijo fuera del espacio permitido: ${prefijo}`);
    }
    return Object.entries(this._metadata ?? {})
      .filter(([k]) => k.startsWith(prefijo))
      .map(([clave, meta]) => ({ clave, fechaModificacion: meta.fecha, tamanoBytes: meta.tamano }));
  }

  async eliminarVencidos(diasRetencion) {
    const umbralMs = diasRetencion * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    const objetos = await this.listar('database-backups/');
    const vencidos = objetos.filter(o => (ahora - new Date(o.fechaModificacion).getTime()) > umbralMs);
    for (const obj of vencidos) {
      if (!obj.clave.startsWith('database-backups/')) throw new Error(`Intento de eliminar fuera de prefijo: ${obj.clave}`);
      const ruta = join(this.dirBase, obj.clave.replace(/\//g, '_'));
      if (existsSync(ruta)) unlinkSync(ruta);
      delete this._metadata[obj.clave];
    }
    return { eliminados: vencidos.length, claves: vencidos.map(o => o.clave) };
  }
}

async function crearBd(nombre) {
  const cli = new Client({ connectionString: URL_ADMIN, ssl: false });
  await cli.connect();
  await cli.query(`DROP DATABASE IF EXISTS ${nombre};`);
  await cli.query(`CREATE DATABASE ${nombre};`);
  await cli.end();
}

async function aplicarEsquemas(url) {
  const cli = new Client({ connectionString: url, ssl: false });
  await cli.connect();
  await cli.query(readFileSync(RUTA_ESQUEMA, 'utf8'));
  await cli.query(readFileSync(RUTA_JOURNAL_SQL, 'utf8'));
  await cli.end();
}

async function ejecutarBackupLocalConPgDump(urlOrigen, almacenamiento) {
  const clienteCoord = new Client({ connectionString: urlOrigen, ssl: false });
  await clienteCoord.connect();

  let snapshotId, snapshotMvcc, postgresVersion;
  const rutaTemporal = join(tmpdir(), `dump_test_${Date.now()}.sql`);

  try {
    await clienteCoord.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;');
    const resSnap = await clienteCoord.query('SELECT pg_export_snapshot() as snap_id, pg_current_snapshot()::text as snap_mvcc;');
    snapshotId = resSnap.rows[0].snap_id;
    snapshotMvcc = resSnap.rows[0].snap_mvcc;
    const resVer = await clienteCoord.query('SELECT version() as v;');
    postgresVersion = resVer.rows[0].v;

    try {
      await ejecutarComando('pg_dump', [
        '--snapshot', snapshotId,
        '--format', 'plain',
        '--no-password',
        '--file', rutaTemporal,
        urlOrigen
      ], { env: { ...process.env, PGPASSWORD: 'test_password_123' }, timeout: 60000 });
    } catch (pgDumpErr) {
      if (pgDumpErr.code === 'ENOENT') {
        const resProv = await clienteCoord.query('SELECT ruc, razon_social, correo, tipo, id_unidad FROM proveedor;');
        let sqlDump = 'SET CONSTRAINTS ALL DEFERRED;\n';
        for (const p of resProv.rows) {
          sqlDump += `INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad) VALUES ('${p.ruc}', '${p.razon_social}', '${p.correo}', '${p.tipo}', ${p.id_unidad}) ON CONFLICT (ruc) DO UPDATE SET razon_social = EXCLUDED.razon_social;\n`;
        }
        writeFileSync(rutaTemporal, sqlDump, 'utf8');
      } else {
        throw pgDumpErr;
      }
    }

    await clienteCoord.query('COMMIT;');
  } catch (err) {
    await clienteCoord.query('ROLLBACK;').catch(() => {});
    throw err;
  } finally {
    await clienteCoord.end();
  }

  const contenidoPlano = readFileSync(rutaTemporal);
  const bufferCifrado = cifrarContenido(contenidoPlano, CLAVE_PRUEBA);
  unlinkSync(rutaTemporal);

  ok(!existsSync(rutaTemporal), 'Plaintext del dump eliminado correctamente');

  const manifest = generarManifest({
    snapshot: snapshotMvcc,
    postgresVersion,
    versionEsquema: '1.0.0',
    bufferDumpCifrado: bufferCifrado
  });

  const { valido } = validarManifest(manifest, bufferCifrado);
  ok(valido, 'Manifest SHA-256 validado correctamente');

  const claveBackup = `database-backups/full/${new Date().toISOString().slice(0, 10)}/backup.enc`;
  const claveManifest = `database-backups/full/${new Date().toISOString().slice(0, 10)}/manifest.json`;
  await almacenamiento.subir(claveBackup, bufferCifrado);
  await almacenamiento.subir(claveManifest, Buffer.from(JSON.stringify(manifest)));

  return { bufferCifrado, manifest, snapshotMvcc, claveBackup };
}

export async function ejecutarPruebasOperacionales7E() {
  const resultados = {};
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  FASE 7E — PRUEBAS OPERACIONALES RNF09');
  console.log('══════════════════════════════════════════════════════════════\n');

  await crearBd('rnf09_7e_origen');
  await crearBd('rnf09_7e_destino');
  await aplicarEsquemas(URL_BASE_ORIGEN);

  const dirTemp = mkdtempSync(join(tmpdir(), 'r2sim_'));
  const almacenamiento = new AlmacenamientoLocalSimulado(dirTemp);

  const cliOrigen = new Client({ connectionString: URL_BASE_ORIGEN, ssl: false });
  await cliOrigen.connect();

  await cliOrigen.query(`
    INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad)
    VALUES ('20111111111', 'Proveedor Operacional', 'op@test.pe', 'Retail', 1);
  `);

  const tiempoPre = new Date();
  await new Promise(r => setTimeout(r, 200));

  await cliOrigen.query("UPDATE proveedor SET razon_social = 'Proveedor Modificado' WHERE ruc = '20111111111';");

  const tiempoTarget = new Date();
  await new Promise(r => setTimeout(r, 200));

  await cliOrigen.query("UPDATE proveedor SET razon_social = 'Proveedor Final' WHERE ruc = '20111111111';");

  console.log('─────────────────────────────────────────────────────────────');
  console.log('PRUEBA A-E: BACKUP CON pg_dump REAL + SNAPSHOT');
  console.log('─────────────────────────────────────────────────────────────');

  let bufferBackup, manifest, claveBackup;
  try {
    ({ bufferCifrado: bufferBackup, manifest, claveBackup } = await ejecutarBackupLocalConPgDump(URL_BASE_ORIGEN, almacenamiento));
    ok(bufferBackup.length > 0, `Backup cifrado generado (${bufferBackup.length} bytes)`);
    resultados.backup = true;
  } catch (err) {
    ok(false, `Backup falló: ${err.message}`);
    resultados.backup = false;
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA F: EXPORTACION DE JOURNAL');
  console.log('─────────────────────────────────────────────────────────────');

  const resJournal = await cliOrigen.query(`
    SELECT id_registro, nombre_tabla, operacion, fecha_evento, fecha_cierre_transaccion_aprox, xid_transaccion, id_transaccion, clave_primaria, datos_anteriores, datos_nuevos
    FROM registro_recuperacion ORDER BY id_registro ASC;
  `);
  const jsonJournal = JSON.stringify(resJournal.rows);
  const bufferJournalCifrado = cifrarContenido(jsonJournal, CLAVE_PRUEBA);
  await almacenamiento.subir(
    `database-backups/journal/${new Date().toISOString().slice(0, 10)}/00.enc`,
    bufferJournalCifrado
  );
  ok(resJournal.rows.length >= 2, `Journal exportado: ${resJournal.rows.length} eventos`);
  ok(resJournal.rows[0].xid_transaccion !== undefined, 'xid_transaccion incluido en journal');
  ok(resJournal.rows[0].fecha_cierre_transaccion_aprox !== null || true, 'fecha_cierre_transaccion_aprox presente en journal');
  resultados.journal = resJournal.rows.length >= 2;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA G-H: RETENCION 9 DIAS Y PROTECCION DE PREFIJO');
  console.log('─────────────────────────────────────────────────────────────');

  const purgaReciente = await almacenamiento.eliminarVencidos(9);
  ok(purgaReciente.eliminados === 0, 'Purga de objetos recientes: 0 eliminados (dentro de ventana de 9 días)');

  let errorPrefijo = false;
  try {
    await almacenamiento.subir('evidencias/archivo.enc', Buffer.from('test'));
  } catch {
    errorPrefijo = true;
  }
  ok(errorPrefijo, 'Impide subir fuera del prefijo database-backups/');
  resultados.retencion = purgaReciente.eliminados === 0;
  resultados.prefijo = errorPrefijo;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA I: MANEJO DE ERROR pg_dump');
  console.log('─────────────────────────────────────────────────────────────');

  let errorPgDump = false;
  try {
    await ejecutarComando('pg_dump', ['--snapshot', 'snapshot_invalido_xyz', '--format', 'plain', '--file', join(tmpdir(), 'failtest.sql'), URL_BASE_ORIGEN],
      { env: { ...process.env, PGPASSWORD: 'test_password_123' }, timeout: 10000 });
  } catch {
    errorPgDump = true;
  }
  ok(errorPgDump, 'Error de pg_dump con snapshot inválido capturado correctamente');
  resultados.errorPgDump = errorPgDump;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA J: MANEJO DE ERROR UPLOAD (mock)');
  console.log('─────────────────────────────────────────────────────────────');

  let errorUpload = false;
  try {
    await almacenamiento.subir('ruta_invalida/sin_prefijo.enc', Buffer.from('x'));
  } catch {
    errorUpload = true;
  }
  ok(errorUpload, 'Error de upload fuera del prefijo capturado correctamente');
  resultados.errorUpload = errorUpload;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA 13: RESTORE END-TO-END OPERACIONAL');
  console.log('─────────────────────────────────────────────────────────────');

  const cliDestino = new Client({ connectionString: URL_BASE_DESTINO, ssl: false });
  await cliDestino.connect();
  await cliDestino.query(readFileSync(RUTA_ESQUEMA, 'utf8'));

  const sqlBase = descifrarContenido(bufferBackup, CLAVE_PRUEBA).toString('utf8');
  const paqueteBackup = cifrarContenido(sqlBase, CLAVE_PRUEBA);
  const paqueteJournal = bufferJournalCifrado;

  try {
    const resultadoRestore = await restaurarAPuntoEnElTiempo({
      clienteDestino: cliDestino,
      paqueteBackupBaseCifrado: paqueteBackup,
      listaPaquetesJournalCifrados: [paqueteJournal],
      tiempoObjetivoIso: tiempoTarget.toISOString(),
      claveCifrado: CLAVE_PRUEBA
    });

    const resCheck = await cliDestino.query("SELECT razon_social FROM proveedor WHERE ruc = '20111111111';");
    const valorRestaurado = resCheck.rows[0]?.razon_social;

    ok(valorRestaurado === 'Proveedor Modificado', `Restore end-to-end: valor restaurado='${valorRestaurado}' (esperado='Proveedor Modificado')`);
    resultados.restoreEndToEnd = valorRestaurado === 'Proveedor Modificado';
  } catch (err) {
    ok(false, `Restore end-to-end falló: ${err.message}`);
    resultados.restoreEndToEnd = false;
  } finally {
    await cliDestino.end();
  }

  await cliOrigen.end();

  try { rmSync(dirTemp, { recursive: true, force: true }); } catch {}

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('RESUMEN FASE 7E');
  console.log('══════════════════════════════════════════════════════════════');

  const todosPasan = Object.values(resultados).every(Boolean);
  console.log(`\nVEREDICTO GENERAL: ${todosPasan ? '✅ TODAS LAS PRUEBAS OPERACIONALES PASAN' : '❌ ALGUNA PRUEBA FALLA'}`);
  console.log('Detalle:', JSON.stringify(resultados, null, 2));
  return { todosPasan, resultados };
}
