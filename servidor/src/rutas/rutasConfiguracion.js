import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarUnidadesNegocio,
  crearUnidadNegocio,
  editarUnidadNegocio,
  cambiarEstadoUnidadNegocio,
  listarIndustrias,
  crearIndustria,
  editarIndustria,
  cambiarEstadoIndustria,
  listarDimensiones,
  crearDimension,
  editarDimension,
  cambiarEstadoDimension,
  actualizarPesosDimensiones,
  obtenerConfiguracionCriticidad,
  actualizarConfiguracionPesos,
  actualizarConfiguracionCriticidadPorTipo
} from '../controladores/controladorConfiguracion.js';

export const enrutadorConfiguracion = Router();

enrutadorConfiguracion.use(verificarSesion);

enrutadorConfiguracion.get('/unidades', listarUnidadesNegocio);
enrutadorConfiguracion.post('/unidades', requierePermiso('configurar_banco_items'), crearUnidadNegocio);
enrutadorConfiguracion.put('/unidades/:id', requierePermiso('configurar_banco_items'), editarUnidadNegocio);
enrutadorConfiguracion.patch('/unidades/:id/estado', requierePermiso('configurar_banco_items'), cambiarEstadoUnidadNegocio);

enrutadorConfiguracion.get('/industrias', listarIndustrias);
enrutadorConfiguracion.post('/industrias', requierePermiso('configurar_banco_items'), crearIndustria);
enrutadorConfiguracion.put('/industrias/:id', requierePermiso('configurar_banco_items'), editarIndustria);
enrutadorConfiguracion.patch('/industrias/:id/estado', requierePermiso('configurar_banco_items'), cambiarEstadoIndustria);

enrutadorConfiguracion.get('/dimensiones', listarDimensiones);
enrutadorConfiguracion.post('/dimensiones', requierePermiso('configurar_banco_items'), crearDimension);
enrutadorConfiguracion.put('/dimensiones/:id', requierePermiso('configurar_banco_items'), editarDimension);
enrutadorConfiguracion.patch('/dimensiones/:id/estado', requierePermiso('configurar_banco_items'), cambiarEstadoDimension);
enrutadorConfiguracion.put('/dimensiones', requierePermiso('configurar_banco_items'), actualizarPesosDimensiones);

enrutadorConfiguracion.get('/criticidad', obtenerConfiguracionCriticidad);
enrutadorConfiguracion.put('/criticidad/pesos', requierePermiso('configurar_banco_items'), actualizarConfiguracionPesos);
enrutadorConfiguracion.put('/criticidad/:tipoIndustria', requierePermiso('configurar_banco_items'), actualizarConfiguracionCriticidadPorTipo);
