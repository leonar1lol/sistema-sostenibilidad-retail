import { Router } from 'express';
import { verificarSesionProveedor, requiereEvaluacionAsignada } from '../middleware/autenticacionProveedor.js';
import {
  solicitarAcceso,
  verificarAcceso,
  registrarProveedor,
  obtenerCuestionario,
  guardarRespuesta,
  finalizarEvaluacion,
  obtenerResultado
} from '../controladores/controladorPortal.js';
import {
  subidaMulter,
  subirEvidenciaPortal,
  listarEvidenciaItemPortal,
  eliminarEvidenciaPortal
} from '../controladores/controladorEvidencia.js';

export const enrutadorPortal = Router();

enrutadorPortal.post('/acceso', solicitarAcceso);
enrutadorPortal.post('/verificar', verificarAcceso);
enrutadorPortal.post('/registro', verificarSesionProveedor, registrarProveedor);

enrutadorPortal.get('/cuestionario', verificarSesionProveedor, requiereEvaluacionAsignada, obtenerCuestionario);
enrutadorPortal.post('/respuesta', verificarSesionProveedor, requiereEvaluacionAsignada, guardarRespuesta);
enrutadorPortal.post('/finalizar', verificarSesionProveedor, requiereEvaluacionAsignada, finalizarEvaluacion);
enrutadorPortal.get('/resultado', verificarSesionProveedor, requiereEvaluacionAsignada, obtenerResultado);

enrutadorPortal.post('/items/:idItem/evidencia', verificarSesionProveedor, requiereEvaluacionAsignada, subidaMulter, subirEvidenciaPortal);
enrutadorPortal.get('/items/:idItem/evidencia', verificarSesionProveedor, requiereEvaluacionAsignada, listarEvidenciaItemPortal);
enrutadorPortal.delete('/evidencia/:idEvidencia', verificarSesionProveedor, requiereEvaluacionAsignada, eliminarEvidenciaPortal);
