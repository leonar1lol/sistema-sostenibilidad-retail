import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  listarItems,
  crearItem,
  editarItem,
  actualizarIndustriasDelItem,
  agregarAlternativa,
  editarAlternativa,
  eliminarAlternativa,
  listarReglasCondicionales,
  crearReglaCondicional,
  eliminarReglaCondicional
} from '../controladores/controladorBancoItems.js';

export const enrutadorBancoItems = Router();

enrutadorBancoItems.use(verificarSesion);

enrutadorBancoItems.get('/items', listarItems);
enrutadorBancoItems.post('/items', requierePermiso('configurar_banco_items'), crearItem);
enrutadorBancoItems.put('/items/:id', requierePermiso('configurar_banco_items'), editarItem);
enrutadorBancoItems.put('/items/:id/industrias', requierePermiso('configurar_banco_items'), actualizarIndustriasDelItem);
enrutadorBancoItems.post('/items/:id/alternativas', requierePermiso('configurar_banco_items'), agregarAlternativa);
enrutadorBancoItems.put('/alternativas/:idAlternativa', requierePermiso('configurar_banco_items'), editarAlternativa);
enrutadorBancoItems.delete('/alternativas/:idAlternativa', requierePermiso('configurar_banco_items'), eliminarAlternativa);

enrutadorBancoItems.get('/reglas', listarReglasCondicionales);
enrutadorBancoItems.post('/reglas', requierePermiso('configurar_banco_items'), crearReglaCondicional);
enrutadorBancoItems.delete('/reglas/:id', requierePermiso('configurar_banco_items'), eliminarReglaCondicional);
