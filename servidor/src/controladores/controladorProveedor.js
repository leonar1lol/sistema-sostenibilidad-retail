import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const obtenerListaProveedores = async (peticion, respuesta) => {
  try {
    const esCorporativo = !peticion.usuario.idUnidad;
    const consulta = `
      SELECT
        p.id_proveedor AS "idProveedor",
        COALESCE(p.id_unidad, (SELECT pun.id_unidad FROM proveedor_unidad_negocio pun WHERE pun.id_proveedor = p.id_proveedor LIMIT 1), 1) AS "idUnidad",
        p.ruc,
        p.razon_social AS "razonSocial",
        p.nombre_comercial AS "nombreComercial",
        p.direccion_fiscal AS "direccionFiscal",
        p.departamento,
        p.representante,
        p.cargo_representante AS "cargoRepresentante",
        p.telefono,
        p.correo,
        p.tipo,
        p.tamano_empresa AS "tamanoEmpresa",
        p.anios_operacion AS "aniosOperacion",
        p.sitio_web AS "sitioWeb",
        p.creado_en AS "creadoEn",
        COALESCE(uni.nombres, 'Sin asignar') AS unidad,
        COALESCE(uni.lista, '[]'::json) AS "unidades",
        COALESCE(crit.lista, '[]'::json) AS "unidadesCriticas",
        COALESCE(crit.total, 0) > 0 AS "esCritico",
        COALESCE(i.nombre, 'Sin asignar') AS industria,
        ev.estado AS "estadoEvaluacion",
        ev.fecha_envio AS "fechaEvaluacion",
        ev.puntaje_total AS "puntajeTotal",
        dim.por_dimension AS "dimensiones"
      FROM proveedor p
      LEFT JOIN industria i ON p.id_industria = i.id_industria
      LEFT JOIN LATERAL (
        SELECT
          string_agg(un.nombre, ', ' ORDER BY un.nombre) AS nombres,
          json_agg(json_build_object('idUnidad', un.id_unidad, 'nombre', un.nombre) ORDER BY un.nombre) AS lista
        FROM proveedor_unidad_negocio pun
        JOIN unidad_negocio un ON un.id_unidad = pun.id_unidad
        WHERE pun.id_proveedor = p.id_proveedor
      ) uni ON true
      LEFT JOIN LATERAL (
        SELECT
          count(*) AS total,
          json_agg(json_build_object('idUnidad', un.id_unidad, 'nombre', un.nombre) ORDER BY un.nombre) AS lista
        FROM proveedor_unidad_negocio pun
        JOIN unidad_negocio un ON un.id_unidad = pun.id_unidad
        WHERE pun.id_proveedor = p.id_proveedor AND pun.es_critico = true
      ) crit ON true
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
      WHERE $1::boolean OR EXISTS (
        SELECT 1 FROM proveedor_unidad_negocio x WHERE x.id_proveedor = p.id_proveedor AND x.id_unidad = $2
      )
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
  const { ruc, razonSocial, representante, correo, tipo, idIndustria } = peticion.body;
  const idsUnidad = Array.isArray(peticion.body.idsUnidad) ? peticion.body.idsUnidad.map(Number) : [];
  const idsUnidadesCriticas = Array.isArray(peticion.body.idsUnidadesCriticas) ? peticion.body.idsUnidadesCriticas.map(Number) : [];

  if (!ruc || !razonSocial || !correo || idsUnidad.length === 0) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios: debe seleccionar al menos una unidad de negocio.' });
  }

  try {
    const proveedorCreado = await ejecutarTransaccion(async (cliente) => {
      const resultado = await cliente.query(
        `INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, id_unidad, id_industria)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_proveedor AS "idProveedor", ruc, razon_social AS "razonSocial", representante, correo, tipo;`,
        [ruc, razonSocial, representante || null, correo, tipo === 'No retail' ? 'No retail' : 'Retail', idsUnidad[0], idIndustria || null]
      );
      const proveedor = resultado.rows[0];

      for (const idUnidad of idsUnidad) {
        await cliente.query(
          `INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad, es_critico) VALUES ($1, $2, $3)`,
          [proveedor.idProveedor, idUnidad, idsUnidadesCriticas.includes(idUnidad)]
        );
      }

      await registrarAuditoria({
        idUsuario: peticion.usuario.idUsuario,
        accion: `Incorporó al proveedor ${razonSocial} (RUC ${ruc})`,
        cliente
      });

      return { ...proveedor, esCritico: idsUnidadesCriticas.length > 0 };
    });

    return respuesta.status(201).json({
      exito: true,
      mensaje: 'Proveedor incorporado con éxito en la base de datos.',
      proveedor: proveedorCreado
    });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe un proveedor con ese RUC.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al insertar proveedor en base de datos.' });
  }
};

export const actualizarUnidadesProveedor = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const esCorporativo = !peticion.usuario.idUnidad;
  const idsUnidadesCriticas = Array.isArray(peticion.body.idsUnidadesCriticas) ? peticion.body.idsUnidadesCriticas.map(Number) : [];
  const idsUnidad = Array.isArray(peticion.body.idsUnidad) ? peticion.body.idsUnidad.map(Number) : null;

  if (esCorporativo && (!idsUnidad || idsUnidad.length === 0)) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Debe seleccionar al menos una unidad de negocio.' });
  }

  try {
    const proveedorFila = await consultarBaseDatos(
      'SELECT id_proveedor AS "idProveedor", razon_social AS "razonSocial" FROM proveedor WHERE id_proveedor = $1',
      [id]
    );
    if (!proveedorFila.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado.' });
    }
    const { razonSocial } = proveedorFila.rows[0];

    await ejecutarTransaccion(async (cliente) => {
      if (esCorporativo) {
        await cliente.query('DELETE FROM proveedor_unidad_negocio WHERE id_proveedor = $1', [id]);
        for (const idUnidad of idsUnidad) {
          await cliente.query(
            `INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad, es_critico) VALUES ($1, $2, $3)`,
            [id, idUnidad, idsUnidadesCriticas.includes(idUnidad)]
          );
        }
      } else {
        const idUnidadPropia = peticion.usuario.idUnidad;
        await cliente.query(
          `INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad, es_critico)
           VALUES ($1, $2, $3)
           ON CONFLICT (id_proveedor, id_unidad) DO UPDATE SET es_critico = EXCLUDED.es_critico`,
          [id, idUnidadPropia, idsUnidadesCriticas.includes(idUnidadPropia)]
        );
      }

      await registrarAuditoria({
        idUsuario: peticion.usuario.idUsuario,
        accion: `Actualizó las unidades de negocio y criticidad del proveedor ${razonSocial}`,
        cliente
      });
    });

    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar las unidades del proveedor.' });
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
