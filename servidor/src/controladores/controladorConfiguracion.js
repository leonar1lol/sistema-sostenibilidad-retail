import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

const generarCodigoBase = (nombre) => {
  const limpio = nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  const palabras = limpio.split(/\s+/).filter(Boolean);
  const base = palabras.length > 1
    ? palabras.map((p) => p[0]).join('').slice(0, 8)
    : (palabras[0] || 'GEN').slice(0, 6);
  return base || 'GEN';
};

// Los catálogos (unidad_negocio, industria, dimension) exigen un código corto
// único a nivel de base de datos, pero es solo un identificador interno: el
// admin ya no lo escribe ni lo ve. Se deriva del nombre y se numera ante
// colisión (ej. "Servicios Generales" -> "SG", luego "SG2"...).
// ponytail: reintento simple sin lock, aceptable para creación de catálogo
// de baja concurrencia; con alta concurrencia usar una secuencia dedicada.
const insertarConCodigoUnico = async (nombre, insertar) => {
  const base = generarCodigoBase(nombre);
  let candidato = base;
  for (let intento = 1; intento <= 20; intento += 1) {
    try {
      return await insertar(candidato);
    } catch (error) {
      if (error.code !== '23505' || intento === 20) throw error;
      candidato = `${base.slice(0, 10 - String(intento + 1).length)}${intento + 1}`;
    }
  }
};

export const listarUnidadesNegocio = async (peticion, respuesta) => {
  try {
    const incluirInactivas = peticion.query.incluirInactivos === 'true';
    const resultado = await consultarBaseDatos(
      `SELECT id_unidad AS "idUnidad", codigo, nombre, gerente, requiere_documento AS "requiereDocumento", activo
       FROM unidad_negocio WHERE $1::boolean OR activo = TRUE ORDER BY id_unidad ASC`,
      [incluirInactivas]
    );
    return respuesta.status(200).json({ exito: true, unidades: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar unidades de negocio.' });
  }
};

export const crearUnidadNegocio = async (peticion, respuesta) => {
  const { nombre, gerente, requiereDocumento } = peticion.body;
  if (!nombre) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio.' });
  }
  try {
    const unidad = await insertarConCodigoUnico(nombre, async (codigo) => {
      const resultado = await consultarBaseDatos(
        `INSERT INTO unidad_negocio (codigo, nombre, gerente, requiere_documento) VALUES ($1, $2, $3, $4)
         RETURNING id_unidad AS "idUnidad", codigo, nombre, gerente, requiere_documento AS "requiereDocumento"`,
        [codigo, nombre, gerente || null, !!requiereDocumento]
      );
      return resultado.rows[0];
    });
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la unidad de negocio ${nombre}` });
    return respuesta.status(201).json({ exito: true, unidad });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la unidad de negocio.' });
  }
};

export const editarUnidadNegocio = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre, gerente, requiereDocumento } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE unidad_negocio SET nombre = COALESCE($1, nombre), gerente = COALESCE($2, gerente),
              requiere_documento = COALESCE($3, requiere_documento)
       WHERE id_unidad = $4
       RETURNING id_unidad AS "idUnidad", codigo, nombre, gerente, requiere_documento AS "requiereDocumento"`,
      [nombre || null, gerente || null, requiereDocumento === undefined ? null : !!requiereDocumento, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Unidad de negocio no encontrada.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Editó la unidad de negocio #${id}` });
    return respuesta.status(200).json({ exito: true, unidad: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar la unidad de negocio.' });
  }
};

export const cambiarEstadoUnidadNegocio = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { activo } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE unidad_negocio SET activo = $1 WHERE id_unidad = $2 RETURNING id_unidad AS "idUnidad", nombre, activo`,
      [!!activo, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Unidad de negocio no encontrada.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${activo ? 'Reactivó' : 'Dio de baja a'} la unidad de negocio ${resultado.rows[0].nombre}`
    });
    return respuesta.status(200).json({ exito: true, unidad: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado de la unidad de negocio.' });
  }
};

export const listarIndustrias = async (peticion, respuesta) => {
  try {
    const incluirInactivas = peticion.query.incluirInactivos === 'true';
    const resultado = await consultarBaseDatos(
      `SELECT id_industria AS "idIndustria", codigo, nombre, tipo, activo
       FROM industria WHERE $1::boolean OR activo = TRUE ORDER BY id_industria ASC`,
      [incluirInactivas]
    );
    return respuesta.status(200).json({ exito: true, industrias: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar industrias.' });
  }
};

export const crearIndustria = async (peticion, respuesta) => {
  const { nombre, tipo } = peticion.body;
  if (!nombre) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio.' });
  }
  try {
    const industria = await insertarConCodigoUnico(nombre, async (codigo) => {
      const resultado = await consultarBaseDatos(
        `INSERT INTO industria (codigo, nombre, tipo) VALUES ($1, $2, COALESCE($3, 'Productos (comerciales)'))
         RETURNING id_industria AS "idIndustria", codigo, nombre, tipo`,
        [codigo, nombre, tipo || null]
      );
      return resultado.rows[0];
    });
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la industria ${nombre}` });
    return respuesta.status(201).json({ exito: true, industria });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la industria.' });
  }
};

export const editarIndustria = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre, tipo } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE industria SET nombre = COALESCE($1, nombre), tipo = COALESCE($2, tipo) WHERE id_industria = $3
       RETURNING id_industria AS "idIndustria", codigo, nombre, tipo`,
      [nombre || null, tipo || null, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Industria no encontrada.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Editó la industria #${id}` });
    return respuesta.status(200).json({ exito: true, industria: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar la industria.' });
  }
};

export const cambiarEstadoIndustria = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { activo } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE industria SET activo = $1 WHERE id_industria = $2 RETURNING id_industria AS "idIndustria", nombre, activo`,
      [!!activo, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Industria no encontrada.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${activo ? 'Reactivó' : 'Dio de baja a'} la industria ${resultado.rows[0].nombre}`
    });
    return respuesta.status(200).json({ exito: true, industria: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado de la industria.' });
  }
};

export const obtenerConfiguracionCriticidad = async (peticion, respuesta) => {
  try {
    const pesos = await consultarBaseDatos('SELECT * FROM configuracion_pesos ORDER BY id_configuracion ASC LIMIT 1');
    const criticidad = await consultarBaseDatos('SELECT * FROM configuracion_criticidad ORDER BY tipo_industria ASC');
    return respuesta.status(200).json({
      exito: true,
      pesos: pesos.rows[0] && {
        idConfiguracion: pesos.rows[0].id_configuracion,
        pesoAsg: Number(pesos.rows[0].peso_asg),
        pesoNegocio: Number(pesos.rows[0].peso_negocio),
        pesoOrigen: Number(pesos.rows[0].peso_origen),
        pesoParticipacion: Number(pesos.rows[0].peso_participacion),
        criticidadLocal: Number(pesos.rows[0].criticidad_local),
        criticidadInternacional: Number(pesos.rows[0].criticidad_internacional)
      },
      criticidad: criticidad.rows.map((fila) => ({
        idConfiguracion: fila.id_configuracion,
        tipoIndustria: fila.tipo_industria,
        criticoAlto: Number(fila.critico_alto),
        criticoMedio: Number(fila.critico_medio),
        criticoBajo: Number(fila.critico_bajo),
        participacionAlta: Number(fila.participacion_alta),
        participacionMedia: Number(fila.participacion_media),
        participacionBaja: Number(fila.participacion_baja),
        umbralBajo: Number(fila.umbral_bajo),
        umbralMedio: Number(fila.umbral_medio)
      }))
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar la configuración de criticidad.' });
  }
};

export const actualizarConfiguracionPesos = async (peticion, respuesta) => {
  const { pesoAsg, pesoNegocio, pesoOrigen, pesoParticipacion, criticidadLocal, criticidadInternacional } = peticion.body;

  const suma = Number(pesoAsg) + Number(pesoNegocio) + Number(pesoOrigen) + Number(pesoParticipacion);
  if (Math.abs(suma - 1) > 0.001) {
    return respuesta.status(400).json({ exito: false, mensaje: `Los pesos (ASG, Negocio, Origen, Participación) deben sumar 100% (recibido ${Math.round(suma * 100)}%).` });
  }

  try {
    await consultarBaseDatos(
      `UPDATE configuracion_pesos SET peso_asg = $1, peso_negocio = $2, peso_origen = $3, peso_participacion = $4,
              criticidad_local = $5, criticidad_internacional = $6
       WHERE id_configuracion = (SELECT id_configuracion FROM configuracion_pesos ORDER BY id_configuracion ASC LIMIT 1)`,
      [pesoAsg, pesoNegocio, pesoOrigen, pesoParticipacion, criticidadLocal, criticidadInternacional]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: 'Actualizó los pesos del modelo de criticidad' });
    return obtenerConfiguracionCriticidad(peticion, respuesta);
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar los pesos del modelo de criticidad.' });
  }
};

export const actualizarConfiguracionCriticidadPorTipo = async (peticion, respuesta) => {
  const { tipoIndustria } = peticion.params;
  const {
    criticoAlto, criticoMedio, criticoBajo,
    participacionAlta, participacionMedia, participacionBaja,
    umbralBajo, umbralMedio
  } = peticion.body;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE configuracion_criticidad SET
         critico_alto = COALESCE($1, critico_alto), critico_medio = COALESCE($2, critico_medio), critico_bajo = COALESCE($3, critico_bajo),
         participacion_alta = COALESCE($4, participacion_alta), participacion_media = COALESCE($5, participacion_media), participacion_baja = COALESCE($6, participacion_baja),
         umbral_bajo = COALESCE($7, umbral_bajo), umbral_medio = COALESCE($8, umbral_medio)
       WHERE tipo_industria = $9
       RETURNING id_configuracion`,
      [criticoAlto ?? null, criticoMedio ?? null, criticoBajo ?? null,
        participacionAlta ?? null, participacionMedia ?? null, participacionBaja ?? null,
        umbralBajo ?? null, umbralMedio ?? null, tipoIndustria]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Tipo de industria no encontrado en la configuración.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Actualizó la configuración de criticidad para "${tipoIndustria}"` });
    return obtenerConfiguracionCriticidad(peticion, respuesta);
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar la configuración de criticidad.' });
  }
};

export const listarDimensiones = async (peticion, respuesta) => {
  try {
    const incluirInactivas = peticion.query.incluirInactivos === 'true';
    const resultado = await consultarBaseDatos(
      `SELECT id_dimension AS "idDimension", codigo, nombre, peso, activo FROM dimension
       WHERE $1::boolean OR activo = TRUE ORDER BY id_dimension ASC`,
      [incluirInactivas]
    );
    return respuesta.status(200).json({ exito: true, dimensiones: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar dimensiones.' });
  }
};

export const crearDimension = async (peticion, respuesta) => {
  const { nombre } = peticion.body;
  if (!nombre) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio.' });
  }
  try {
    const dimension = await insertarConCodigoUnico(nombre, async (codigo) => {
      const resultado = await consultarBaseDatos(
        `INSERT INTO dimension (codigo, nombre, peso) VALUES ($1, $2, 0)
         RETURNING id_dimension AS "idDimension", codigo, nombre, peso, activo`,
        [codigo, nombre]
      );
      return resultado.rows[0];
    });
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `Creó la dimensión ${nombre} (peso inicial 0%)`
    });
    return respuesta.status(201).json({ exito: true, dimension });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la dimensión.' });
  }
};

export const editarDimension = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE dimension SET nombre = COALESCE($1, nombre) WHERE id_dimension = $2
       RETURNING id_dimension AS "idDimension", codigo, nombre, peso, activo`,
      [nombre || null, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Dimensión no encontrada.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Editó la dimensión #${id}` });
    return respuesta.status(200).json({ exito: true, dimension: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar la dimensión.' });
  }
};

export const cambiarEstadoDimension = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { activo } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE dimension SET activo = $1 WHERE id_dimension = $2 RETURNING id_dimension AS "idDimension", nombre, activo`,
      [!!activo, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Dimensión no encontrada.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${activo ? 'Reactivó' : 'Dio de baja a'} la dimensión ${resultado.rows[0].nombre}`
    });
    return respuesta.status(200).json({ exito: true, dimension: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado de la dimensión.' });
  }
};

export const actualizarPesosDimensiones = async (peticion, respuesta) => {
  const { pesos } = peticion.body;

  if (!Array.isArray(pesos) || pesos.length === 0) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Debe enviar la lista de pesos por dimensión.' });
  }

  const sumaPesos = pesos.reduce((acumulado, item) => acumulado + Number(item.peso), 0);
  if (Math.abs(sumaPesos - 1) > 0.001) {
    return respuesta.status(400).json({
      exito: false,
      mensaje: `Los pesos de las dimensiones deben sumar 100% (recibido ${Math.round(sumaPesos * 100)}%).`
    });
  }

  try {
    for (const item of pesos) {
      await consultarBaseDatos('UPDATE dimension SET peso = $1 WHERE id_dimension = $2', [item.peso, item.idDimension]);
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: 'Actualizó los pesos de las dimensiones' });
    const resultado = await consultarBaseDatos(
      'SELECT id_dimension AS "idDimension", codigo, nombre, peso FROM dimension ORDER BY id_dimension ASC'
    );
    return respuesta.status(200).json({ exito: true, dimensiones: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar los pesos de las dimensiones.' });
  }
};
