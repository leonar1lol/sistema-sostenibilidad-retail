import crypto from 'crypto';
import multer from 'multer';
import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { servicioR2 } from '../servicios/servicioR2.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const subidaMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: (peticion, archivo, callback) => {
    callback(null, TIPOS_PERMITIDOS.includes(archivo.mimetype));
  }
}).single('archivo');

export const subirEvidenciaPortal = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  const { idItem } = peticion.params;

  if (!peticion.file) {
    return respuesta.status(400).json({
      exito: false,
      mensaje: 'Adjunte un archivo PDF, JPG o PNG de máximo 5 MB.'
    });
  }

  try {
    const respuestaFila = await consultarBaseDatos(
      'SELECT id_respuesta AS "idRespuesta" FROM respuesta WHERE id_evaluacion = $1 AND id_item = $2',
      [idEvaluacion, idItem]
    );
    if (!respuestaFila.rows[0]) {
      return respuesta.status(400).json({ exito: false, mensaje: 'Responda el ítem antes de adjuntar evidencia.' });
    }
    const idRespuesta = respuestaFila.rows[0].idRespuesta;

    const claveR2 = `evidencias/${idEvaluacion}/${idRespuesta}/${crypto.randomUUID()}-${peticion.file.originalname}`;
    await servicioR2.subirArchivoR2(claveR2, peticion.file.buffer, peticion.file.mimetype);

    let evidenciaInsertada;
    try {
      evidenciaInsertada = await ejecutarTransaccion(async (cliente) => {
        const resultado = await cliente.query(
          `INSERT INTO evidencia (id_respuesta, nombre_archivo, clave_r2, tipo_mime, tamano_bytes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id_evidencia AS "idEvidencia", nombre_archivo AS "nombreArchivo", tipo_mime AS "tipoMime", tamano_bytes AS "tamanoBytes", subido_en AS "subidoEn"`,
          [idRespuesta, peticion.file.originalname, claveR2, peticion.file.mimetype, peticion.file.size]
        );

        await registrarAuditoria({
          idEvaluacion,
          accion: `Adjuntó evidencia al ítem #${idItem}`,
          cliente
        });

        return resultado.rows[0];
      });
    } catch (errorTransaccion) {
      try {
        await servicioR2.eliminarArchivoR2(claveR2);
      } catch (errorCompensacion) {
        console.error('Error al compensar archivo en R2:', errorCompensacion);
      }
      throw errorTransaccion;
    }

    return respuesta.status(201).json({ exito: true, evidencia: evidenciaInsertada });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al subir la evidencia.' });
  }
};

export const listarEvidenciaItemPortal = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  const { idItem } = peticion.params;

  try {
    const evidencias = await consultarBaseDatos(
      `SELECT e.id_evidencia AS "idEvidencia", e.nombre_archivo AS "nombreArchivo", e.tipo_mime AS "tipoMime", e.tamano_bytes AS "tamanoBytes", e.subido_en AS "subidoEn"
       FROM evidencia e
       JOIN respuesta r ON r.id_respuesta = e.id_respuesta
       WHERE r.id_evaluacion = $1 AND r.id_item = $2
       ORDER BY e.id_evidencia ASC`,
      [idEvaluacion, idItem]
    );
    return respuesta.status(200).json({ exito: true, evidencias: evidencias.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar la evidencia.' });
  }
};

export const eliminarEvidenciaPortal = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  const { idEvidencia } = peticion.params;

  try {
    const fila = await consultarBaseDatos(
      `SELECT e.id_evidencia AS "idEvidencia", e.clave_r2 AS "claveR2", r.id_item AS "idItem"
       FROM evidencia e
       JOIN respuesta r ON r.id_respuesta = e.id_respuesta
       WHERE e.id_evidencia = $1 AND r.id_evaluacion = $2`,
      [idEvidencia, idEvaluacion]
    );
    if (!fila.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Evidencia no encontrada.' });
    }

    await ejecutarTransaccion(async (cliente) => {
      await cliente.query('DELETE FROM evidencia WHERE id_evidencia = $1', [idEvidencia]);
      await registrarAuditoria({
        idEvaluacion,
        accion: `Eliminó evidencia del ítem #${fila.rows[0].idItem}`,
        cliente
      });
    });

    try {
      await servicioR2.eliminarArchivoR2(fila.rows[0].claveR2);
    } catch (errorR2) {
      console.error('Error al eliminar archivo en R2 tras confirmacion:', errorR2);
    }

    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al eliminar la evidencia.' });
  }
};

export const listarEvidenciaProveedorAdmin = async (peticion, respuesta) => {
  const { idProveedor } = peticion.params;
  const esCorporativo = !peticion.usuario.idUnidad;

  try {
    const proveedor = await consultarBaseDatos(
      'SELECT id_proveedor FROM proveedor WHERE id_proveedor = $1 AND ($2::boolean OR id_unidad = $3)',
      [idProveedor, esCorporativo, peticion.usuario.idUnidad]
    );
    if (!proveedor.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado o fuera de su unidad de negocio.' });
    }

    const evidencias = await consultarBaseDatos(
      `SELECT e.id_evidencia AS "idEvidencia", e.nombre_archivo AS "nombreArchivo", e.tipo_mime AS "tipoMime",
              e.tamano_bytes AS "tamanoBytes", e.subido_en AS "subidoEn", e.clave_r2 AS "claveR2", i.codigo AS "codigoItem"
       FROM evidencia e
       JOIN respuesta r ON r.id_respuesta = e.id_respuesta
       JOIN item i ON i.id_item = r.id_item
       JOIN evaluacion ev ON ev.id_evaluacion = r.id_evaluacion
       WHERE ev.id_proveedor = $1
       ORDER BY ev.id_evaluacion DESC, e.id_evidencia ASC`,
      [idProveedor]
    );

    const conUrl = await Promise.all(evidencias.rows.map(async ({ claveR2, ...fila }) => ({
      ...fila,
      urlDescarga: await servicioR2.generarUrlDescargaR2(claveR2, fila.nombreArchivo)
    })));

    return respuesta.status(200).json({ exito: true, evidencias: conUrl });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar la evidencia del proveedor.' });
  }
};
