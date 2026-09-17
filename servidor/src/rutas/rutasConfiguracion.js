import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarUnidadesNegocio,
  crearUnidadNegocio,
  editarUnidadNegocio,
  listarIndustrias,
  crearIndustria,
  editarIndustria,
  listarDimensiones,
  actualizarPesosDimensiones
} from '../controladores/controladorConfiguracion.js';

export const enrutadorConfiguracion = Router();

enrutadorConfiguracion.use(verificarSesion);

enrutadorConfiguracion.get('/unidades', listarUnidadesNegocio);
enrutadorConfiguracion.post('/unidades', requierePermiso('configurar_banco_items'), crearUnidadNegocio);
enrutadorConfiguracion.put('/unidades/:id', requierePermiso('configurar_banco_items'), editarUnidadNegocio);

enrutadorConfiguracion.get('/industrias', listarIndustrias);
enrutadorConfiguracion.post('/industrias', requierePermiso('configurar_banco_items'), crearIndustria);
enrutadorConfiguracion.put('/industrias/:id', requierePermiso('configurar_banco_items'), editarIndustria);

enrutadorConfiguracion.get('/dimensiones', listarDimensiones);
enrutadorConfiguracion.put('/dimensiones', requierePermiso('configurar_banco_items'), actualizarPesosDimensiones);
