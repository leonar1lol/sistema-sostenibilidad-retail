import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  obtenerDatosMaestros,
  obtenerListaProveedores,
  incorporarNuevoProveedor,
  actualizarUnidadesProveedor,
  editarRazonSocial
} from '../controladores/controladorProveedor.js';
import { listarEvidenciaProveedorAdmin } from '../controladores/controladorEvidencia.js';

export const enrutadorProveedor = Router();

enrutadorProveedor.get('/datos-maestros', obtenerDatosMaestros);

enrutadorProveedor.get('/', verificarSesion, obtenerListaProveedores);
enrutadorProveedor.post('/', verificarSesion, requierePermiso('marcar_critico'), incorporarNuevoProveedor);
enrutadorProveedor.put('/:id/unidades', verificarSesion, requierePermiso('marcar_critico'), actualizarUnidadesProveedor);
enrutadorProveedor.put('/:id/razon-social', verificarSesion, requierePermiso('actualizar_razon_social'), editarRazonSocial);
enrutadorProveedor.get('/:idProveedor/evidencia', verificarSesion, listarEvidenciaProveedorAdmin);
