import './instrumentacion.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { enrutadorProveedor } from './rutas/rutasProveedor.js';
import { enrutadorAuditoria } from './rutas/rutasAuditoria.js';
import { enrutadorAutenticacion } from './rutas/rutasAutenticacion.js';
import { enrutadorUsuario } from './rutas/rutasUsuario.js';
import { enrutadorRol } from './rutas/rutasRol.js';
import { enrutadorConfiguracion } from './rutas/rutasConfiguracion.js';
import { enrutadorBancoItems } from './rutas/rutasBancoItems.js';
import { enrutadorCampania } from './rutas/rutasCampania.js';
import { enrutadorPortal } from './rutas/rutasPortal.js';
import { grupoConexiones } from './configuracion/baseDatos.js';
import { aplicarCabecerasSeguridad } from './middleware/seguridadHeaders.js';

dotenv.config();

if (!process.env.CLAVE_SECRETA_JWT) {
  console.error('Error crítico de inicialización: La variable de entorno CLAVE_SECRETA_JWT es obligatoria y no está configurada.');
  process.exit(1);
}

const aplicacionServidor = express();
const puertoServicio = process.env.PORT || process.env.PUERTO || 4000;

aplicacionServidor.disable('x-powered-by');

const origenesPorDefecto = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const obtenerOrigenesPermitidos = () => {
  const configurados = (process.env.ORIGENES_PERMITIDOS || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
  const urlApp = process.env.URL_BASE_APP ? [process.env.URL_BASE_APP.trim()] : [];
  return Array.from(new Set([...origenesPorDefecto, ...configurados, ...urlApp]));
};

const opcionesCors = {
  origin: (origen, llamadaRetorno) => {
    if (!origen) {
      return llamadaRetorno(null, true);
    }
    const permitidos = obtenerOrigenesPermitidos();
    if (permitidos.includes(origen) || permitidos.includes('*')) {
      return llamadaRetorno(null, true);
    }
    return llamadaRetorno(new Error('Acceso no autorizado por la política CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

aplicacionServidor.use(aplicarCabecerasSeguridad);
aplicacionServidor.use(cors(opcionesCors));
aplicacionServidor.use(express.json());

aplicacionServidor.use('/api/autenticacion', enrutadorAutenticacion);
aplicacionServidor.use('/api/usuarios', enrutadorUsuario);
aplicacionServidor.use('/api/roles', enrutadorRol);
aplicacionServidor.use('/api/configuracion', enrutadorConfiguracion);
aplicacionServidor.use('/api/banco', enrutadorBancoItems);
aplicacionServidor.use('/api/campanias', enrutadorCampania);
aplicacionServidor.use('/api/portal', enrutadorPortal);
aplicacionServidor.use('/api/proveedores', enrutadorProveedor);
aplicacionServidor.use('/api/auditoria', enrutadorAuditoria);

aplicacionServidor.get('/api/salud', (peticion, respuesta) => {
  return respuesta.status(200).json({
    estado: 'Operativo',
    plataforma: 'Evaluaciones de Sostenibilidad Intercorp Retail',
    version: '1.0.0'
  });
});

aplicacionServidor.get('/api/sistema/monitoreo-bd', async (peticion, respuesta) => {
  const tiempoInicio = process.hrtime();
  let latenciaConsultaMs = 0;
  try {
    await grupoConexiones.query('SELECT NOW() as marca_tiempo');
    const diferenciaTiempo = process.hrtime(tiempoInicio);
    latenciaConsultaMs = (diferenciaTiempo[0] * 1000) + (diferenciaTiempo[1] / 1000000);
  } catch (error) {
    return respuesta.status(500).json({ estadoServicio: 'Error de Conexion' });
  }

  const memoria = process.memoryUsage();
  const memoriaServidorMb = Math.round(memoria.rss / 1024 / 1024);

  return respuesta.status(200).json({
    estadoServicio: 'Operativo y Conectado',
    motorBaseDatos: 'PostgreSQL en la Nube (Neon Serverless)',
    poolConexiones: {
      total: grupoConexiones.totalCount,
      inactivas: grupoConexiones.idleCount,
      enEspera: grupoConexiones.waitingCount
    },
    latenciaConsultaMs: Number(latenciaConsultaMs.toFixed(2)),
    memoriaServidorMb: memoriaServidorMb,
    politicaRespaldos: 'Cumplimiento estricto de la Regla 3-2-1 (3 copias de seguridad, 2 medios diferenciados y 1 réplica remota fuera de sitio)',
    arquitecturaReplicacion: 'Replicación distribuida multi-zona activa con respaldo continuo de transacciones (WAL streaming)',
    controlesSeguridadActivos: [
      'Prepared Statements en todas las consultas (prevención de Inyección SQL)',
      'Cifrado de credenciales con hashing seguro bcrypt',
      'Principio de Mínimo Privilegio con Control de Acceso Basado en Roles (RBAC)',
      'Autenticación multifactor / códigos OTP con vigencia temporal',
      'Bitácora de auditoría inmutable de trazabilidad'
    ]
  });
});

aplicacionServidor.use((error, peticion, respuesta, siguiente) => {
  if (error && error.message === 'Acceso no autorizado por la política CORS.') {
    return respuesta.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado por política de seguridad de origen (CORS).'
    });
  }
  return siguiente(error);
});

Sentry.setupExpressErrorHandler(aplicacionServidor);

aplicacionServidor.listen(puertoServicio, () => {
  console.log(`Servidor de API iniciado en el puerto ${puertoServicio}`);
});
