import { Router } from 'express';
import { iniciarSesion } from '../controladores/controladorAutenticacion.js';
import { limitadorLogin } from '../middleware/limitadorPeticiones.js';

export const enrutadorAutenticacion = Router();

enrutadorAutenticacion.post('/login', limitadorLogin, iniciarSesion);
