import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarCampanias,
  crearCampania,
  cambiarEstadoCampania,
  eliminarCampania,
  listarEvaluacionesDeCampania,
  enviarRecordatorio
} from '../controladores/controladorCampania.js';

export const enrutadorCampania = Router();

enrutadorCampania.use(verificarSesion);

enrutadorCampania.get('/', requierePermiso('crear_publicar_campanias'), listarCampanias);
enrutadorCampania.post('/', requierePermiso('crear_publicar_campanias'), crearCampania);
enrutadorCampania.patch('/:id/estado', requierePermiso('crear_publicar_campanias'), cambiarEstadoCampania);
enrutadorCampania.delete('/:id', requierePermiso('crear_publicar_campanias'), eliminarCampania);

enrutadorCampania.get('/:id/evaluaciones', listarEvaluacionesDeCampania);
enrutadorCampania.post('/evaluaciones/:idEvaluacion/recordatorio', requierePermiso('asignar_evaluaciones'), enviarRecordatorio);
