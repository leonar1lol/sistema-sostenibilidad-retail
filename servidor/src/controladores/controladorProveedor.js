import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';
import { calcularPuntajeFinalPonderado } from '../servicios/servicioCalificacion.js';

const cargarConfiguracionCriticidad = async () => {
  const pesosFila = await consultarBaseDatos('SELECT * FROM configuracion_pesos ORDER BY id_configuracion ASC LIMIT 1');
  const criticidadFilas = await consultarBaseDatos('SELECT * FROM configuracion_criticidad');
  const p = pesosFila.rows[0];
  return {
    pesos: p && {
      pesoAsg: Number(p.peso_asg), pesoNegocio: Number(p.peso_negocio),
      pesoOrigen: Number(p.peso_origen), pesoParticipacion: Number(p.peso_participacion),
      criticidadLocal: Number(p.criticidad_local), criticidadInternacional: Number(p.criticidad_internacional)
    },
    criticidadPorTipo: criticidadFilas.rows.map((c) => ({
      tipoIndustria: c.tipo_industria,
      criticoAlto: Number(c.critico_alto), criticoMedio: Number(c.critico_medio), criticoBajo: Number(c.critico_bajo),
      participacionAlta: Number(c.participacion_alta), participacionMedia: Number(c.participacion_media), participacionBaja: Number(c.participacion_baja),
      umbralBajo: Number(c.umbral_bajo), umbralMedio: Number(c.umbral_medio)
    }))
  };
};

export const obtenerListaProveedores = async (peticion, respuesta) => {
  try {
    const esCorporativo = !peticion.usuario.idUnidad;
    const incluirInactivos = peticion.query.incluirInactivos === 'true';
    const consulta = `
      SELECT
        p.id_proveedor AS "idProveedor",
        p.ruc,
        p.razon_social AS "razonSocial",
        p.representante,
        p.correo,
        p.nombre_contacto AS "nombreContacto",
        p.celular_contacto AS "celularContacto",
        p.dni_contacto AS "dniContacto",
        p.cargo_contacto AS "cargoContacto",
        p.tipo,
        p.pais,
        p.nivel_criticidad_negocio AS "nivelCriticidadNegocio",
        p.nivel_participacion AS "nivelParticipacion",
        p.tamano_empresa AS "tamanoEmpresa",
        p.activo,
        p.creado_en AS "creadoEn",
        COALESCE(uds.unidades, ARRAY[]::text[]) AS unidades,
        COALESCE(uds.ids_unidad, ARRAY[]::int[]) AS "idsUnidad",
        COALESCE(uds.unidades_criticas, ARRAY[]::text[]) AS "unidadesCriticas",
        COALESCE(uds.detalle, '[]'::json) AS "unidadesDetalle",
        COALESCE(i.nombre, 'Sin asignar') AS industria,
        i.tipo AS "tipoIndustria",
        ev.estado AS "estadoEvaluacion",
        ev.fecha_envio AS "fechaEvaluacion",
        ev.puntaje_total AS "puntajeTotal",
        dim.por_dimension AS "dimensiones"
      FROM proveedor p
      LEFT JOIN industria i ON p.id_industria = i.id_industria
      LEFT JOIN LATERAL (
        SELECT
          array_agg(un.nombre ORDER BY un.nombre) AS unidades,
          array_agg(un.id_unidad ORDER BY un.nombre) AS ids_unidad,
          array_agg(un.nombre ORDER BY un.nombre) FILTER (WHERE pun.es_critico) AS unidades_criticas,
          json_agg(json_build_object('idUnidad', un.id_unidad, 'nombre', un.nombre, 'esCritico', pun.es_critico) ORDER BY un.nombre) AS detalle
        FROM proveedor_unidad_negocio pun
        JOIN unidad_negocio un ON un.id_unidad = pun.id_unidad
        WHERE pun.id_proveedor = p.id_proveedor
      ) uds ON true
      LEFT JOIN LATERAL (
        SELECT id_evaluacion, estado, fecha_envio, puntaje_total
        FROM evaluacion
        WHERE id_proveedor = p.id_proveedor
        ORDER BY id_evaluacion DESC
        LIMIT 1
      ) ev ON true
      LEFT JOIN LATERAL (
        SELECT json_object_agg(d.nombre, pd.valor) AS por_dimension
        FROM puntaje_dimension pd
        JOIN dimension d ON d.id_dimension = pd.id_dimension
        WHERE pd.id_evaluacion = ev.id_evaluacion
      ) dim ON true
      WHERE ($1::boolean OR EXISTS (
        SELECT 1 FROM proveedor_unidad_negocio pun2 WHERE pun2.id_proveedor = p.id_proveedor AND pun2.id_unidad = $2
      )) AND ($3::boolean OR p.activo = TRUE)
      ORDER BY p.id_proveedor ASC;
    `;
    const resultado = await consultarBaseDatos(consulta, [esCorporativo, peticion.usuario.idUnidad, incluirInactivos]);
    const { pesos, criticidadPorTipo } = await cargarConfiguracionCriticidad();

    const proveedoresConRiesgo = resultado.rows.map((p) => {
      const clasificacion = calcularPuntajeFinalPonderado(p.puntajeTotal, p, pesos, criticidadPorTipo);
      return {
        ...p,
        puntajeFinal: clasificacion?.puntajeFinal ?? null,
        nivelRiesgo: clasificacion?.nivelRiesgo ?? null,
        puntajeAsg: clasificacion?.puntajeAsg ?? null,
        puntajeOrigen: clasificacion?.puntajeOrigen ?? null,
        puntajeParticipacion: clasificacion?.puntajeParticipacion ?? null,
        puntajeCriticoNegocio: clasificacion?.puntajeCriticoNegocio ?? null
      };
    });

    return respuesta.status(200).json({
      exito: true,
      proveedores: proveedoresConRiesgo
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar proveedores en base de datos.' });
  }
};

// Normaliza igual que avancesESG (github.com/carlos88ban-afk/avancesESG): mayúsculas,
// sin tildes/puntuación, espacios colapsados. Sirve para detectar el mismo proveedor
// aunque lo escriban con variaciones de formato.
const normalizarNombre = (texto) =>
  (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buscarProveedorDuplicado = async (ruc, razonSocial) => {
  const rucBase = (ruc || '').slice(0, -1);
  const nombreNormalizado = normalizarNombre(razonSocial);
  const candidatos = await consultarBaseDatos(
    `SELECT id_proveedor AS "idProveedor", ruc, razon_social AS "razonSocial"
     FROM proveedor WHERE activo = TRUE AND (ruc = $1 OR LEFT(ruc, 10) = $2)`,
    [ruc, rucBase]
  );
  if (candidatos.rows[0]) {
    return { ...candidatos.rows[0], motivo: candidatos.rows[0].ruc === ruc ? 'el mismo RUC' : 'un RUC casi idéntico (posible error de dígito)' };
  }
  const todos = await consultarBaseDatos(`SELECT id_proveedor AS "idProveedor", ruc, razon_social AS "razonSocial" FROM proveedor WHERE activo = TRUE`);
  const porNombre = todos.rows.find((p) => normalizarNombre(p.razonSocial) === nombreNormalizado);
  return porNombre ? { ...porNombre, motivo: 'el mismo nombre de razón social' } : null;
};

export const incorporarNuevoProveedor = async (peticion, respuesta) => {
  const {
    ruc, razonSocial, representante, correo, tipo, idsUnidad, idIndustria, pais, tamanoEmpresa
  } = peticion.body;

  if (!ruc || !razonSocial || !correo || !Array.isArray(idsUnidad) || idsUnidad.length === 0) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios: debe indicar al menos una unidad de negocio.' });
  }
  if (peticion.usuario.idUnidad && idsUnidad.some((idUnidad) => Number(idUnidad) !== peticion.usuario.idUnidad)) {
    return respuesta.status(403).json({ exito: false, mensaje: 'Solo puede registrar proveedores para su propia unidad de negocio.' });
  }

  try {
    const duplicado = await buscarProveedorDuplicado(ruc, razonSocial);
    if (duplicado) {
      return respuesta.status(409).json({
        exito: false,
        mensaje: `Ya existe un proveedor con ${duplicado.motivo}: ${duplicado.razonSocial} (RUC ${duplicado.ruc}). Edítelo desde el directorio en vez de crear uno nuevo.`
      });
    }

    const idProveedor = await ejecutarTransaccion(async (cliente) => {
      const resultado = await cliente.query(
        `INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, id_industria, pais, tamano_empresa)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Perú'), $8)
         RETURNING id_proveedor`,
        [ruc, razonSocial, representante || null, correo, tipo === 'No retail' ? 'No retail' : 'Retail', idIndustria || null,
          pais || null, tamanoEmpresa || null]
      );
      const nuevoId = resultado.rows[0].id_proveedor;
      for (const idUnidad of idsUnidad) {
        await cliente.query(
          `INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [nuevoId, idUnidad]
        );
      }
      return nuevoId;
    });

    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Incorporó al proveedor ${razonSocial} (RUC ${ruc})` });

    return respuesta.status(201).json({
      exito: true,
      mensaje: 'Proveedor incorporado con éxito en la base de datos.',
      proveedor: { idProveedor, ruc, razonSocial, representante: representante || null, correo, tipo }
    });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe un proveedor con ese RUC.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al insertar proveedor en base de datos.' });
  }
};

// La criticidad se registra por par (proveedor, unidad): un proveedor puede
// ser crítico para SPSA y no para Promart. Solo el admin corporativo la
// registra (no está sujeta al permiso configurable por rol), porque los
// proveedores críticos son la base para medir el avance de cada unidad.
export const alternarCriticidadUnidad = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { idUnidad, esCritico } = peticion.body;

  if (peticion.usuario.idUnidad) {
    return respuesta.status(403).json({ exito: false, mensaje: 'Solo el administrador corporativo puede registrar proveedores críticos.' });
  }
  if (!idUnidad) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Debe indicar la unidad de negocio.' });
  }

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE proveedor_unidad_negocio SET es_critico = $1
       WHERE id_proveedor = $2 AND id_unidad = $3
       RETURNING id_proveedor AS "idProveedor", id_unidad AS "idUnidad", es_critico AS "esCritico"`,
      [!!esCritico, id, idUnidad]
    );

    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'El proveedor no está registrado para esa unidad de negocio.' });
    }

    const datosProveedor = await consultarBaseDatos(
      `SELECT p.razon_social AS "razonSocial", un.nombre AS "nombreUnidad"
       FROM proveedor p, unidad_negocio un
       WHERE p.id_proveedor = $1 AND un.id_unidad = $2`,
      [id, idUnidad]
    );
    const { razonSocial, nombreUnidad } = datosProveedor.rows[0] || {};

    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${esCritico ? 'Marcó' : 'Desmarcó'} como crítico a ${razonSocial} para ${nombreUnidad}`
    });

    return respuesta.status(200).json({ exito: true, criticidad: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar la condición crítica del proveedor.' });
  }
};

export const obtenerDatosMaestros = async (peticion, respuesta) => {
  try {
    const resIndustrias = await consultarBaseDatos('SELECT id_industria, codigo, nombre FROM industria WHERE activo = TRUE ORDER BY id_industria ASC;');
    const resUnidades = await consultarBaseDatos('SELECT id_unidad, nombre, gerente FROM unidad_negocio WHERE activo = TRUE ORDER BY id_unidad ASC;');

    return respuesta.status(200).json({
      exito: true,
      industrias: resIndustrias.rows,
      unidadesNegocio: resUnidades.rows
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar datos maestros.' });
  }
};

export const cambiarEstadoProveedor = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { activo } = peticion.body;
  const esCorporativo = !peticion.usuario.idUnidad;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE proveedor SET activo = $1
       WHERE id_proveedor = $2 AND ($3::boolean OR EXISTS (
         SELECT 1 FROM proveedor_unidad_negocio pun WHERE pun.id_proveedor = proveedor.id_proveedor AND pun.id_unidad = $4
       ))
       RETURNING id_proveedor AS "idProveedor", razon_social AS "razonSocial", activo`,
      [!!activo, id, esCorporativo, peticion.usuario.idUnidad]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado o fuera de su unidad de negocio.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${activo ? 'Reactivó' : 'Dio de baja a'} el proveedor ${resultado.rows[0].razonSocial}`
    });
    return respuesta.status(200).json({ exito: true, proveedor: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado del proveedor.' });
  }
};

export const actualizarClasificacionRiesgo = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nivelCriticidadNegocio, nivelParticipacion, pais, tamanoEmpresa } = peticion.body;
  const esCorporativo = !peticion.usuario.idUnidad;

  const nivelesValidosNegocio = ['Alto', 'Medio', 'Bajo'];
  const nivelesValidosParticipacion = ['Alta', 'Media', 'Baja'];
  if (nivelCriticidadNegocio && !nivelesValidosNegocio.includes(nivelCriticidadNegocio)) {
    return respuesta.status(400).json({ exito: false, mensaje: "nivelCriticidadNegocio debe ser 'Alto', 'Medio' o 'Bajo'." });
  }
  if (nivelParticipacion && !nivelesValidosParticipacion.includes(nivelParticipacion)) {
    return respuesta.status(400).json({ exito: false, mensaje: "nivelParticipacion debe ser 'Alta', 'Media' o 'Baja'." });
  }

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE proveedor SET
         nivel_criticidad_negocio = COALESCE($1, nivel_criticidad_negocio),
         nivel_participacion = COALESCE($2, nivel_participacion),
         pais = COALESCE($3, pais),
         tamano_empresa = COALESCE($4, tamano_empresa)
       WHERE id_proveedor = $5 AND ($6::boolean OR EXISTS (
         SELECT 1 FROM proveedor_unidad_negocio pun WHERE pun.id_proveedor = proveedor.id_proveedor AND pun.id_unidad = $7
       ))
       RETURNING id_proveedor AS "idProveedor", razon_social AS "razonSocial",
                 nivel_criticidad_negocio AS "nivelCriticidadNegocio",
                 nivel_participacion AS "nivelParticipacion", pais, tamano_empresa AS "tamanoEmpresa"`,
      [nivelCriticidadNegocio || null, nivelParticipacion || null, pais || null, tamanoEmpresa || null, id, esCorporativo, peticion.usuario.idUnidad]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Proveedor no encontrado o fuera de su unidad de negocio.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `Actualizó la clasificación de riesgo del proveedor ${resultado.rows[0].razonSocial}`
    });
    return respuesta.status(200).json({ exito: true, proveedor: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar la clasificación de riesgo.' });
  }
};
