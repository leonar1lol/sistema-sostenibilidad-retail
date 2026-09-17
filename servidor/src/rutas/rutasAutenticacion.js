import { Router } from 'express';
import { iniciarSesion } from '../controladores/controladorAutenticacion.js';

export const enrutadorAutenticacion = Router();

enrutadorAutenticacion.post('/login', iniciarSesion);
