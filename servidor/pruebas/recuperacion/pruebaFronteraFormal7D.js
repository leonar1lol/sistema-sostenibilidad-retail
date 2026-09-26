import { Client } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { cifrarContenido } from 'file:///D:/Backup/Descargas/Curso%20Integrador%20Ii%20Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/servicioCifradoBackup.js';
import { generarManifest, validarManifest } from 'file:///D:/Backup/Descargas/Curso%20Integrador%20Ii%20Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/servicioManifest.js';

const RUTA_RAIZ = 'D:/Backup/Descargas/Curso Integrador Ii Sistemas/Software/plataforma-sostenibilidad-retail';
const CLAVE_CIFRADO = 'clave_secreta_segura_de_32_bytes_para_recuperacion_2026';
const URL_ADMIN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/postgres';

const esperarMs = (ms) => new Promise(r => setTimeout(r, ms));

async function crearBd(nombre) {
  const cli = new Client({ connectionString: URL_ADMIN, ssl: false });
  await cli.connect();
  await cli.query(`DROP DATABASE IF EXISTS ${nombre};`);
  await cli.query(`CREATE DATABASE ${nombre};`);
  await cli.end();
  return `postgresql://postgres_test:test_password_123@127.0.0.1:5433/${nombre}`;
}

async function aplicarEsquemas(url) {
  const cli = new Client({ connectionString: url, ssl: false });
  await cli.connect();
  const sqlEsquema = fs.readFileSync(path.resolve(RUTA_RAIZ, 'base-datos/esquema_inicial.sql'), 'utf8');
  const sqlJournal = fs.readFileSync(path.resolve(RUTA_RAIZ, 'servidor/pruebas/recuperacion/esquemaJournal.sql'), 'utf8');
  await cli.query(sqlEsquema);
  await cli.query(sqlJournal);
  await cli.end();
  return cli;
}

function ok(condicion, mensaje) {
  const resultado = condicion ? '✅ PASA' : '❌ FALLA';
  console.log(`  ${resultado}: ${mensaje}`);
  return condicion;
}

export async function ejecutarPruebasFase7D() {
  const resultados = {};
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  FASE 7D — FRONTERA FORMAL BACKUP/JOURNAL Y PRECISIÓN TEMPORAL');
  console.log('══════════════════════════════════════════════════════════════\n');

  const urlOrigen = await crearBd('rnf09_7d_origen');
  await aplicarEsquemas(urlOrigen);

  const cliOrigen = new Client({ connectionString: urlOrigen, ssl: false });
  await cliOrigen.connect();

  await cliOrigen.query(`
    INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad)
    VALUES
      ('20000000001', 'Proveedor A-Base', 'a@test.pe', 'Retail', 1),
      ('20000000002', 'Proveedor B-Base', 'b@test.pe', 'Retail', 1),
      ('20000000003', 'Proveedor C-Base', 'c@test.pe', 'Retail', 1),
      ('20000000004', 'Proveedor D-Base', 'd@test.pe', 'Retail', 1),
      ('20000000005', 'Proveedor E-Base', 'e@test.pe', 'Retail', 1);
  `);

  const resVersion = await cliOrigen.query('SELECT version() as v;');
  const postgresVersion = resVersion.rows[0].v;

  console.log('─────────────────────────────────────────────────────────────');
  console.log('PRUEBA 0: MANIFEST + SHA-256');
  console.log('─────────────────────────────────────────────────────────────');
  {
    const sqlDump = 'INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad) VALUES (\'20000000001\', \'Test\', \'t@t.pe\', \'Retail\', 1);';
    const bufferCifrado = cifrarContenido(sqlDump, CLAVE_CIFRADO);
    const resSnap = await cliOrigen.query('SELECT pg_current_snapshot()::text as snap;');
    const snapshot = resSnap.rows[0].snap;

    const manifest = generarManifest({
      snapshot,
      postgresVersion,
      versionEsquema: '1.0.0',
      bufferDumpCifrado: bufferCifrado
    });

    ok(manifest.version === 1, 'version = 1');
    ok(manifest.algoritmoCifrado === 'AES-256-GCM', 'algoritmoCifrado = AES-256-GCM');
    ok(typeof manifest.sha256DumpCifrado === 'string' && manifest.sha256DumpCifrado.length === 64, 'sha256DumpCifrado es hex de 64 chars');
    ok(manifest.snapshot === snapshot, 'snapshot MVCC incluido en manifest');
    ok(!JSON.stringify(manifest).includes('password') && !JSON.stringify(manifest).includes('clave'), 'manifest sin credenciales');

    const { valido, errores } = validarManifest(manifest, bufferCifrado);
    ok(valido, `manifest válido (errores: ${errores.join('; ') || 'ninguno'})`);

    const bufferTampeado = Buffer.from(bufferCifrado);
    bufferTampeado[28] ^= 0xFF;
    const { valido: validoTampeado } = validarManifest(manifest, bufferTampeado);
    ok(!validoTampeado, 'manifest detecta tampering en dump cifrado');

    resultados.manifest = valido && !validoTampeado;
    console.log();
  }

  console.log('─────────────────────────────────────────────────────────────');
  console.log('PRUEBA 1: SET CONSTRAINTS IMMEDIATE — Adelantamiento de trigger');
  console.log('─────────────────────────────────────────────────────────────');
  {
    const cliTx = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTx.connect();

    await cliTx.query('BEGIN;');
    await cliTx.query("UPDATE proveedor SET razon_social = 'A-ImmediateTest' WHERE ruc = '20000000001';");

    const antesImmediate = await cliOrigen.query('SELECT count(*) as c FROM registro_recuperacion WHERE id_transaccion = (SELECT max(id_transaccion) FROM registro_recuperacion);');
    const cierreAntesImmediate = await cliOrigen.query('SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion ORDER BY id_registro DESC LIMIT 1;');

    await cliTx.query('SET CONSTRAINTS trg_cierre_proveedor IMMEDIATE;');

    await esperarMs(200);
    const targetTime = new Date().toISOString();

    await esperarMs(200);
    await cliTx.query('COMMIT;');

    const resJournal = await cliOrigen.query(`
      SELECT id_registro, fecha_evento, fecha_cierre_transaccion_aprox
      FROM registro_recuperacion
      ORDER BY id_registro DESC LIMIT 2;
    `);

    const ultimoEvento = resJournal.rows[0];
    const cierreAntesDeTtarget = ultimoEvento.fecha_cierre_transaccion_aprox
      && new Date(ultimoEvento.fecha_cierre_transaccion_aprox) <= new Date(targetTime);

    ok(cierreAntesDeTtarget, `SET CONSTRAINTS IMMEDIATE adelantó fecha_cierre_transaccion_aprox antes de TARGET_TIME (${targetTime.substring(11,23)})`);
    console.log('  ADVERTENCIA: SET CONSTRAINTS <nombre> IMMEDIATE puede adelantar el marcador de cierre transaccional.');
    console.log('  El journal NO debe utilizar nombre de constraint público expuesto a manipulación externa.');
    console.log('  Documentado como limitación conocida: marca temporal NO garantizada si cliente ejecuta SET CONSTRAINTS IMMEDIATE.');

    resultados.setConstraintsImmediate = {
      cierreAdelantado: cierreAntesDeTtarget,
      targetTime,
      fechaCierre: ultimoEvento.fecha_cierre_transaccion_aprox
    };

    await cliTx.end();
    console.log();
  }

  console.log('─────────────────────────────────────────────────────────────');
  console.log('PRUEBAS 2-6: FRONTERA FORMAL BACKUP/JOURNAL (Escenarios A–E)');
  console.log('─────────────────────────────────────────────────────────────');

  console.log('\n  ── Escenario A: Transacción completada ANTES del snapshot ──');
  let xidA;
  {
    const cliTxA = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTxA.connect();
    await cliTxA.query('BEGIN;');
    const resXidA = await cliTxA.query('SELECT pg_current_xact_id()::text::bigint as xid;');
    xidA = resXidA.rows[0].xid;
    await cliTxA.query("UPDATE proveedor SET razon_social = 'A-PreSnapshot' WHERE ruc = '20000000001';");
    await cliTxA.query('COMMIT;');
    await cliTxA.end();
    console.log(`  Tx A (xid=${xidA}) completada con COMMIT.`);
  }

  const cliSnap = new Client({ connectionString: urlOrigen, ssl: false });
  await cliSnap.connect();
  await cliSnap.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;');
  const resSnapExport = await cliSnap.query('SELECT pg_export_snapshot() as snap_id, pg_current_snapshot()::text as snap_text;');
  const snapshotId = resSnapExport.rows[0].snap_id;
  const snapshotTexto = resSnapExport.rows[0].snap_text;
  console.log(`  Snapshot MVCC capturado después de Tx A: ${snapshotTexto}`);
  resultados.snapshot = snapshotTexto;

  {
    const resVisA = await cliSnap.query(
      `SELECT pg_visible_in_snapshot($1::xid8, $2::pg_snapshot) as visible;`,
      [xidA, snapshotTexto]
    );
    const visibleA = resVisA.rows[0].visible;
    ok(visibleA === true, `Tx A (xid=${xidA}) es VISIBLE en snapshot → ya en dump → NO replay`);
    resultados.escenarioA = { xid: xidA, visibleEnSnapshot: visibleA };
  }

  console.log('\n  ── Escenario B: Transacción abierta durante snapshot, COMMIT después ──');

  {
    const cliTxB = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTxB.connect();

    await cliTxB.query('BEGIN;');
    const resXidB = await cliTxB.query('SELECT pg_current_xact_id()::text::bigint as xid;');
    const xidB = resXidB.rows[0].xid;
    await cliTxB.query("UPDATE proveedor SET razon_social = 'B-DuranteSnapshot' WHERE ruc = '20000000002';");

    const resVisB = await cliSnap.query(
      `SELECT pg_visible_in_snapshot($1::xid8, $2::pg_snapshot) as visible;`,
      [xidB, snapshotTexto]
    );
    const visibleB = resVisB.rows[0].visible;
    ok(visibleB === false, `Tx B (xid=${xidB}) NO visible en snapshot antes de commit → NO en dump → SÍ replay`);

    await cliTxB.query('COMMIT;');

    const resVisBPost = await cliSnap.query(
      `SELECT pg_visible_in_snapshot($1::xid8, $2::pg_snapshot) as visible;`,
      [xidB, snapshotTexto]
    );
    ok(resVisBPost.rows[0].visible === false, `Tx B sigue NO visible en snapshot inmutable tras COMMIT → visibilidad determinista`);
    await cliTxB.end();
    resultados.escenarioB = { xid: xidB, visibleAntesCommit: visibleB, visibleDespuesCommit: resVisBPost.rows[0].visible };
  }

  console.log('\n  ── Escenario C: Transacción inicia y termina DESPUÉS del snapshot ──');
  {
    const cliTxC = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTxC.connect();
    await cliTxC.query('BEGIN;');
    const resXidC = await cliTxC.query('SELECT pg_current_xact_id()::text::bigint as xid;');
    const xidC = resXidC.rows[0].xid;
    await cliTxC.query("UPDATE proveedor SET razon_social = 'C-PostSnapshot' WHERE ruc = '20000000003';");
    await cliTxC.query('COMMIT;');
    await cliTxC.end();

    const resVisC = await cliSnap.query(
      `SELECT pg_visible_in_snapshot($1::xid8, $2::pg_snapshot) as visible;`,
      [xidC, snapshotTexto]
    );
    ok(resVisC.rows[0].visible === false, `Tx C (xid=${xidC}) NO visible en snapshot → NO en dump → SÍ replay`);
    resultados.escenarioC = { xid: xidC, visibleEnSnapshot: resVisC.rows[0].visible };
  }

  console.log('\n  ── Escenario D: Transacción con ROLLBACK ──');
  {
    const cliTxD = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTxD.connect();
    const conteoAntes = Number((await cliOrigen.query('SELECT count(*) as c FROM registro_recuperacion;')).rows[0].c);

    await cliTxD.query('BEGIN;');
    const resXidD = await cliTxD.query('SELECT pg_current_xact_id()::text::bigint as xid;');
    const xidD = resXidD.rows[0].xid;
    await cliTxD.query("UPDATE proveedor SET razon_social = 'D-ROLLBACK' WHERE ruc = '20000000004';");
    await cliTxD.query('ROLLBACK;');
    await cliTxD.end();

    const conteoDepues = Number((await cliOrigen.query('SELECT count(*) as c FROM registro_recuperacion;')).rows[0].c);

    const sinEventoJournal = conteoDepues === conteoAntes;
    ok(sinEventoJournal, `Tx D ROLLBACK → conteo journal antes=${conteoAntes}, después=${conteoDepues} → sin evento persistente`);

    const resVisD = await cliSnap.query(
      `SELECT pg_visible_in_snapshot($1::xid8, $2::pg_snapshot) as visible;`,
      [xidD, snapshotTexto]
    );
    ok(resVisD.rows[0].visible === false, `Tx D (rollback) NO visible en snapshot → correctamente excluida`);
    resultados.escenarioD = { xid: xidD, sinEventoJournal, visibleEnSnapshot: resVisD.rows[0].visible };
  }

  console.log('\n  ── Escenario E: Múltiples UPDATE en una transacción ──');
  {
    const cliTxE = new Client({ connectionString: urlOrigen, ssl: false });
    await cliTxE.connect();
    await cliTxE.query('BEGIN;');
    const resXidE = await cliTxE.query('SELECT pg_current_xact_id()::text::bigint as xid;');
    const xidE = resXidE.rows[0].xid;

    await cliTxE.query("UPDATE proveedor SET razon_social = 'E-Paso1' WHERE ruc = '20000000005';");
    await cliTxE.query("UPDATE proveedor SET razon_social = 'E-Paso2' WHERE ruc = '20000000005';");
    await cliTxE.query("UPDATE proveedor SET razon_social = 'E-Final' WHERE ruc = '20000000005';");
    await cliTxE.query('COMMIT;');
    await cliTxE.end();

    const resEventosE = await cliOrigen.query(
      `SELECT operacion, datos_nuevos->>'razon_social' as razon FROM registro_recuperacion WHERE id_transaccion = $1 AND nombre_tabla = 'proveedor' ORDER BY id_registro ASC;`,
      [xidE]
    );

    const razonesFinal = resEventosE.rows.map(r => r.razon);
    ok(resEventosE.rows.length === 3, `Tx E registró ${resEventosE.rows.length} eventos (esperado: 3 UPDATE)`);
    ok(razonesFinal[razonesFinal.length - 1] === 'E-Final', `Estado final en journal es 'E-Final' (sin pérdida)`);

    const valCurrent = (await cliOrigen.query("SELECT razon_social FROM proveedor WHERE ruc = '20000000005';")).rows[0].razon_social;
    ok(valCurrent === 'E-Final', `Valor actual en tabla también es 'E-Final'`);
    resultados.escenarioE = { eventosJournal: resEventosE.rows.length, ultimoValor: razonesFinal[razonesFinal.length - 1] };
  }

  console.log('\n  ─── Cerrando snapshot MVCC ───');
  await cliSnap.query('COMMIT;');
  await cliSnap.end();

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA 7: MANIFEST COMPLETO DEL BACKUP (con snapshot real)');
  console.log('─────────────────────────────────────────────────────────────');
  {
    const cliManifest = new Client({ connectionString: urlOrigen, ssl: false });
    await cliManifest.connect();
    await cliManifest.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;');
    const resSnapManifest = await cliManifest.query('SELECT pg_current_snapshot()::text as snap;');
    const snapManifest = resSnapManifest.rows[0].snap;
    const sqlDumpManifest = 'SET CONSTRAINTS ALL DEFERRED;\nINSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad) VALUES (\'20000000001\', \'A-PreSnapshot\', \'a@test.pe\', \'Retail\', 1) ON CONFLICT DO NOTHING;';
    const bufCifrado = cifrarContenido(sqlDumpManifest, CLAVE_CIFRADO);
    await cliManifest.query('COMMIT;');
    await cliManifest.end();

    const manifest = generarManifest({
      snapshot: snapManifest,
      postgresVersion,
      versionEsquema: '1.0.0',
      bufferDumpCifrado: bufCifrado
    });

    ok(typeof manifest.sha256DumpCifrado === 'string', 'manifest.sha256DumpCifrado presente');
    ok(typeof manifest.snapshot === 'string' && manifest.snapshot.includes(':'), 'manifest.snapshot tiene formato xmin:xmax:...');
    ok(!manifest.fechaBackup.includes('Invalid'), 'manifest.fechaBackup es ISO válida');

    const { valido } = validarManifest(manifest, bufCifrado);
    ok(valido, 'manifest completo válido con snapshot real');
    resultados.manifestCompleto = valido;
    console.log('\n  Manifest generado (sin credenciales):');
    const manifestDisplay = { ...manifest };
    delete manifestDisplay.sha256DumpCifrado;
    console.log(' ', JSON.stringify({ ...manifestDisplay, sha256DumpCifrado: `${manifest.sha256DumpCifrado.substring(0, 16)}...` }, null, 2).split('\n').join('\n  '));
  }

  await cliOrigen.end();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('RESUMEN DE RESULTADOS FASE 7D');
  console.log('══════════════════════════════════════════════════════════════');

  const todosPasan = [
    resultados.manifest,
    resultados.escenarioA?.visibleEnSnapshot === true,
    resultados.escenarioB?.visibleAntesCommit === false,
    resultados.escenarioC?.visibleEnSnapshot === false,
    resultados.escenarioD?.sinEventoJournal === true,
    resultados.escenarioE?.ultimoValor === 'E-Final',
    resultados.manifestCompleto
  ].every(Boolean);

  console.log(`\nVEREDICTO GENERAL: ${todosPasan ? '✅ TODAS LAS PRUEBAS PASAN' : '❌ ALGUNA PRUEBA FALLA'}\n`);
  return { todosPasan, resultados };
}
