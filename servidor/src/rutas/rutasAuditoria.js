import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import { obtenerRegistrosAuditoria, registrarAccionAuditoria } from '../controladores/controladorAuditoria.js';

export const enrutadorAuditoria = Router();

enrutadorAuditoria.get('/', verificarSesion, requierePermiso('ver_dashboard_corporativo'), obtenerRegistrosAuditoria);
enrutadorAuditoria.post('/registrar', verificarSesion, registrarAccionAuditoria);
