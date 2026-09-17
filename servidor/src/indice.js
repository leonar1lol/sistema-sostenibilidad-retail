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

Sentry.setupExpressErrorHandler(aplicacionServidor);

aplicacionServidor.listen(puertoServicio, () => {
  console.log(`Servidor de API iniciado en el puerto ${puertoServicio}`);
});
