import { consultarBaseDatos } from '../configuracion/baseDatos.js';

export const registrarAuditoria = async ({ idUsuario = null, idEvaluacion = null, accion }) => {
  await consultarBaseDatos(
    `INSERT INTO auditoria (id_usuario, id_evaluacion, accion) VALUES ($1, $2, $3)`,
    [idUsuario, idEvaluacion, accion]
  );
};
