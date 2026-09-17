import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  cambiarEstadoUsuario
} from '../controladores/controladorUsuario.js';

export const enrutadorUsuario = Router();

enrutadorUsuario.use(verificarSesion, requierePermiso('administrar_usuarios_roles'));

enrutadorUsuario.get('/', listarUsuarios);
enrutadorUsuario.post('/', crearUsuario);
enrutadorUsuario.put('/:id', editarUsuario);
enrutadorUsuario.patch('/:id/estado', cambiarEstadoUsuario);
