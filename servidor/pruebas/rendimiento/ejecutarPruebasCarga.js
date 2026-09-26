import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const rutaActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaActual);
const rutaRaizServidor = path.resolve(directorioActual, '../..');

// Cargar variables de entorno del servidor para verificar aislamiento respecto a produccion
const rutaEnvServidor = path.resolve(rutaRaizServidor, '.env');
const variablesEnvOperativas = dotenv.parse(fs.readFileSync(rutaEnvServidor, 'utf8'));

const urlOperativaNeon = variablesEnvOperativas.URL_BASE_DATOS || '';
const puertoServicioTest = process.env.PUERTO_TEST || 4001;
const urlBaseServicioTest = `http://localhost:${puertoServicioTest}`;

const hostTestAislado = '127.0.0.1:5433';
const nombreBaseDatosTest = 'sostenibilidad_test';
const secretoJwtTest = 'clave_secreta_jwt_para_pruebas_aisladas_de_rendimiento_32_chars';

// Extraer host de la conexion operativa de forma sanitizada sin exponer credenciales
const extraerHost = (cadena) => {
  if (!cadena) return '';
  try {
    const urlObj = new URL(cadena);
    return urlObj.host || urlObj.hostname || '';
  } catch {
    const m = cadena.match(/@([^:\/?#]+)/);
    return m ? m[1] : '';
  }
};

const hostOperativo = extraerHost(urlOperativaNeon);

// Validacion formal de aislamiento conforme a las reglas de guardianBaseDatos
const validarAislamiento = () => {
  if (!hostOperativo) {
    throw new Error('Fallo de validacion: No se detecto host operativo en configuracion.');
  }
  if (hostTestAislado === hostOperativo || hostTestAislado.includes(hostOperativo)) {
    throw new Error('BLOQUEO DE SEGURIDAD CRITICO: El host TEST coincide con el host operativo.');
  }
  return true;
};

validarAislamiento();

// Mostrar confirmacion obligatoria de 5 puntos antes de iniciar carga
console.log('================================================================================');
console.log('GATE DE CONFIRMACION PREVIO A PRUEBAS FORMALES RNF05');
console.log('================================================================================');
console.log('ENTORNO: TEST');
console.log(`HOST: ${hostTestAislado}`);
console.log(`DATABASE: ${nombreBaseDatosTest}`);
console.log('OPERATIVA: NO');
console.log('AISLAMIENTO GUARDIAN: APROBADO');
console.log('================================================================================\n');

// Generar token JWT temporal de prueba en memoria sin credenciales productivas
const generarTokenJwtTest = () => {
  return jwt.sign(
    {
      idUsuario: 1,
      correo: 'admin.test@intercorpretail.pe',
      rol: 'Administrador Corporativo',
      idUnidad: null,
      permisos: ['*']
    },
    secretoJwtTest,
    { expiresIn: '2h' }
  );
};

const tokenJwtTest = generarTokenJwtTest();

// Escenarios formales aprobados
const escenariosFormales = [
  {
    codigo: 'A',
    nombre: 'Línea Base (Mono-conexión)',
    conexiones: 1,
    duracionSegundos: 10,
    descripcion: '1 conexión concurrente secuencial sin contención'
  },
  {
    codigo: 'B',
    nombre: 'Carga Ligera (Concurrencia Reducida)',
    conexiones: 5,
    duracionSegundos: 15,
    descripcion: '5 conexiones concurrentes continuas'
  },
  {
    codigo: 'C',
    nombre: 'Carga Normal Formal — Criterio RNF05',
    conexiones: 20,
    duracionSegundos: 30,
    descripcion: '20 conexiones concurrentes durante 30 segundos (supuesto experimental de carga normal)'
  }
];

// Endpoints formales de solo lectura
const endpointsFormales = [
  {
    id: 'SALUD',
    ruta: '/api/salud',
    descripcion: 'GET /api/salud [Memoria Node.js]',
    cabeceras: []
  },
  {
    id: 'MONITOREO_BD',
    ruta: '/api/sistema/monitoreo-bd',
    descripcion: 'GET /api/sistema/monitoreo-bd [SELECT NOW() en PostgreSQL TEST]',
    cabeceras: []
  },
  {
    id: 'DATOS_MAESTROS',
    ruta: '/api/proveedores/datos-maestros',
    descripcion: 'GET /api/proveedores/datos-maestros [Catálogos en PostgreSQL TEST]',
    cabeceras: []
  },
  {
    id: 'PROVEEDORES_AUTH',
    ruta: '/api/proveedores',
    descripcion: 'GET /api/proveedores [Consulta Compleja con JWT TEST]',
    cabeceras: [`Authorization=Bearer ${tokenJwtTest}`]
  }
];

const comandoNpx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const invocarAutocannon = (urlDestino, conexiones, duracionSegundos, cabeceras = []) => {
  const argumentos = [
    '--yes',
    'autocannon@7.15.0',
    '-c', String(conexiones),
    '-d', String(duracionSegundos),
    '-j'
  ];

  for (const cabecera of cabeceras) {
    argumentos.push('-H', `"${cabecera}"`);
  }

  argumentos.push(urlDestino);

  const ejecucion = spawnSync(comandoNpx, argumentos, {
    cwd: rutaRaizServidor,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 10 * 1024 * 1024
  });

  if (ejecucion.error) {
    throw ejecucion.error;
  }

  try {
    return JSON.parse(ejecucion.stdout);
  } catch (error) {
    throw new Error(`Fallo al decodificar salida de autocannon: ${ejecucion.stdout || ejecucion.stderr}`);
  }
};

const precalentarServicio = () => {
  console.log('Precalentando endpoints formales en servidor TEST (warm-up 3s)...');
  for (const ep of endpointsFormales) {
    try {
      invocarAutocannon(`${urlBaseServicioTest}${ep.ruta}`, 2, 3, ep.cabeceras);
    } catch {
    }
  }
  console.log('Precalentamiento concluido.\n');
};

const ejecutarPruebasFormales = () => {
  console.log('================================================================================');
  console.log('INICIANDO PRUEBAS FORMALES DE RENDIMIENTO RNF05 EN ENTORNO TEST AISLADO');
  console.log(`Herramienta: autocannon 7.15.0`);
  console.log(`Servidor TEST: ${urlBaseServicioTest}`);
  console.log(`Fecha de ejecucion: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  precalentarServicio();

  const resultadosFormales = [];

  for (const ep of endpointsFormales) {
    console.log('--------------------------------------------------------------------------------');
    console.log(`Evaluando: ${ep.descripcion}`);
    console.log('--------------------------------------------------------------------------------');

    for (const esc of escenariosFormales) {
      process.stdout.write(`  Ejecutando Escenario ${esc.codigo} (${esc.conexiones} conexiones concurrentes, ${esc.duracionSegundos}s)... `);

      const urlDestino = `${urlBaseServicioTest}${ep.ruta}`;
      const salidaCruda = invocarAutocannon(urlDestino, esc.conexiones, esc.duracionSegundos, ep.cabeceras);

      const totalPeticiones = salidaCruda.requests?.total || 0;
      const peticionesPorSegundo = salidaCruda.requests?.average || 0;
      const latenciaPromedio = salidaCruda.latency?.average || 0;
      const latenciaMediana = salidaCruda.latency?.p50 || 0;
      const latenciaP90 = salidaCruda.latency?.p90 || 0;
      const latenciaP97_5 = salidaCruda.latency?.p97_5 || 0;
      const latenciaP99 = salidaCruda.latency?.p99 || 0;
      const latenciaMaxima = salidaCruda.latency?.max || 0;
      const erroresTotal = (salidaCruda.errors || 0) + (salidaCruda.timeouts || 0) + (salidaCruda.non2xx || 0);
      const porcentajeErrores = totalPeticiones > 0 ? ((erroresTotal / totalPeticiones) * 100).toFixed(2) : '0.00';

      const registro = {
        endpointId: ep.id,
        endpointRuta: ep.ruta,
        entorno: 'TEST_AISLADO',
        escenarioCodigo: esc.codigo,
        escenarioNombre: esc.nombre,
        conexionesConcurrentes: esc.conexiones,
        duracionSegundos: esc.duracionSegundos,
        totalPeticiones,
        peticionesPorSegundo: Math.round(peticionesPorSegundo),
        latenciaPromedioMs: Number(latenciaPromedio.toFixed(2)),
        latenciaP50Ms: latenciaMediana,
        latenciaP90Ms: latenciaP90,
        latenciaP97_5Ms: latenciaP97_5,
        latenciaP99Ms: latenciaP99,
        latenciaMaximaMs: latenciaMaxima,
        erroresTotal,
        porcentajeErrores: Number(porcentajeErrores),
        distribucionEstados: salidaCruda.statusCodeStats || {},
        cumpleRnf05: latenciaP97_5 < 3000 && Number(porcentajeErrores) < 1.0
      };

      resultadosFormales.push(registro);

      console.log('Hecho.');
      console.log(`    Sol: ${totalPeticiones} | RPS: ${Math.round(peticionesPorSegundo)} | Avg: ${latenciaPromedio.toFixed(1)}ms | p50: ${latenciaMediana}ms | p90: ${latenciaP90}ms | p97.5: ${latenciaP97_5}ms | p99: ${latenciaP99}ms | Max: ${latenciaMaxima}ms | Err: ${porcentajeErrores}%`);
    }
    console.log('');
  }

  // Guardar resultados formales sanitizados
  const rutaResultados = path.resolve(directorioActual, 'resultados-test-rnf05.json');
  fs.writeFileSync(rutaResultados, JSON.stringify(resultadosFormales, null, 2), 'utf8');

  console.log('================================================================================');
  console.log('MATRIZ FORMAL DE RESULTADOS — ESCENARIO C: 20 CONEXIONES CONCURRENTES (30s)');
  console.log('================================================================================');

  const evaluacionCargaNormal = resultadosFormales.filter(r => r.escenarioCodigo === 'C');
  let todasCumplen = true;

  console.log(
    'Endpoint'.padEnd(32) +
    'Concurrencia'.padEnd(14) +
    'Requests'.padEnd(10) +
    'RPS'.padEnd(10) +
    'Avg(ms)'.padEnd(10) +
    'p50'.padEnd(8) +
    'p90'.padEnd(8) +
    'p97.5'.padEnd(8) +
    'p99'.padEnd(8) +
    'Max'.padEnd(8) +
    'Err%'.padEnd(8) +
    'RNF05'
  );
  console.log('-'.repeat(128));

  for (const item of evaluacionCargaNormal) {
    if (!item.cumpleRnf05) {
      todasCumplen = false;
    }
    const veredicto = item.cumpleRnf05 ? 'APROBADO' : 'NO CONFORME';
    console.log(
      item.endpointRuta.padEnd(32) +
      `${item.conexionesConcurrentes} conn`.padEnd(14) +
      String(item.totalPeticiones).padEnd(10) +
      String(item.peticionesPorSegundo).padEnd(10) +
      String(item.latenciaPromedioMs).padEnd(10) +
      String(item.latenciaP50Ms).padEnd(8) +
      String(item.latenciaP90Ms).padEnd(8) +
      String(item.latenciaP97_5Ms).padEnd(8) +
      String(item.latenciaP99Ms).padEnd(8) +
      String(item.latenciaMaximaMs).padEnd(8) +
      `${item.porcentajeErrores}%`.padEnd(8) +
      veredicto
    );
  }

  console.log('================================================================================');
  console.log(`VEREDICTO FINAL: ${todasCumplen ? 'RNF05 — ✅ DEMOSTRADO EN ENTORNO DE PRUEBA CONTROLADO Y AISLADO' : 'RNF05 — NO DEMOSTRADO'}`);
  console.log(`Resultados guardados en: ${rutaResultados}`);
  console.log('================================================================================\n');

  return resultadosFormales;
};

ejecutarPruebasFormales();
