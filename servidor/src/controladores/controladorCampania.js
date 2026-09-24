import crypto from 'crypto';
import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';
import { enviarRecordatorioEvaluacion } from '../servicios/servicioCorreo.js';

let tablasInicializadas = false;

async function inicializarTablasCampania() {
  if (tablasInicializadas) return;
  try {
    await consultarBaseDatos(`
      CREATE TABLE IF NOT EXISTS campania (
        id_campania   SERIAL PRIMARY KEY,
        nombre        VARCHAR(120) NOT NULL,
        periodo       VARCHAR(40) NOT NULL,
        estado        VARCHAR(20) NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador','Publicada','Cerrada')),
        creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE campania ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT now();

      CREATE TABLE IF NOT EXISTS evaluacion (
        id_evaluacion SERIAL PRIMARY KEY,
        id_campania   INT NOT NULL REFERENCES campania(id_campania),
        id_proveedor  INT NOT NULL REFERENCES proveedor(id_proveedor),
        token         VARCHAR(80) NOT NULL UNIQUE,
        estado        VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','En proceso','Finalizado')),
        fecha_envio   TIMESTAMPTZ,
        puntaje_total NUMERIC(5,2),
        UNIQUE (id_campania, id_proveedor)
      );
    `);

    const conteo = await consultarBaseDatos('SELECT COUNT(*) AS total FROM campania');
    if (Number(conteo.rows[0]?.total || 0) === 0) {
      const campaniaNueva = await consultarBaseDatos(`
        INSERT INTO campania (nombre, periodo, estado)
        VALUES ('Homologación Anual de Proveedores ESG 2026', '2026-I', 'Publicada')
        RETURNING id_campania;
      `);
      const idCamp = campaniaNueva.rows[0].id_campania;
      await consultarBaseDatos(`
        INSERT INTO evaluacion (id_campania, id_proveedor, token, estado, puntaje_total)
        SELECT $1, p.id_proveedor, md5(random()::text || clock_timestamp()::text), 'Finalizado', 85.00
        FROM proveedor p
        LIMIT 4
        ON CONFLICT (id_campania, id_proveedor) DO NOTHING;
      `, [idCamp]);
    }
    tablasInicializadas = true;
  } catch (error) {
    console.error('Error al inicializar tablas de campania:', error);
  }
}

export const listarCampanias = async (peticion, respuesta) => {
  try {
    await inicializarTablasCampania();
    const resultado = await consultarBaseDatos(`
      SELECT c.id_campania AS "idCampania", c.nombre, c.periodo, c.estado, c.creado_en AS "creadoEn",
             COUNT(DISTINCT e.id_proveedor) AS "totalProveedores",
             COUNT(DISTINCT p.id_unidad) AS "totalUnidades",
             COALESCE(COUNT(e.id_evaluacion) FILTER (WHERE e.estado = 'Finalizado'), 0) AS "totalFinalizadas"
      FROM campania c
      LEFT JOIN evaluacion e ON e.id_campania = c.id_campania
      LEFT JOIN proveedor p ON p.id_proveedor = e.id_proveedor
      GROUP BY c.id_campania, c.nombre, c.periodo, c.estado, c.creado_en
      ORDER BY c.id_campania DESC
    `);
    return respuesta.status(200).json({ exito: true, campanias: resultado.rows });
  } catch (error) {
    console.error('Error al listar campanias:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar las campañas.' });
  }
};

export const crearCampania = async (peticion, respuesta) => {
  const { nombre, periodo } = peticion.body;
  if (!nombre || !periodo) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Nombre y periodo son obligatorios.' });
  }
  try {
    await inicializarTablasCampania();
    const resultado = await consultarBaseDatos(
      `INSERT INTO campania (nombre, periodo, estado) VALUES ($1, $2, 'Borrador')
       RETURNING id_campania AS "idCampania", nombre, periodo, estado`,
      [nombre, periodo]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la campaña ${nombre}` });
    return respuesta.status(201).json({ exito: true, campania: resultado.rows[0] });
  } catch (error) {
    console.error('Error al crear campania:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la campaña.' });
  }
};

export const cambiarEstadoCampania = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { estado } = peticion.body;

  if (!['Borrador', 'Publicada', 'Cerrada'].includes(estado)) {
    return respuesta.status(400).json({ exito: false, mensaje: "Estado inválido. Debe ser 'Borrador', 'Publicada' o 'Cerrada'." });
  }

  try {
    await inicializarTablasCampania();
    const resultado = await consultarBaseDatos(
      `UPDATE campania SET estado = $1 WHERE id_campania = $2 RETURNING id_campania AS "idCampania", nombre, estado`,
      [estado, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Campaña no encontrada.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Cambió la campaña #${id} a estado ${estado}` });
    return respuesta.status(200).json({ exito: true, campania: resultado.rows[0] });
  } catch (error) {
    console.error('Error al cambiar estado campania:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado de la campaña.' });
  }
};

export const listarEvaluacionesDeCampania = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    await inicializarTablasCampania();
    const esCorporativo = !peticion.usuario.idUnidad;
    const resultado = await consultarBaseDatos(
      `SELECT ev.id_evaluacion AS "idEvaluacion", ev.token, ev.estado, ev.fecha_envio AS "fechaEnvio", ev.puntaje_total AS "puntajeTotal",
              p.id_proveedor AS "idProveedor", p.razon_social AS "razonSocial", p.correo, p.id_unidad AS "idUnidad",
              un.nombre AS unidad
       FROM evaluacion ev
       JOIN proveedor p ON p.id_proveedor = ev.id_proveedor
       LEFT JOIN unidad_negocio un ON un.id_unidad = p.id_unidad
       WHERE ev.id_campania = $1 AND ($2::boolean OR p.id_unidad = $3)
       ORDER BY ev.id_evaluacion ASC`,
      [id, esCorporativo, peticion.usuario.idUnidad]
    );
    return respuesta.status(200).json({ exito: true, evaluaciones: resultado.rows });
  } catch (error) {
    console.error('Error al listar evaluaciones de campania:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar las evaluaciones de la campaña.' });
  }
};

export const asignarEvaluacion = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { idProveedor } = peticion.body;

  if (!idProveedor) {
    return respuesta.status(400).json({ exito: false, mensaje: 'idProveedor es obligatorio.' });
  }

  try {
    await inicializarTablasCampania();
    const proveedor = await consultarBaseDatos(
      'SELECT id_proveedor, razon_social, correo, id_unidad FROM proveedor WHERE id_proveedor = $1',
      [idProveedor]
    );
    if (!proveedor.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado.' });
    }
    if (peticion.usuario.idUnidad && proveedor.rows[0].id_unidad !== peticion.usuario.idUnidad) {
      return respuesta.status(403).json({ exito: false, mensaje: 'No tiene permiso para asignar evaluaciones fuera de su unidad de negocio.' });
    }

    const tokenNuevo = crypto.randomBytes(24).toString('hex');
    const resultado = await consultarBaseDatos(
      `INSERT INTO evaluacion (id_campania, id_proveedor, token, estado)
       VALUES ($1, $2, $3, 'Pendiente')
       ON CONFLICT (id_campania, id_proveedor) DO UPDATE SET id_campania = EXCLUDED.id_campania
       RETURNING id_evaluacion AS "idEvaluacion", token, estado`,
      [id, idProveedor, tokenNuevo]
    );

    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      idEvaluacion: resultado.rows[0].idEvaluacion,
      accion: `Asignó la evaluación de la campaña #${id} al proveedor ${proveedor.rows[0].razon_social}`
    });

    return respuesta.status(201).json({
      exito: true,
      evaluacion: resultado.rows[0],
      enlace: `${process.env.URL_BASE_APP || 'http://localhost:5173'}/?token=${resultado.rows[0].token}`
    });
  } catch (error) {
    console.error('Error al asignar evaluacion:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al asignar la evaluación.' });
  }
};

export const enviarRecordatorio = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.params;
  try {
    await inicializarTablasCampania();
    const resultado = await consultarBaseDatos(
      `SELECT ev.id_evaluacion AS "idEvaluacion", ev.token, p.razon_social AS "razonSocial", p.correo
       FROM evaluacion ev JOIN proveedor p ON p.id_proveedor = ev.id_proveedor
       WHERE ev.id_evaluacion = $1`,
      [idEvaluacion]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada.' });
    }

    const { token, razonSocial, correo } = resultado.rows[0];
    const enlace = `${process.env.URL_BASE_APP || 'http://localhost:5173'}/?token=${token}`;
    await enviarRecordatorioEvaluacion(correo, razonSocial, enlace);

    await consultarBaseDatos('UPDATE evaluacion SET fecha_envio = now() WHERE id_evaluacion = $1', [idEvaluacion]);
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, idEvaluacion, accion: `Envió recordatorio a ${razonSocial}` });

    return respuesta.status(200).json({ exito: true, mensaje: 'Recordatorio enviado.' });
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al enviar el recordatorio.' });
  }
};
