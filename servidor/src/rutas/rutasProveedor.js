import { Router } from 'express';
import { verificarSesion, requierePermiso } from '../middleware/autenticacion.js';
import {
  obtenerDatosMaestros,
  obtenerListaProveedores,
  incorporarNuevoProveedor,
  actualizarUnidadesProveedor,
  editarRazonSocial,
  eliminarProveedoresMasivo
} from '../controladores/controladorProveedor.js';
import { listarEvidenciaProveedorAdmin } from '../controladores/controladorEvidencia.js';
import {
  subidaExcelMulter,
  descargarPlantillaCargaMasiva,
  cargaMasivaProveedores
} from '../controladores/controladorCargaMasivaProveedores.js';

export const enrutadorProveedor = Router();

enrutadorProveedor.get('/datos-maestros', obtenerDatosMaestros);

enrutadorProveedor.get('/', verificarSesion, obtenerListaProveedores);
enrutadorProveedor.post('/', verificarSesion, requierePermiso('marcar_critico'), incorporarNuevoProveedor);
enrutadorProveedor.put('/:id/unidades', verificarSesion, requierePermiso('marcar_critico'), actualizarUnidadesProveedor);
enrutadorProveedor.put('/:id/razon-social', verificarSesion, requierePermiso('actualizar_razon_social'), editarRazonSocial);
enrutadorProveedor.get('/:idProveedor/evidencia', verificarSesion, listarEvidenciaProveedorAdmin);

enrutadorProveedor.get('/carga-masiva/plantilla', verificarSesion, requierePermiso('marcar_critico'), descargarPlantillaCargaMasiva);
enrutadorProveedor.post('/carga-masiva', verificarSesion, requierePermiso('marcar_critico'), (peticion, respuesta, siguiente) => {
  subidaExcelMulter(peticion, respuesta, (errorMulter) => {
    if (errorMulter) {
      const mensaje = errorMulter.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido (8 MB).'
        : 'Adjunte un archivo .xlsx válido.';
      return respuesta.status(400).json({ exito: false, mensaje });
    }
    siguiente();
  });
}, cargaMasivaProveedores);
enrutadorProveedor.post('/eliminar-masivo', verificarSesion, requierePermiso('marcar_critico'), eliminarProveedoresMasivo);
