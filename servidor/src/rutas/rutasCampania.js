import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarCampanias,
  crearCampania,
  cambiarEstadoCampania,
  listarEvaluacionesDeCampania,
  enviarRecordatorio
} from '../controladores/controladorCampania.js';

export const enrutadorCampania = Router();

enrutadorCampania.use(verificarSesion);

enrutadorCampania.get('/', listarCampanias);
enrutadorCampania.post('/', requierePermiso('crear_publicar_campanias'), crearCampania);
enrutadorCampania.patch('/:id/estado', requierePermiso('crear_publicar_campanias'), cambiarEstadoCampania);

enrutadorCampania.get('/:id/evaluaciones', listarEvaluacionesDeCampania);
enrutadorCampania.post('/evaluaciones/:idEvaluacion/recordatorio', requierePermiso('asignar_evaluaciones'), enviarRecordatorio);
