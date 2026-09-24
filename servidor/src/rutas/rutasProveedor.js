import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  obtenerDatosMaestros,
  obtenerListaProveedores,
  incorporarNuevoProveedor,
  alternarCriticidadUnidad,
  cambiarEstadoProveedor,
  actualizarClasificacionRiesgo
} from '../controladores/controladorProveedor.js';
import { listarEvidenciaProveedorAdmin } from '../controladores/controladorEvidencia.js';

export const enrutadorProveedor = Router();

enrutadorProveedor.get('/datos-maestros', obtenerDatosMaestros);

enrutadorProveedor.get('/', verificarSesion, obtenerListaProveedores);
enrutadorProveedor.post('/', verificarSesion, requierePermiso('marcar_critico'), incorporarNuevoProveedor);
enrutadorProveedor.patch('/:id/critico', verificarSesion, requierePermiso('marcar_critico'), alternarCriticidadUnidad);
enrutadorProveedor.patch('/:id/estado', verificarSesion, requierePermiso('marcar_critico'), cambiarEstadoProveedor);
enrutadorProveedor.patch('/:id/riesgo', verificarSesion, requierePermiso('marcar_critico'), actualizarClasificacionRiesgo);
enrutadorProveedor.get('/:idProveedor/evidencia', verificarSesion, listarEvidenciaProveedorAdmin);
