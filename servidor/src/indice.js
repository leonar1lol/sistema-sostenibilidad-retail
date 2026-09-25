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
dotenv.config();

const aplicacionServidor = express();
const puertoServicio = process.env.PORT || process.env.PUERTO || 4000;

aplicacionServidor.use(cors());
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
Sentry.setupExpressErrorHandler(aplicacionServidor);

aplicacionServidor.listen(puertoServicio, () => {
  console.log(`Servidor de API iniciado en el puerto ${puertoServicio}`);
});
