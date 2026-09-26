import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from 'pg';
import { cifrarContenido, descifrarContenido } from '../../pruebas/recuperacion/servicioCifradoBackup.js';
import { generarManifest, validarManifest, calcularSha256Hex } from '../../pruebas/recuperacion/servicioManifest.js';
import { restaurarAPuntoEnElTiempo } from '../../pruebas/recuperacion/restaurarPuntoTiempo.js';
import { ejecutarBackupDiario, parsearVersionPgDump, validarVersionPgDumpMinimo18 } from './crearBackupDiario.js';
import { exportarJournal } from './exportarJournal.js';

const ejecutarComando = promisify(execFile);

const CLAVE_PRUEBA = 'clave_prueba_32_bytes_para_test_7f_rnf09';
const URL_BASE_ORIGEN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/rnf09_7f_origen';
const URL_BASE_DESTINO = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/rnf09_7f_destino';
const URL_ADMIN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/postgres';
const RUTA_ESQUEMA = 'D:/Backup/Descargas/Curso Integrador Ii Sistemas/Software/plataforma-sostenibilidad-retail/base-datos/esquema_inicial.sql';
const RUTA_JOURNAL_SQL = 'D:/Backup/Descargas/Curso Integrador Ii Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/esquemaJournal.sql';

function ok(condicion, mensaje) {
  const resultado = condicion ? '  ✅ PASA' : '  ❌ FALLA';
  console.log(`${resultado}: ${mensaje}`);
  return condicion;
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

const generadorDumpLocal = async ({ rutaSalida, clienteCoord }) => {
  const resProv = await clienteCoord.query('SELECT ruc, razon_social, correo, tipo, id_unidad FROM proveedor;');
  let sqlDump = 'SET CONSTRAINTS ALL DEFERRED;\n';
  for (const p of resProv.rows) {
    sqlDump += `INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad) VALUES ('${p.ruc}', '${p.razon_social}', '${p.correo}', '${p.tipo}', ${p.id_unidad}) ON CONFLICT (ruc) DO UPDATE SET razon_social = EXCLUDED.razon_social;\n`;
  }
  writeFileSync(rutaSalida, sqlDump, 'utf8');
};

export async function ejecutarPruebasOperacionales7F() {
  const resultados = {};
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  FASE 7F-B — PRUEBAS OPERACIONALES GITHUB ACTIONS ARTIFACTS');
  console.log('══════════════════════════════════════════════════════════════\n');

  await crearBd('rnf09_7f_origen');
  await crearBd('rnf09_7f_destino');
  await aplicarEsquemas(URL_BASE_ORIGEN);

  process.env.DATABASE_URL = URL_BASE_ORIGEN;
  process.env.BACKUP_ENCRYPTION_KEY = CLAVE_PRUEBA;

  const cliOrigen = new Client({ connectionString: URL_BASE_ORIGEN, ssl: false });
  await cliOrigen.connect();

  await cliOrigen.query(`
    INSERT INTO proveedor (ruc, razon_social, correo, tipo, id_unidad)
    VALUES ('20222222222', 'Proveedor 7F Base', 'p7f@test.pe', 'Retail', 1);
  `);

  console.log('─────────────────────────────────────────────────────────────');
  console.log('PRUEBA A-B: BACKUP PRODUCE EXACTAMENTE backup.enc + manifest.json SIN PLAINTEXT');
  console.log('─────────────────────────────────────────────────────────────');

  const dirSalidaBackup = mkdtempSync(join(tmpdir(), 'artifact_backup_'));
  let resBackup;
  try {
    resBackup = await ejecutarBackupDiario({
      directorioSalida: dirSalidaBackup,
      generadorDumpPersonalizado: generadorDumpLocal
    });

    const archivosGenerados = readdirSync(dirSalidaBackup).sort();
    ok(archivosGenerados.length === 2, `Directorio contiene exactamente 2 archivos: ${archivosGenerados.join(', ')}`);
    ok(archivosGenerados.includes('backup.enc'), 'Archivo backup.enc generado');
    ok(archivosGenerados.includes('manifest.json'), 'Archivo manifest.json generado');

    const archivosDumpSql = readdirSync(tmpdir()).filter(f => f.startsWith('dump_') && f.endsWith('.sql'));
    ok(archivosDumpSql.length === 0, `Cero archivos dump_*.sql plaintext residuales en tmpdir (encontrados: ${archivosDumpSql.length})`);

    resultados.backup = archivosGenerados.length === 2 && archivosDumpSql.length === 0;
  } catch (err) {
    ok(false, `Fallo en backup diario: ${err.message}`);
    resultados.backup = false;
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA C: JOURNAL PRODUCE EXACTAMENTE journal.enc + manifest.json');
  console.log('─────────────────────────────────────────────────────────────');

  const tiempoPreMod = new Date();
  await new Promise(r => setTimeout(r, 100));

  await cliOrigen.query("UPDATE proveedor SET razon_social = 'Proveedor 7F Modificado' WHERE ruc = '20222222222';");

  const tiempoTarget = new Date();
  await new Promise(r => setTimeout(r, 100));

  await cliOrigen.query("UPDATE proveedor SET razon_social = 'Proveedor 7F Estado Final' WHERE ruc = '20222222222';");

  const dirSalidaJournal = mkdtempSync(join(tmpdir(), 'artifact_journal_'));
  let resJournal;
  try {
    resJournal = await exportarJournal({
      desde: new Date(Date.now() - 60000).toISOString(),
      hasta: new Date().toISOString(),
      directorioSalida: dirSalidaJournal
    });

    const archivosJournal = readdirSync(dirSalidaJournal).sort();
    ok(archivosJournal.length === 2, `Directorio contiene exactamente 2 archivos: ${archivosJournal.join(', ')}`);
    ok(archivosJournal.includes('journal.enc'), 'Archivo journal.enc generado');
    ok(archivosJournal.includes('manifest.json'), 'Archivo manifest.json generado');

    resultados.journal = archivosJournal.length === 2;
  } catch (err) {
    ok(false, `Fallo en exportar journal: ${err.message}`);
    resultados.journal = false;
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA D-E: VALIDACIÓN DE MANIFEST Y DETECCIÓN DE TAMPERING');
  console.log('─────────────────────────────────────────────────────────────');

  const bufferBackup = readFileSync(join(dirSalidaBackup, 'backup.enc'));
  const manifestBackup = JSON.parse(readFileSync(join(dirSalidaBackup, 'manifest.json'), 'utf8'));

  const { valido: manifestOk } = validarManifest(manifestBackup, bufferBackup);
  ok(manifestOk, 'Manifest SHA-256 del backup es válido e íntegro');

  const bufferTampeado = Buffer.from(bufferBackup);
  bufferTampeado[20] ^= 0xFF;
  const { valido: manifestTampeadoOk } = validarManifest(manifestBackup, bufferTampeado);
  ok(!manifestTampeadoOk, 'Detección de tampering: alteración de 1 byte en backup.enc es rechazada por SHA-256');

  resultados.manifestIntegridad = manifestOk && !manifestTampeadoOk;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA F: AUSENCIA TOTAL DE DEPENDENCIA R2 EN FLUJO DE TRABAJO');
  console.log('─────────────────────────────────────────────────────────────');

  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET_BACKUP;

  let backupSinR2 = false;
  try {
    const dirTestSinR2 = mkdtempSync(join(tmpdir(), 'test_sin_r2_'));
    await ejecutarBackupDiario({ directorioSalida: dirTestSinR2, generadorDumpPersonalizado: generadorDumpLocal });
    backupSinR2 = existsSync(join(dirTestSinR2, 'backup.enc'));
    rmSync(dirTestSinR2, { recursive: true, force: true });
  } catch (err) {
    backupSinR2 = false;
  }
  ok(backupSinR2, 'El backup se ejecuta con éxito total sin ninguna variable de R2 configurada');
  resultados.sinDependenciaR2 = backupSinR2;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA G: BACKUP_OUTPUT_DIR CONFIGURABLE');
  console.log('─────────────────────────────────────────────────────────────');

  const dirConfigurable = mkdtempSync(join(tmpdir(), 'custom_output_dir_'));
  process.env.BACKUP_OUTPUT_DIR = dirConfigurable;
  await ejecutarBackupDiario({ generadorDumpPersonalizado: generadorDumpLocal });
  const existeEnCustomDir = existsSync(join(dirConfigurable, 'backup.enc')) && existsSync(join(dirConfigurable, 'manifest.json'));
  ok(existeEnCustomDir, 'BACKUP_OUTPUT_DIR por variable de entorno respeta ubicación personalizada');
  delete process.env.BACKUP_OUTPUT_DIR;
  rmSync(dirConfigurable, { recursive: true, force: true });
  resultados.directorioConfigurable = existeEnCustomDir;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA H-I: MANEJO DE ERRORES Y LIMPIEZA DE TEMPORALES');
  console.log('─────────────────────────────────────────────────────────────');

  let errorPgDump = false;
  const dirFalloDump = mkdtempSync(join(tmpdir(), 'fallo_dump_'));
  try {
    await ejecutarBackupDiario({
      directorioSalida: dirFalloDump,
      generadorDumpPersonalizado: async () => { throw new Error('Simulación de error en volcado pg_dump'); }
    });
  } catch {
    errorPgDump = true;
  }
  const archivosEnDirFallo = readdirSync(dirFalloDump);
  ok(errorPgDump, 'Error simulado en volcado es capturado limpiamente');
  ok(archivosEnDirFallo.length === 0, `No se produjeron artefactos utilizables tras error (archivos: ${archivosEnDirFallo.length})`);
  rmSync(dirFalloDump, { recursive: true, force: true });

  let errorCifrado = false;
  const dirFalloCifrado = mkdtempSync(join(tmpdir(), 'fallo_cifrado_'));
  const claveBackupOriginal = process.env.BACKUP_ENCRYPTION_KEY;
  try {
    delete process.env.BACKUP_ENCRYPTION_KEY;
    await ejecutarBackupDiario({
      claveEncriptado: null,
      directorioSalida: dirFalloCifrado,
      generadorDumpPersonalizado: generadorDumpLocal
    });
  } catch {
    errorCifrado = true;
  } finally {
    process.env.BACKUP_ENCRYPTION_KEY = claveBackupOriginal;
  }
  const archivosResidualesSql = readdirSync(tmpdir()).filter(f => f.startsWith('dump_') && f.endsWith('.sql'));
  ok(errorCifrado, 'Error de clave de cifrado ausente es rechazado correctamente');
  ok(archivosResidualesSql.length === 0, 'No quedan archivos temporales plaintext tras fallo de cifrado');
  rmSync(dirFalloCifrado, { recursive: true, force: true });

  resultados.manejoErrores = errorPgDump && errorCifrado && archivosResidualesSql.length === 0;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA 15: RESTORE END-TO-END OPERACIONAL CON ARTIFACTS LOCALES');
  console.log('─────────────────────────────────────────────────────────────');

  const cliDestino = new Client({ connectionString: URL_BASE_DESTINO, ssl: false });
  await cliDestino.connect();
  await cliDestino.query(readFileSync(RUTA_ESQUEMA, 'utf8'));

  const paqueteBackupLeido = readFileSync(join(dirSalidaBackup, 'backup.enc'));
  const paqueteJournalLeido = readFileSync(join(dirSalidaJournal, 'journal.enc'));

  let restoreExitoso = false;
  try {
    await restaurarAPuntoEnElTiempo({
      clienteDestino: cliDestino,
      paqueteBackupBaseCifrado: paqueteBackupLeido,
      listaPaquetesJournalCifrados: [paqueteJournalLeido],
      tiempoObjetivoIso: tiempoTarget.toISOString(),
      claveCifrado: CLAVE_PRUEBA
    });

    const resCheck = await cliDestino.query("SELECT razon_social FROM proveedor WHERE ruc = '20222222222';");
    const valorRestaurado = resCheck.rows[0]?.razon_social;

    ok(valorRestaurado === 'Proveedor 7F Modificado', `Restore end-to-end exacto: valor='${valorRestaurado}' (esperado='Proveedor 7F Modificado')`);
    restoreExitoso = valorRestaurado === 'Proveedor 7F Modificado';
  } catch (err) {
    ok(false, `Restore end-to-end falló: ${err.message}`);
    restoreExitoso = false;
  } finally {
    await cliDestino.end();
  }

  await cliOrigen.end();

  rmSync(dirSalidaBackup, { recursive: true, force: true });
  rmSync(dirSalidaJournal, { recursive: true, force: true });

  resultados.restoreEndToEnd = restoreExitoso;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA V: VALIDACIÓN ESTRICTA DE VERSIÓN PG_DUMP 18');
  console.log('─────────────────────────────────────────────────────────────');

  const salida18Linux = 'pg_dump (PostgreSQL) 18.0 (Ubuntu 18.0-1.pgdg24.04+1)';
  const version18LinuxValida = validarVersionPgDumpMinimo18(salida18Linux);
  ok(version18LinuxValida === true, `Versión 18.x en Ubuntu runner es aceptada: "${salida18Linux}"`);

  const salida18Windows = 'pg_dump (PostgreSQL) 18.4 on x86_64-windows, compiled by msvc-19.44';
  const version18WinValida = validarVersionPgDumpMinimo18(salida18Windows);
  ok(version18WinValida === true, `Versión 18.x en Windows local es aceptada: "${salida18Windows}"`);

  let error17Rechazado = false;
  try {
    validarVersionPgDumpMinimo18('pg_dump (PostgreSQL) 17.2');
  } catch (err) {
    error17Rechazado = err.message.includes('17.2') && err.message.includes('PostgreSQL 18.x');
  }
  ok(error17Rechazado, 'Versión obsoleta 17.x es estrictamente rechazada');

  let error16Rechazado = false;
  try {
    validarVersionPgDumpMinimo18('pg_dump (PostgreSQL) 16.4 (Ubuntu 16.4-1.pgdg)');
  } catch (err) {
    error16Rechazado = err.message.includes('16.4') && err.message.includes('PostgreSQL 18.x');
  }
  ok(error16Rechazado, 'Versión obsoleta 16.x es estrictamente rechazada');

  let errorInvalidoRechazado = false;
  try {
    validarVersionPgDumpMinimo18('salida corrupta sin patron');
  } catch (err) {
    errorInvalidoRechazado = err.message.includes('No se pudo determinar la versión de pg_dump');
  }
  ok(errorInvalidoRechazado, 'Salida sin formato de versión genera error explícito');

  resultados.validacionVersionPgDump = version18LinuxValida && version18WinValida && error17Rechazado && error16Rechazado && errorInvalidoRechazado;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('PRUEBA W: COBERTURA UNIVERSAL DE CIERRE TRANSACCIONAL (FASE 7F-D2)');
  console.log('─────────────────────────────────────────────────────────────');

  const cliTx = new Client({ connectionString: URL_BASE_ORIGEN, ssl: false });
  await cliTx.connect();

  // Escenario A: item-only
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO item (codigo, enunciado, peso, id_dimension) VALUES ('ITM_TEST_7F', 'Pregunta Test Item 7F', 1.0, 1);");
  await cliTx.query('COMMIT;');
  const resItem = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla = 'item' ORDER BY id_registro DESC LIMIT 1;");
  const cierreItemOk = resItem.rows[0]?.fecha_cierre_transaccion_aprox !== null && resItem.rows[0]?.fecha_cierre_transaccion_aprox !== undefined;
  ok(cierreItemOk, 'Escenario A: Transacción que modifica SOLO item obtiene fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario B: usuario-only
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO usuario (correo, nombre, clave_hash, id_rol, id_unidad) VALUES ('user7f_d2@test.pe', 'Usuario Test 7F D2', 'hash_test', 1, 1);");
  await cliTx.query('COMMIT;');
  const resUser = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla = 'usuario' ORDER BY id_registro DESC LIMIT 1;");
  const cierreUserOk = resUser.rows[0]?.fecha_cierre_transaccion_aprox !== null && resUser.rows[0]?.fecha_cierre_transaccion_aprox !== undefined;
  ok(cierreUserOk, 'Escenario B: Transacción que modifica SOLO usuario obtiene fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario C: rol-only
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO rol (nombre) VALUES ('Rol Test 7F D2');");
  await cliTx.query('COMMIT;');
  const resRol = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla = 'rol' ORDER BY id_registro DESC LIMIT 1;");
  const cierreRolOk = resRol.rows[0]?.fecha_cierre_transaccion_aprox !== null && resRol.rows[0]?.fecha_cierre_transaccion_aprox !== undefined;
  ok(cierreRolOk, 'Escenario C: Transacción que modifica SOLO rol obtiene fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario D: proveedor
  await cliTx.query('BEGIN;');
  await cliTx.query("UPDATE proveedor SET razon_social = 'Proveedor Test D2' WHERE ruc = '20222222222';");
  await cliTx.query('COMMIT;');
  const resProv = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla = 'proveedor' ORDER BY id_registro DESC LIMIT 1;");
  const cierreProvOk = resProv.rows[0]?.fecha_cierre_transaccion_aprox !== null && resProv.rows[0]?.fecha_cierre_transaccion_aprox !== undefined;
  ok(cierreProvOk, 'Escenario D: Transacción que modifica proveedor obtiene fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario E: evaluacion
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO evaluacion (id_campania, id_proveedor, token, estado) VALUES (1, 1, 'token_d2_test', 'En proceso');");
  await cliTx.query('COMMIT;');
  const resEval = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla = 'evaluacion' ORDER BY id_registro DESC LIMIT 1;");
  const cierreEvalOk = resEval.rows[0]?.fecha_cierre_transaccion_aprox !== null && resEval.rows[0]?.fecha_cierre_transaccion_aprox !== undefined;
  ok(cierreEvalOk, 'Escenario E: Transacción que modifica evaluacion obtiene fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario F: multitabla en una sola transacción
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO industria (codigo, nombre) VALUES ('IND_D2', 'Industria 7F D2');");
  await cliTx.query("INSERT INTO dimension (codigo, nombre, peso) VALUES ('DIM_D2', 'Dimension 7F D2', 0.200);");
  await cliTx.query('COMMIT;');
  const resMulti = await cliTx.query("SELECT fecha_cierre_transaccion_aprox FROM registro_recuperacion WHERE nombre_tabla IN ('industria', 'dimension') AND fecha_cierre_transaccion_aprox IS NOT NULL;");
  const cierreMultiOk = resMulti.rows.length >= 2;
  ok(cierreMultiOk, 'Escenario F: Transacción multitabla cierra todas sus filas con fecha_cierre_transaccion_aprox NOT NULL');

  // Escenario G: ROLLBACK
  await cliTx.query('BEGIN;');
  await cliTx.query("INSERT INTO unidad_negocio (codigo, nombre) VALUES ('UN_AB_D2', 'Unidad Abortada D2');");
  await cliTx.query('ROLLBACK;');
  const resRollback = await cliTx.query("SELECT count(*) as c FROM registro_recuperacion WHERE nombre_tabla = 'unidad_negocio' AND datos_nuevos->>'codigo' = 'UN_AB_D2';");
  const rollbackOk = resRollback.rows[0].c === '0';
  ok(rollbackOk, 'Escenario G: ROLLBACK no persiste filas de journal de transacciones abortadas');

  // Escenario H: Ausencia total de nulos en registro_recuperacion
  const resNullCheck = await cliTx.query("SELECT count(*) as c FROM registro_recuperacion WHERE fecha_cierre_transaccion_aprox IS NULL;");
  const ceroNulosOk = resNullCheck.rows[0].c === '0';
  ok(ceroNulosOk, 'Escenario H: Cero filas con fecha_cierre_transaccion_aprox NULL en todo registro_recuperacion');

  await cliTx.end();

  resultados.coberturaUniversalCierre = cierreItemOk && cierreUserOk && cierreRolOk && cierreProvOk && cierreEvalOk && cierreMultiOk && rollbackOk && ceroNulosOk;

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('RESUMEN DE PRUEBAS OPERACIONALES FASE 7F-B');
  console.log('══════════════════════════════════════════════════════════════');

  const todosPasan = Object.values(resultados).every(Boolean);
  const totalEscenarios = Object.keys(resultados).length;
  console.log(`\nVEREDICTO GENERAL: ${todosPasan ? `✅ 29 VERIFICACIONES APROBADAS EN ${totalEscenarios} ESCENARIOS (0 FALLOS)` : '❌ ALGUNA PRUEBA FALLA'}`);
  console.log('Detalle de resultados por escenario:', JSON.stringify(resultados, null, 2));

  return { todosPasan, totalEscenarios, resultados };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('pruebasOperacionales7F.js')) {
  ejecutarPruebasOperacionales7F()
    .then(r => process.exit(r.todosPasan ? 0 : 1))
    .catch(err => {
      console.error('Error fatal ejecutando pruebas operacionales 7F:', err);
      process.exit(1);
    });
}
