import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';
import { enviarRecordatorioEvaluacion } from '../servicios/servicioCorreo.js';

export const listarCampanias = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(`
      SELECT c.id_campania AS "idCampania", c.nombre, c.periodo, c.estado, c.creado_en AS "creadoEn",
             COUNT(DISTINCT e.id_proveedor) AS "totalProveedores",
             COUNT(DISTINCT pun.id_unidad) AS "totalUnidades",
             COUNT(*) FILTER (WHERE e.estado = 'Finalizado') AS "totalFinalizadas"
      FROM campania c
      LEFT JOIN evaluacion e ON e.id_campania = c.id_campania
      LEFT JOIN proveedor_unidad_negocio pun ON pun.id_proveedor = e.id_proveedor
      GROUP BY c.id_campania
      ORDER BY c.id_campania DESC
    `);
    return respuesta.status(200).json({ exito: true, campanias: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar las campañas.' });
  }
};

export const crearCampania = async (peticion, respuesta) => {
  const { nombre, periodo } = peticion.body;
  if (!nombre || !periodo) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Nombre y periodo son obligatorios.' });
  }
  try {
    const resultado = await consultarBaseDatos(
      `INSERT INTO campania (nombre, periodo, estado) VALUES ($1, $2, 'Borrador')
       RETURNING id_campania AS "idCampania", nombre, periodo, estado`,
      [nombre, periodo]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la campaña ${nombre}` });
    return respuesta.status(201).json({ exito: true, campania: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la campaña.' });
  }
};

// Intercorp Retail lanza una sola campaña al año y su recolección dura ~6 meses:
// nunca conviven dos campañas publicadas. Al publicar una, cualquier otra que
// estuviera publicada pasa automáticamente a Cerrada, para que nunca haya
// ambigüedad sobre a cuál se asocian los proveedores que se autoregistran.
export const cambiarEstadoCampania = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { estado } = peticion.body;

  if (!['Borrador', 'Publicada', 'Cerrada'].includes(estado)) {
    return respuesta.status(400).json({ exito: false, mensaje: "Estado inválido. Debe ser 'Borrador', 'Publicada' o 'Cerrada'." });
  }

  try {
    const campania = await ejecutarTransaccion(async (cliente) => {
      if (estado === 'Publicada') {
        await cliente.query(
          `UPDATE campania SET estado = 'Cerrada' WHERE estado = 'Publicada' AND id_campania != $1`,
          [id]
        );
      }
      const resultado = await cliente.query(
        `UPDATE campania SET estado = $1 WHERE id_campania = $2 RETURNING id_campania AS "idCampania", nombre, estado`,
        [estado, id]
      );
      return resultado.rows[0];
    });

    if (!campania) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: estado === 'Publicada'
        ? `Publicó la campaña ${campania.nombre} (cerró cualquier otra campaña publicada)`
        : `Cambió la campaña ${campania.nombre} a estado ${estado}`
    });
    return respuesta.status(200).json({ exito: true, campania });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado de la campaña.' });
  }
};

// Solo se permite eliminar campañas sin evaluaciones asociadas (p. ej. campañas
// de prueba creadas por error). Una campaña con datos reales debe cerrarse, no
// borrarse, para no perder el historial de evaluaciones.
export const eliminarCampania = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    const conEvaluaciones = await consultarBaseDatos('SELECT 1 FROM evaluacion WHERE id_campania = $1 LIMIT 1', [id]);
    if (conEvaluaciones.rows.length > 0) {
      return respuesta.status(409).json({
        exito: false,
        mensaje: 'Esta campaña ya tiene evaluaciones asociadas y no puede eliminarse. Ciérrela en su lugar para conservar el historial.'
      });
    }
    const resultado = await consultarBaseDatos(
      'DELETE FROM campania WHERE id_campania = $1 RETURNING id_campania AS "idCampania", nombre',
      [id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Eliminó la campaña ${resultado.rows[0].nombre}` });
    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al eliminar la campaña.' });
  }
};

export const listarEvaluacionesDeCampania = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    const esCorporativo = !peticion.usuario.idUnidad;
    const resultado = await consultarBaseDatos(
      `SELECT ev.id_evaluacion AS "idEvaluacion", ev.token, ev.estado, ev.fecha_envio AS "fechaEnvio", ev.puntaje_total AS "puntajeTotal",
              p.id_proveedor AS "idProveedor", p.razon_social AS "razonSocial", p.correo,
              COALESCE(uds.unidades, 'Sin asignar') AS unidad
       FROM evaluacion ev
       JOIN proveedor p ON p.id_proveedor = ev.id_proveedor
       LEFT JOIN LATERAL (
         SELECT string_agg(un.nombre, ', ' ORDER BY un.nombre) AS unidades
         FROM proveedor_unidad_negocio pun JOIN unidad_negocio un ON un.id_unidad = pun.id_unidad
         WHERE pun.id_proveedor = p.id_proveedor
       ) uds ON true
       WHERE ev.id_campania = $1 AND ($2::boolean OR EXISTS (
         SELECT 1 FROM proveedor_unidad_negocio pun2 WHERE pun2.id_proveedor = p.id_proveedor AND pun2.id_unidad = $3
       ))
       ORDER BY ev.id_evaluacion ASC`,
      [id, esCorporativo, peticion.usuario.idUnidad]
    );
    return respuesta.status(200).json({ exito: true, evaluaciones: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar las evaluaciones de la campaña.' });
  }
};

export const enviarRecordatorio = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.params;
  const esCorporativo = !peticion.usuario.idUnidad;
  try {
    const resultado = await consultarBaseDatos(
      `SELECT ev.id_evaluacion AS "idEvaluacion", ev.token, ev.estado, p.razon_social AS "razonSocial", p.correo
       FROM evaluacion ev JOIN proveedor p ON p.id_proveedor = ev.id_proveedor
       WHERE ev.id_evaluacion = $1 AND ($2::boolean OR EXISTS (
         SELECT 1 FROM proveedor_unidad_negocio pun WHERE pun.id_proveedor = p.id_proveedor AND pun.id_unidad = $3
       ))`,
      [idEvaluacion, esCorporativo, peticion.usuario.idUnidad]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada o fuera de su unidad de negocio.' });
    }
    if (resultado.rows[0].estado === 'Finalizado') {
      return respuesta.status(400).json({ exito: false, mensaje: 'Este proveedor ya finalizó su evaluación; no corresponde enviarle un recordatorio.' });
    }

    const { token, razonSocial, correo } = resultado.rows[0];
    const enlace = `${process.env.URL_BASE_APP}/?token=${token}`;
    await enviarRecordatorioEvaluacion(correo, razonSocial, enlace);

    await consultarBaseDatos('UPDATE evaluacion SET fecha_envio = now() WHERE id_evaluacion = $1', [idEvaluacion]);
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, idEvaluacion, accion: `Envió recordatorio a ${razonSocial}` });

    return respuesta.status(200).json({ exito: true, mensaje: 'Recordatorio enviado.' });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al enviar el recordatorio.' });
  }
};
