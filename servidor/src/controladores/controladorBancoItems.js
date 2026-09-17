import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const listarItems = async (peticion, respuesta) => {
  try {
    const items = await consultarBaseDatos(`
      SELECT i.id_item AS "idItem", i.codigo, i.enunciado, i.peso, i.id_dimension AS "idDimension",
             d.codigo AS "codigoDimension", d.nombre AS "nombreDimension"
      FROM item i
      JOIN dimension d ON d.id_dimension = i.id_dimension
      ORDER BY i.id_item ASC
    `);

    const alternativas = await consultarBaseDatos(`
      SELECT id_alternativa AS "idAlternativa", id_item AS "idItem", texto, puntaje, orden
      FROM alternativa ORDER BY id_item ASC, orden ASC, id_alternativa ASC
    `);

    const industriasAsignadas = await consultarBaseDatos(`
      SELECT ii.id_item AS "idItem", ii.id_industria AS "idIndustria", ii.obligatorio, i.nombre, i.codigo
      FROM item_industria ii JOIN industria i ON i.id_industria = ii.id_industria
    `);

    const itemsConDetalle = items.rows.map((item) => ({
      ...item,
      alternativas: alternativas.rows.filter((a) => a.idItem === item.idItem),
      industrias: industriasAsignadas.rows.filter((ii) => ii.idItem === item.idItem)
    }));

    return respuesta.status(200).json({ exito: true, items: itemsConDetalle });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar el banco de ítems.' });
  }
};

export const crearItem = async (peticion, respuesta) => {
  const { codigo, enunciado, peso, idDimension, alternativas, idsIndustrias } = peticion.body;

  if (!codigo || !enunciado || !idDimension || !Array.isArray(alternativas) || alternativas.length < 2) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Código, enunciado, dimensión y al menos dos alternativas son obligatorios.' });
  }

  try {
    const idItem = await ejecutarTransaccion(async (cliente) => {
      const resultadoItem = await cliente.query(
        `INSERT INTO item (codigo, enunciado, peso, id_dimension) VALUES ($1, $2, $3, $4) RETURNING id_item`,
        [codigo, enunciado, peso || 1.0, idDimension]
      );
      const nuevoIdItem = resultadoItem.rows[0].id_item;

      for (let indice = 0; indice < alternativas.length; indice += 1) {
        const alt = alternativas[indice];
        await cliente.query(
          `INSERT INTO alternativa (id_item, texto, puntaje, orden) VALUES ($1, $2, $3, $4)`,
          [nuevoIdItem, alt.texto, alt.puntaje, indice]
        );
      }

      for (const idIndustria of idsIndustrias || []) {
        await cliente.query(
          `INSERT INTO item_industria (id_item, id_industria, obligatorio) VALUES ($1, $2, TRUE)`,
          [nuevoIdItem, idIndustria]
        );
      }

      return nuevoIdItem;
    });

    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó el ítem ${codigo} en el banco de preguntas` });

    return respuesta.status(201).json({ exito: true, idItem });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe un ítem con ese código.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear el ítem.' });
  }
};

export const editarItem = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { enunciado, peso, idDimension } = peticion.body;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE item SET enunciado = COALESCE($1, enunciado), peso = COALESCE($2, peso), id_dimension = COALESCE($3, id_dimension)
       WHERE id_item = $4 RETURNING id_item AS "idItem", codigo, enunciado, peso`,
      [enunciado || null, peso || null, idDimension || null, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Ítem no encontrado.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Editó el ítem #${id}` });
    return respuesta.status(200).json({ exito: true, item: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar el ítem.' });
  }
};

export const actualizarIndustriasDelItem = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { idsIndustrias } = peticion.body;

  if (!Array.isArray(idsIndustrias)) {
    return respuesta.status(400).json({ exito: false, mensaje: 'idsIndustrias debe ser una lista.' });
  }

  try {
    await ejecutarTransaccion(async (cliente) => {
      await cliente.query('DELETE FROM item_industria WHERE id_item = $1', [id]);
      for (const idIndustria of idsIndustrias) {
        await cliente.query(
          `INSERT INTO item_industria (id_item, id_industria, obligatorio) VALUES ($1, $2, TRUE)`,
          [id, idIndustria]
        );
      }
    });
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Actualizó las industrias asignadas al ítem #${id}` });
    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar las industrias del ítem.' });
  }
};

export const agregarAlternativa = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { texto, puntaje, orden } = peticion.body;

  if (!texto || puntaje === undefined) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Texto y puntaje son obligatorios.' });
  }

  try {
    const resultado = await consultarBaseDatos(
      `INSERT INTO alternativa (id_item, texto, puntaje, orden) VALUES ($1, $2, $3, $4)
       RETURNING id_alternativa AS "idAlternativa", id_item AS "idItem", texto, puntaje, orden`,
      [id, texto, puntaje, orden || 0]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Agregó una alternativa al ítem #${id}` });
    return respuesta.status(201).json({ exito: true, alternativa: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al agregar la alternativa.' });
  }
};

export const editarAlternativa = async (peticion, respuesta) => {
  const { idAlternativa } = peticion.params;
  const { texto, puntaje, orden } = peticion.body;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE alternativa SET texto = COALESCE($1, texto), puntaje = COALESCE($2, puntaje), orden = COALESCE($3, orden)
       WHERE id_alternativa = $4 RETURNING id_alternativa AS "idAlternativa", id_item AS "idItem", texto, puntaje, orden`,
      [texto || null, puntaje ?? null, orden ?? null, idAlternativa]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Alternativa no encontrada.' });
    }
    return respuesta.status(200).json({ exito: true, alternativa: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar la alternativa.' });
  }
};

export const eliminarAlternativa = async (peticion, respuesta) => {
  const { idAlternativa } = peticion.params;
  try {
    await consultarBaseDatos('DELETE FROM alternativa WHERE id_alternativa = $1', [idAlternativa]);
    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    if (error.code === '23503') {
      return respuesta.status(409).json({ exito: false, mensaje: 'No se puede eliminar: la alternativa ya tiene respuestas o reglas asociadas.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al eliminar la alternativa.' });
  }
};

export const listarReglasCondicionales = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(`
      SELECT rc.id_regla AS "idRegla", rc.accion,
             rc.id_item_origen AS "idItemOrigen", io.codigo AS "codigoItemOrigen",
             rc.id_alternativa_disparadora AS "idAlternativaDisparadora", ad.texto AS "textoAlternativaDisparadora",
             rc.id_item_destino AS "idItemDestino", id.codigo AS "codigoItemDestino"
      FROM regla_condicional rc
      JOIN item io ON io.id_item = rc.id_item_origen
      JOIN alternativa ad ON ad.id_alternativa = rc.id_alternativa_disparadora
      JOIN item id ON id.id_item = rc.id_item_destino
      ORDER BY rc.id_regla ASC
    `);
    return respuesta.status(200).json({ exito: true, reglas: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar las reglas condicionales.' });
  }
};

export const crearReglaCondicional = async (peticion, respuesta) => {
  const { idItemOrigen, idAlternativaDisparadora, accion, idItemDestino } = peticion.body;

  if (!idItemOrigen || !idAlternativaDisparadora || !accion || !idItemDestino) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Todos los campos de la regla son obligatorios.' });
  }
  if (!['mostrar', 'ocultar', 'deshabilitar'].includes(accion)) {
    return respuesta.status(400).json({ exito: false, mensaje: "La acción debe ser 'mostrar', 'ocultar' o 'deshabilitar'." });
  }
  if (Number(idItemOrigen) === Number(idItemDestino)) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El ítem origen y el ítem destino no pueden ser el mismo.' });
  }

  try {
    const alternativaValida = await consultarBaseDatos(
      'SELECT 1 FROM alternativa WHERE id_alternativa = $1 AND id_item = $2',
      [idAlternativaDisparadora, idItemOrigen]
    );
    if (alternativaValida.rows.length === 0) {
      return respuesta.status(400).json({ exito: false, mensaje: 'La alternativa disparadora no pertenece al ítem origen indicado.' });
    }

    const resultado = await consultarBaseDatos(
      `INSERT INTO regla_condicional (id_item_origen, id_alternativa_disparadora, accion, id_item_destino)
       VALUES ($1, $2, $3, $4) RETURNING id_regla AS "idRegla"`,
      [idItemOrigen, idAlternativaDisparadora, accion, idItemDestino]
    );

    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó una regla condicional (#${resultado.rows[0].idRegla})` });

    return respuesta.status(201).json({ exito: true, idRegla: resultado.rows[0].idRegla });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear la regla condicional.' });
  }
};

export const eliminarReglaCondicional = async (peticion, respuesta) => {
  const { id } = peticion.params;
  try {
    await consultarBaseDatos('DELETE FROM regla_condicional WHERE id_regla = $1', [id]);
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Eliminó la regla condicional #${id}` });
    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al eliminar la regla condicional.' });
  }
};
