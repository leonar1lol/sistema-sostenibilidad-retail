import { consultarBaseDatos } from '../configuracion/baseDatos.js';

export const registrarAuditoria = async ({ idUsuario = null, idEvaluacion = null, accion }) => {
  // accion es VARCHAR(120): se recorta aquí para que ningún mensaje largo pueda
  // hacer fallar la operación que se está auditando (el registro es secundario).
  await consultarBaseDatos(
    `INSERT INTO auditoria (id_usuario, id_evaluacion, accion) VALUES ($1, $2, $3)`,
    [idUsuario, idEvaluacion, accion.slice(0, 120)]
  );
};
