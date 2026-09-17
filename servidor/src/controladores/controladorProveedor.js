import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const obtenerListaProveedores = async (peticion, respuesta) => {
  try {
    const esCorporativo = !peticion.usuario.idUnidad;
    const consulta = `
      SELECT
        p.id_proveedor AS "idProveedor",
        p.ruc,
        p.razon_social AS "razonSocial",
        p.representante,
        p.correo,
        p.tipo,
        p.es_critico AS "esCritico",
        p.creado_en AS "creadoEn",
        COALESCE(u.nombre, 'Sin asignar') AS unidad,
        u.id_unidad AS "idUnidad",
        COALESCE(i.nombre, 'Sin asignar') AS industria,
        ev.estado AS "estadoEvaluacion",
        ev.fecha_envio AS "fechaEvaluacion",
        ev.puntaje_total AS "puntajeTotal",
        dim.por_dimension AS "dimensiones"
      FROM proveedor p
      LEFT JOIN unidad_negocio u ON p.id_unidad = u.id_unidad
      LEFT JOIN industria i ON p.id_industria = i.id_industria
      LEFT JOIN LATERAL (
        SELECT id_evaluacion, estado, fecha_envio, puntaje_total
        FROM evaluacion
        WHERE id_proveedor = p.id_proveedor
        ORDER BY id_evaluacion DESC
        LIMIT 1
      ) ev ON true
      LEFT JOIN LATERAL (
        SELECT json_object_agg(d.codigo, pd.valor) AS por_dimension
        FROM puntaje_dimension pd
        JOIN dimension d ON d.id_dimension = pd.id_dimension
        WHERE pd.id_evaluacion = ev.id_evaluacion
      ) dim ON true
      WHERE $1::boolean OR p.id_unidad = $2
      ORDER BY p.id_proveedor ASC;
    `;
    const resultado = await consultarBaseDatos(consulta, [esCorporativo, peticion.usuario.idUnidad]);
    return respuesta.status(200).json({
      exito: true,
      proveedores: resultado.rows
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar proveedores en base de datos.' });
  }
};

export const incorporarNuevoProveedor = async (peticion, respuesta) => {
  const { ruc, razonSocial, representante, correo, tipo, idUnidad, idIndustria } = peticion.body;

  if (!ruc || !razonSocial || !correo || !idUnidad) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios para el registro.' });
  }

  try {
    const consulta = `
      INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, id_unidad, id_industria)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_proveedor AS "idProveedor", ruc, razon_social AS "razonSocial", representante, correo, tipo, es_critico AS "esCritico";
    `;
    const valores = [ruc, razonSocial, representante || null, correo, tipo === 'No retail' ? 'No retail' : 'Retail', idUnidad, idIndustria || null];
    const resultado = await consultarBaseDatos(consulta, valores);

    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Incorporó al proveedor ${razonSocial} (RUC ${ruc})` });

    return respuesta.status(201).json({
      exito: true,
      mensaje: 'Proveedor incorporado con éxito en la base de datos.',
      proveedor: resultado.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe un proveedor con ese RUC.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al insertar proveedor en base de datos.' });
  }
};

export const alternarProveedorCritico = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { esCritico } = peticion.body;

  try {
    const esCorporativo = !peticion.usuario.idUnidad;
    const consulta = `
      UPDATE proveedor SET es_critico = $1
      WHERE id_proveedor = $2 AND ($3::boolean OR id_unidad = $4)
      RETURNING id_proveedor AS "idProveedor", razon_social AS "razonSocial", es_critico AS "esCritico";
    `;
    const resultado = await consultarBaseDatos(consulta, [!!esCritico, id, esCorporativo, peticion.usuario.idUnidad]);

    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado o fuera de su unidad de negocio.' });
    }

    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${esCritico ? 'Marcó' : 'Desmarcó'} como crítico al proveedor ${resultado.rows[0].razonSocial}`
    });

    return respuesta.status(200).json({ exito: true, proveedor: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar la condición crítica del proveedor.' });
  }
};

export const obtenerDatosMaestros = async (peticion, respuesta) => {
  try {
    const resIndustrias = await consultarBaseDatos('SELECT id_industria, codigo, nombre FROM industria ORDER BY id_industria ASC;');
    const resUnidades = await consultarBaseDatos('SELECT id_unidad, nombre, gerente FROM unidad_negocio ORDER BY id_unidad ASC;');

    return respuesta.status(200).json({
      exito: true,
      industrias: resIndustrias.rows,
      unidadesNegocio: resUnidades.rows
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar datos maestros.' });
  }
};
