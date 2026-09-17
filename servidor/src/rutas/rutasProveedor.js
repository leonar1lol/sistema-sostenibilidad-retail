import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  obtenerDatosMaestros,
  obtenerListaProveedores,
  incorporarNuevoProveedor,
  alternarProveedorCritico
} from '../controladores/controladorProveedor.js';
import { listarEvidenciaProveedorAdmin } from '../controladores/controladorEvidencia.js';

export const enrutadorProveedor = Router();

enrutadorProveedor.get('/datos-maestros', obtenerDatosMaestros);

enrutadorProveedor.get('/', verificarSesion, obtenerListaProveedores);
enrutadorProveedor.post('/', verificarSesion, requierePermiso('marcar_critico'), incorporarNuevoProveedor);
enrutadorProveedor.patch('/:id/critico', verificarSesion, requierePermiso('marcar_critico'), alternarProveedorCritico);
enrutadorProveedor.get('/:idProveedor/evidencia', verificarSesion, listarEvidenciaProveedorAdmin);
