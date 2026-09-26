import { consultarBaseDatos } from '../configuracion/baseDatos.js';

export const registrarAuditoria = async ({ idUsuario = null, idEvaluacion = null, accion, cliente = null }) => {
  if (!accion || typeof accion !== 'string' || accion.trim() === '') {
    throw new Error('La acción de auditoría es obligatoria.');
  }
  const accionSanitizada = accion.trim().slice(0, 120);
  const consulta = `INSERT INTO auditoria (id_usuario, id_evaluacion, accion) VALUES ($1, $2, $3)`;
  const parametros = [idUsuario, idEvaluacion, accionSanitizada];

  if (cliente) {
    await cliente.query(consulta, parametros);
  } else {
    await consultarBaseDatos(consulta, parametros);
  }
};
