import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const obtenerRegistrosAuditoria = async (peticion, respuesta) => {
  try {
    const consulta = `
      SELECT
        a.id_auditoria AS "idAuditoria",
        COALESCE(u.nombre, 'Sistema') AS usuario,
        a.id_evaluacion AS "idEvaluacion",
        a.accion,
        a.fecha
      FROM auditoria a
      LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
      ORDER BY a.fecha DESC
      LIMIT 200;
    `;
    const resultado = await consultarBaseDatos(consulta);
    return respuesta.status(200).json({ exito: true, registros: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar la bitácora de auditoría.' });
  }
};

export const registrarAccionAuditoria = async (peticion, respuesta) => {
  try {
    const { accion, idEvaluacion } = peticion.body;
    const idUsuario = peticion.usuario ? peticion.usuario.idUsuario : null;
    if (!accion) {
      return respuesta.status(400).json({ exito: false, mensaje: 'La acción es requerida.' });
    }
    await registrarAuditoria({ idUsuario, idEvaluacion: idEvaluacion || null, accion });
    return respuesta.status(201).json({ exito: true, mensaje: 'Acción registrada con éxito.' });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al registrar la acción en la bitácora.' });
  }
};
