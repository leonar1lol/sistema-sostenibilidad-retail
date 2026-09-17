import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const listarUnidadesNegocio = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(
      'SELECT id_unidad AS "idUnidad", codigo, nombre, gerente FROM unidad_negocio ORDER BY id_unidad ASC'
    );
    return respuesta.status(200).json({ exito: true, unidades: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar unidades de negocio.' });
  }
};

export const crearUnidadNegocio = async (peticion, respuesta) => {
  const { codigo, nombre, gerente } = peticion.body;
  if (!codigo || !nombre) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Código y nombre son obligatorios.' });
  }
  try {
    const resultado = await consultarBaseDatos(
      `INSERT INTO unidad_negocio (codigo, nombre, gerente) VALUES ($1, $2, $3)
       RETURNING id_unidad AS "idUnidad", codigo, nombre, gerente`,
      [codigo, nombre, gerente || null]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la unidad de negocio ${nombre}` });
    return respuesta.status(201).json({ exito: true, unidad: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe una unidad con ese código.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la unidad de negocio.' });
  }
};

export const editarUnidadNegocio = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre, gerente } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE unidad_negocio SET nombre = COALESCE($1, nombre), gerente = COALESCE($2, gerente)
       WHERE id_unidad = $3
       RETURNING id_unidad AS "idUnidad", codigo, nombre, gerente`,
      [nombre || null, gerente || null, id]
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

export const listarIndustrias = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(
      'SELECT id_industria AS "idIndustria", codigo, nombre FROM industria ORDER BY id_industria ASC'
    );
    return respuesta.status(200).json({ exito: true, industrias: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar industrias.' });
  }
};

export const crearIndustria = async (peticion, respuesta) => {
  const { codigo, nombre } = peticion.body;
  if (!codigo || !nombre) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Código y nombre son obligatorios.' });
  }
  try {
    const resultado = await consultarBaseDatos(
      `INSERT INTO industria (codigo, nombre) VALUES ($1, $2)
       RETURNING id_industria AS "idIndustria", codigo, nombre`,
      [codigo, nombre]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó la industria ${nombre}` });
    return respuesta.status(201).json({ exito: true, industria: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe una industria con ese código.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la industria.' });
  }
};

export const editarIndustria = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre } = peticion.body;
  try {
    const resultado = await consultarBaseDatos(
      `UPDATE industria SET nombre = COALESCE($1, nombre) WHERE id_industria = $2
       RETURNING id_industria AS "idIndustria", codigo, nombre`,
      [nombre || null, id]
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

export const listarDimensiones = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(
      'SELECT id_dimension AS "idDimension", codigo, nombre, peso FROM dimension ORDER BY id_dimension ASC'
    );
    return respuesta.status(200).json({ exito: true, dimensiones: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar dimensiones.' });
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
