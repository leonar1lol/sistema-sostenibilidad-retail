import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import { listarRolesYPermisos, actualizarPermisoDeRol } from '../controladores/controladorRol.js';

export const enrutadorRol = Router();

enrutadorRol.use(verificarSesion, requierePermiso('administrar_usuarios_roles'));

enrutadorRol.get('/', listarRolesYPermisos);
enrutadorRol.put('/permisos', actualizarPermisoDeRol);
