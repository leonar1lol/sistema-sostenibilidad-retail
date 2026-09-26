import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { cifrarContenido } from './servicioCifradoBackup.js';
import { restaurarAPuntoEnElTiempo } from './restaurarPuntoTiempo.js';

const rutaActual = fileURLToPath(import.meta.url);
const dirActual = path.dirname(rutaActual);
const rutaRaizProyecto = path.resolve(dirActual, '../../..');

const CLAVE_CIFRADO_TEST = 'clave_secreta_segura_de_32_bytes_para_recuperacion_2026';
const URL_PG_TEST_ADMIN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/postgres';
const URL_PG_ORIGEN = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/sostenibilidad_origen';
const URL_PG_RECUPERADA = 'postgresql://postgres_test:test_password_123@127.0.0.1:5433/sostenibilidad_recuperada';

const esperarMs = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function generarVolcadoSqlCompleto(cliente) {
  const tablas = [
    'rol', 'permiso', 'rol_permiso', 'unidad_negocio', 'usuario',
    'industria', 'dimension', 'item', 'item_industria', 'alternativa',
    'regla_condicional', 'campania', 'proveedor', 'evaluacion',
    'respuesta', 'puntaje_dimension', 'recomendacion', 'evidencia', 'auditoria'
  ];

  let sqlDump = 'SET CONSTRAINTS ALL DEFERRED;\n';

  for (const tabla of tablas) {
    const res = await cliente.query(`SELECT * FROM "${tabla}";`);
    if (res.rows.length > 0) {
      for (const fila of res.rows) {
        const columnas = Object.keys(fila);
        const nombresCols = columnas.map(c => `"${c}"`).join(', ');
        const valoresSql = columnas.map(c => {
          const val = fila[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        sqlDump += `INSERT INTO "${tabla}" (${nombresCols}) VALUES (${valoresSql}) ON CONFLICT DO NOTHING;\n`;
      }
    }
  }

  return sqlDump;
}

export async function ejecutarPruebaCompletaRecuperacion() {
  console.log('--- INICIO DE PRUEBA FORMAL DE RECUPERACIÓN POINT-IN-TIME (RNF09) ---');
  console.log('Entorno: PostgreSQL TEST Aislado (Puerto 5433)');

  const clienteAdmin = new pg.Client({ connectionString: URL_PG_TEST_ADMIN, ssl: false });
  await clienteAdmin.connect();

  await clienteAdmin.query('DROP DATABASE IF EXISTS sostenibilidad_origen;');
  await clienteAdmin.query('DROP DATABASE IF EXISTS sostenibilidad_recuperada;');
  await clienteAdmin.query('CREATE DATABASE sostenibilidad_origen;');
  await clienteAdmin.query('CREATE DATABASE sostenibilidad_recuperada;');
  await clienteAdmin.end();

  const clienteOrigen = new pg.Client({ connectionString: URL_PG_ORIGEN, ssl: false });
  const clienteRecuperada = new pg.Client({ connectionString: URL_PG_RECUPERADA, ssl: false });
  await clienteOrigen.connect();
  await clienteRecuperada.connect();

  const sqlEsquemaInicial = fs.readFileSync(path.resolve(rutaRaizProyecto, 'base-datos/esquema_inicial.sql'), 'utf8');
  const sqlJournal = fs.readFileSync(path.resolve(dirActual, 'esquemaJournal.sql'), 'utf8');

  await clienteOrigen.query(sqlEsquemaInicial);
  await clienteOrigen.query(sqlJournal);
  await clienteRecuperada.query(sqlEsquemaInicial);

  console.log('\n[T0] Insertando dataset inicial de referencia...');
  await clienteOrigen.query(`
    INSERT INTO item (id_item, codigo, enunciado, peso, id_dimension)
    VALUES (1, 'ITM-AMB-01', '¿Cuenta con politica de sostenibilidad ambiental?', 1.0, 1)
    ON CONFLICT (id_item) DO NOTHING;

    INSERT INTO alternativa (id_alternativa, id_item, texto, puntaje, orden)
    VALUES (1, 1, 'Implementado y certificado externamente', 100.0, 1)
    ON CONFLICT (id_alternativa) DO NOTHING;

    INSERT INTO proveedor (ruc, razon_social, nombre_comercial, representante, correo, tipo, id_unidad, id_industria)
    VALUES 
      ('20100000001', 'Distribuidora T0 Base S.A.C.', 'Alimentos Alfa', 'Representante Base', 'contacto@alfa.test', 'Retail', 1, 1),
      ('20400000004', 'Proveedor Persistente T0 S.A.C.', 'Comercial Beta', 'Representante Beta', 'contacto@beta.test', 'Retail', 1, 1);

    INSERT INTO evaluacion (id_campania, id_proveedor, token, estado, puntaje_total)
    VALUES (1, 1, 'tok_eval_001', 'Pendiente', null);
  `);
  await esperarMs(100);

  console.log('[T1] Generando respaldo base completo y cifrando con AES-256-GCM...');
  const volcadoSqlT1 = await generarVolcadoSqlCompleto(clienteOrigen);
  const paqueteBackupBaseCifrado = cifrarContenido(volcadoSqlT1, CLAVE_CIFRADO_TEST);
  console.log(`Respaldo base generado: ${volcadoSqlT1.length} bytes texto, ${paqueteBackupBaseCifrado.length} bytes cifrados.`);
  await esperarMs(100);

  console.log('[T2] Modificando proveedor 1 (razon_social actualizada) e insertando proveedor efímero...');
  await clienteOrigen.query(`
    UPDATE proveedor 
    SET razon_social = 'Distribuidora T2 Actualizada S.A.C.' 
    WHERE ruc = '20100000001';

    INSERT INTO proveedor (ruc, razon_social, nombre_comercial, representante, correo, tipo, id_unidad, id_industria)
    VALUES ('20300000003', 'Proveedor Efimero T2 S.A.C.', 'Efimero', 'Representante 3', 'efimero@test.com', 'Retail', 1, 1);
  `);
  await esperarMs(50);

  console.log('[T2.5] Eliminando proveedor efímero antes de TARGET_TIME (prueba de DELETE rejugable)...');
  await clienteOrigen.query(`DELETE FROM proveedor WHERE ruc = '20300000003';`);
  await esperarMs(100);

  console.log('[T3] Insertando respuesta de evaluación (id_evaluacion: 1, id_item: 1, id_alternativa: 1)...');
  await clienteOrigen.query(`
    INSERT INTO respuesta (id_evaluacion, id_item, id_alternativa) 
    VALUES (1, 1, 1);
  `);
  await esperarMs(100);

  const marcaTiempoObjetivoIso = new Date().toISOString();
  console.log(`\n================================================================`);
  console.log(`>>> TARGET_TIME FIJADO: ${marcaTiempoObjetivoIso} <<<`);
  console.log(`================================================================\n`);
  await esperarMs(200);

  console.log('[T4 - POST CORTE] Modificando evaluacion 1 (estado: Finalizado, puntaje: 95.50)...');
  await clienteOrigen.query(`
    UPDATE evaluacion 
    SET estado = 'Finalizado', puntaje_total = 95.50, fecha_envio = now()
    WHERE id_evaluacion = 1;
  `);
  await esperarMs(100);

  console.log('[T5 - POST CORTE] Insertando proveedor 2 posterior al corte...');
  await clienteOrigen.query(`
    INSERT INTO proveedor (ruc, razon_social, nombre_comercial, representante, correo, tipo, id_unidad, id_industria)
    VALUES ('20200000002', 'Proveedor T5 Posterior S.A.C.', 'Posterior', 'Representante 2', 'contacto@posterior.test', 'Retail', 2, 2);
  `);
  await esperarMs(100);

  console.log('[T6 - POST CORTE] Eliminando proveedor persistente 4 después del corte en origen...');
  await clienteOrigen.query(`DELETE FROM proveedor WHERE ruc = '20400000004';`);
  await esperarMs(100);

  console.log('[T7 - ROLLBACK] Probando atomicidad transaccional con ROLLBACK...');
  try {
    await clienteOrigen.query('BEGIN;');
    await clienteOrigen.query(`
      INSERT INTO proveedor (ruc, razon_social, nombre_comercial, representante, correo, tipo, id_unidad, id_industria)
      VALUES ('20999999999', 'Proveedor En Transaccion Revertida', 'Revertida', 'Representante', 'revertida@test.com', 'Retail', 1, 1);
    `);
    await clienteOrigen.query('ROLLBACK;');
    console.log('Transacción revertida con éxito.');
  } catch (errorTx) {
    await clienteOrigen.query('ROLLBACK;');
  }

  console.log('\nExtrayendo eventos del journal transaccional de origen y cifrando paquete...');
  const resEventosJournal = await clienteOrigen.query(`SELECT * FROM registro_recuperacion ORDER BY id_registro ASC;`);
  console.log(`Total de eventos registrados en journal origen: ${resEventosJournal.rows.length}`);

  const jsonJournalTexto = JSON.stringify(resEventosJournal.rows);
  const paqueteJournalCifrado = cifrarContenido(jsonJournalTexto, CLAVE_CIFRADO_TEST);

  console.log('\n--- EJECUTANDO RESTAURACIÓN DETERMINISTA A TIMESTAMP TARGET EN BASE DE RECUPERACIÓN ---');
  const resultadoRestauracion = await restaurarAPuntoEnElTiempo({
    clienteDestino: clienteRecuperada,
    paqueteBackupBaseCifrado,
    listaPaquetesJournalCifrados: [paqueteJournalCifrado],
    tiempoObjetivoIso: marcaTiempoObjetivoIso,
    claveCifrado: CLAVE_CIFRADO_TEST
  });

  console.log('Resultado de la herramienta:', resultadoRestauracion);

  console.log('\n--- VERIFICACIONES DE INTEGRIDAD Y RECONSTRUCCIÓN EXACTA ---');

  const resProv1 = await clienteRecuperada.query("SELECT * FROM proveedor WHERE ruc = '20100000001';");
  const prov1 = resProv1.rows[0];
  const condicion1 = prov1 && prov1.razon_social === 'Distribuidora T2 Actualizada S.A.C.';
  console.log(`[VERIFICACIÓN 1] Modificación T2 (<= TARGET_TIME) presente: ${condicion1 ? '✅ CORRECTO' : '❌ FALLO'} (${prov1?.razon_social})`);

  const resResp = await clienteRecuperada.query('SELECT * FROM respuesta WHERE id_evaluacion = 1 AND id_item = 1;');
  const condicion2 = resResp.rows.length === 1 && Number(resResp.rows[0].id_alternativa) === 1;
  console.log(`[VERIFICACIÓN 2] Inserción de respuesta T3 (<= TARGET_TIME) presente: ${condicion2 ? '✅ CORRECTO' : '❌ FALLO'}`);

  const resEval = await clienteRecuperada.query('SELECT * FROM evaluacion WHERE id_evaluacion = 1;');
  const eval1 = resEval.rows[0];
  const condicion3 = eval1 && eval1.estado === 'Pendiente' && eval1.puntaje_total === null;
  console.log(`[VERIFICACIÓN 3] Modificación T4 (> TARGET_TIME) EXCLUIDA: ${condicion3 ? '✅ CORRECTO' : '❌ FALLO'} (Estado: ${eval1?.estado}, Puntaje: ${eval1?.puntaje_total})`);

  const resProv2 = await clienteRecuperada.query("SELECT * FROM proveedor WHERE ruc = '20200000002';");
  const condicion4 = resProv2.rows.length === 0;
  console.log(`[VERIFICACIÓN 4] Inserción T5 (> TARGET_TIME) EXCLUIDA: ${condicion4 ? '✅ CORRECTO' : '❌ FALLO'}`);

  const resProv3 = await clienteRecuperada.query("SELECT * FROM proveedor WHERE ruc = '20300000003';");
  const condicion5 = resProv3.rows.length === 0;
  console.log(`[VERIFICACIÓN 5] Registro eliminado antes de TARGET_TIME eliminado en destino: ${condicion5 ? '✅ CORRECTO' : '❌ FALLO'}`);

  const resProv4 = await clienteRecuperada.query("SELECT * FROM proveedor WHERE ruc = '20400000004';");
  const condicion6 = resProv4.rows.length === 1;
  console.log(`[VERIFICACIÓN 6] Registro eliminado después de TARGET_TIME PRESERVADO en destino: ${condicion6 ? '✅ CORRECTO' : '❌ FALLO'}`);

  const resProvRollback = await clienteRecuperada.query("SELECT * FROM proveedor WHERE ruc = '20999999999';");
  const condicion7 = resProvRollback.rows.length === 0;
  console.log(`[VERIFICACIÓN 7] Registro de transacción ROLLBACK no existe en origen ni destino: ${condicion7 ? '✅ CORRECTO' : '❌ FALLO'}`);

  const todasCorrectas = condicion1 && condicion2 && condicion3 && condicion4 && condicion5 && condicion6 && condicion7;
  console.log('\n================================================================');
  console.log(`VEREDICTO DE LA PRUEBA FORMAL POINT-IN-TIME: ${todasCorrectas ? '✅ EXITOSA (7/7 verificaciones aprobadas en el escenario determinista evaluado)' : '❌ FALLIDA'}`);
  console.log('================================================================\n');

  await clienteOrigen.end();
  await clienteRecuperada.end();

  return {
    exito: todasCorrectas,
    marcaTiempoObjetivo: marcaTiempoObjetivoIso,
    resultadoRestauracion,
    verificaciones: {
      modificacionPreviaIncluida: condicion1,
      insercionPreviaIncluida: condicion2,
      modificacionPosteriorExcluida: condicion3,
      insercionPosteriorExcluida: condicion4,
      eliminacionPreviaEfectuada: condicion5,
      eliminacionPosteriorIgnorada: condicion6,
      rollbackNoContaminado: condicion7
    }
  };
}

// Ejecución directa si se invoca como script principal
if (process.argv[1] && process.argv[1].endsWith('pruebaRecuperacionPuntoTiempo.js')) {
  ejecutarPruebaCompletaRecuperacion()
    .then((res) => {
      if (!res.exito) process.exit(1);
    })
    .catch((err) => {
      console.error('Error durante la prueba:', err);
      process.exit(1);
    });
}
