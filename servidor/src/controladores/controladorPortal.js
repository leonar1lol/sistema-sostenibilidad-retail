import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { consultarBaseDatos, ejecutarTransaccion } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';
import { enviarCodigoAccesoOtp, enviarReporteResultados } from '../servicios/servicioCorreo.js';
import { calcularVisibilidad, calcularPuntajes, determinarNivelDesempeno } from '../servicios/servicioCalificacion.js';

const MINUTOS_OTP = Number(process.env.MINUTOS_VIGENCIA_OTP || 10);

const emitirTokenProveedor = (payload) =>
  jwt.sign({ tipo: 'proveedor', ...payload }, process.env.CLAVE_SECRETA_JWT, { expiresIn: '2h' });

export const solicitarAcceso = async (peticion, respuesta) => {
  const { correo } = peticion.body;
  if (!correo) {
    return respuesta.status(400).json({ exito: false, mensaje: 'El correo electrónico es requerido.' });
  }

  try {
    const valor = Math.floor(100000 + Math.random() * 900000).toString();

    await consultarBaseDatos(
      `INSERT INTO codigo_otp (correo, valor, expiracion, usado)
       VALUES ($1, $2, now() + interval '${MINUTOS_OTP} minutes', FALSE)`,
      [correo.toLowerCase(), valor]
    );

    const enviadoPorCorreo = await enviarCodigoAccesoOtp(correo, valor);

    const respuestaJson = enviadoPorCorreo
      ? { exito: true, mensaje: 'Código enviado. Revise su bandeja de entrada.' }
      : {
          exito: true,
          mensaje: 'Servicio de correo aún no configurado: use el código de demostración provisto.',
          codigoDemostracion: valor
        };
    return respuesta.status(200).json(respuestaJson);
  } catch (error) {
    console.error('Error en solicitarAcceso:', error);
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al procesar el código de acceso.' });
  }
};

export const verificarAcceso = async (peticion, respuesta) => {
  const { correo, valor } = peticion.body;
  if (!correo || !valor) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Correo y código son obligatorios.' });
  }

  try {
    const resultadoSesion = await ejecutarTransaccion(async (cliente) => {
      const codigo = await cliente.query(
        `SELECT id_codigo FROM codigo_otp
         WHERE correo = $1 AND valor = $2 AND usado = FALSE AND expiracion > now()
         ORDER BY id_codigo DESC LIMIT 1 FOR UPDATE`,
        [correo.toLowerCase(), valor]
      );

      if (codigo.rows.length === 0) {
        return null;
      }

      await cliente.query('UPDATE codigo_otp SET usado = TRUE WHERE id_codigo = $1', [codigo.rows[0].id_codigo]);

      const proveedor = await cliente.query(
        `SELECT id_proveedor AS "idProveedor", ruc, razon_social AS "razonSocial", representante,
                tipo, id_unidad AS "idUnidad", id_industria AS "idIndustria"
         FROM proveedor WHERE correo = $1`,
        [correo.toLowerCase()]
      );

      return { idCodigo: codigo.rows[0].id_codigo, proveedor: proveedor.rows[0] || null };
    });

    if (!resultadoSesion) {
      return respuesta.status(400).json({
        exito: false,
        mensaje: 'El código ingresado es inválido o ha expirado. Solicite uno nuevo.'
      });
    }

    const { proveedor } = resultadoSesion;
    const token = emitirTokenProveedor({
      correo: correo.toLowerCase(),
      idProveedor: proveedor?.idProveedor || null
    });

    return respuesta.status(200).json({ exito: true, token, proveedorExistente: proveedor || null });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al validar el código de acceso.' });
  }
};

export const registrarProveedor = async (peticion, respuesta) => {
  const { ruc, razonSocial, representante, idIndustria, tipo, idCampania, idUnidad } = peticion.body;
  const { correo, idProveedor: idProveedorSesion } = peticion.sesionProveedor;

  if (!ruc || !razonSocial || !idIndustria) {
    return respuesta.status(400).json({ exito: false, mensaje: 'RUC, razón social e industria son obligatorios.' });
  }

  try {
    const resultado = await ejecutarTransaccion(async (cliente) => {
      let idProveedor = idProveedorSesion;

      const existentePorRuc = await cliente.query('SELECT id_proveedor, id_unidad FROM proveedor WHERE ruc = $1', [ruc]);

      if (existentePorRuc.rows.length > 0) {
        idProveedor = existentePorRuc.rows[0].id_proveedor;
        await cliente.query(
          `UPDATE proveedor SET representante = $1, correo = $2, id_industria = $3, tipo = COALESCE($4, tipo)
           WHERE id_proveedor = $5`,
          [representante || null, correo, idIndustria, tipo === 'No retail' ? 'No retail' : tipo === 'Retail' ? 'Retail' : null, idProveedor]
        );
      } else {
        let idUnidadFinal = idUnidad;
        if (!idUnidadFinal) {
          const unidadPorDefecto = await cliente.query('SELECT id_unidad FROM unidad_negocio ORDER BY id_unidad ASC LIMIT 1');
          idUnidadFinal = unidadPorDefecto.rows[0]?.id_unidad;
        }
        if (!idUnidadFinal) {
          throw Object.assign(new Error('Falta la unidad de negocio de origen del enlace.'), { codigoHttp: 400 });
        }
        const nuevo = await cliente.query(
          `INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, id_unidad, id_industria)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_proveedor`,
          [ruc, razonSocial, representante || null, correo, tipo === 'No retail' ? 'No retail' : 'Retail', idUnidadFinal, idIndustria]
        );
        idProveedor = nuevo.rows[0].id_proveedor;
      }

      let idCampaniaResuelta = idCampania;
      if (!idCampaniaResuelta) {
        const campaniaActiva = await cliente.query(
          `SELECT id_campania FROM campania WHERE estado IN ('Publicada', 'Activa') ORDER BY id_campania DESC LIMIT 1`
        );
        idCampaniaResuelta = campaniaActiva.rows[0]?.id_campania;
      }
      if (!idCampaniaResuelta) {
        throw Object.assign(new Error('No hay ninguna campaña activa en este momento.'), { codigoHttp: 409 });
      }

      const tokenEvaluacion = crypto.randomBytes(24).toString('hex');
      const evaluacion = await cliente.query(
        `INSERT INTO evaluacion (id_campania, id_proveedor, token, estado)
         VALUES ($1, $2, $3, 'En proceso')
         ON CONFLICT (id_campania, id_proveedor) DO UPDATE
           SET estado = CASE WHEN evaluacion.estado = 'Pendiente' THEN 'En proceso' ELSE evaluacion.estado END
         RETURNING id_evaluacion AS "idEvaluacion", estado`,
        [idCampaniaResuelta, idProveedor, tokenEvaluacion]
      );

      return { idProveedor, idEvaluacion: evaluacion.rows[0].idEvaluacion, estadoEvaluacion: evaluacion.rows[0].estado };
    });

    await registrarAuditoria({
      idEvaluacion: resultado.idEvaluacion,
      accion: `Registro/actualización de proveedor RUC ${ruc} en el portal`
    });

    const token = emitirTokenProveedor({
      correo,
      idProveedor: resultado.idProveedor,
      idEvaluacion: resultado.idEvaluacion
    });

    return respuesta.status(200).json({
      exito: true,
      token,
      idEvaluacion: resultado.idEvaluacion,
      evaluacionFinalizada: resultado.estadoEvaluacion === 'Finalizado'
    });
  } catch (error) {
    return respuesta.status(error.codigoHttp || 500).json({ exito: false, mensaje: error.message || 'Error al registrar el proveedor.' });
  }
};

const cargarContextoCuestionario = async (idEvaluacion) => {
  const evaluacion = await consultarBaseDatos(
    `SELECT ev.id_evaluacion AS "idEvaluacion", ev.estado, ev.puntaje_total AS "puntajeTotal", ev.id_proveedor AS "idProveedor",
            p.id_industria AS "idIndustria", p.razon_social AS "razonSocial", p.ruc, p.representante, p.correo
     FROM evaluacion ev JOIN proveedor p ON p.id_proveedor = ev.id_proveedor
     WHERE ev.id_evaluacion = $1`,
    [idEvaluacion]
  );
  if (!evaluacion.rows[0]) return null;
  const contexto = evaluacion.rows[0];

  const items = await consultarBaseDatos(
    `SELECT i.id_item AS "idItem", i.codigo, i.enunciado, i.peso, i.id_dimension AS "idDimension",
            d.codigo AS "codigoDimension", d.nombre AS "nombreDimension"
     FROM item i
     JOIN item_industria ii ON ii.id_item = i.id_item
     JOIN dimension d ON d.id_dimension = i.id_dimension
     WHERE ii.id_industria = $1
     ORDER BY d.id_dimension ASC, i.id_item ASC`,
    [contexto.idIndustria]
  );

  const idsItems = items.rows.map((i) => i.idItem);
  const alternativas = idsItems.length
    ? await consultarBaseDatos(
        `SELECT id_alternativa AS "idAlternativa", id_item AS "idItem", texto, puntaje, orden
         FROM alternativa WHERE id_item = ANY($1::int[]) ORDER BY id_item ASC, orden ASC, id_alternativa ASC`,
        [idsItems]
      )
    : { rows: [] };

  const reglas = idsItems.length
    ? await consultarBaseDatos(
        `SELECT id_regla AS "idRegla", id_item_origen AS "idItemOrigen", id_alternativa_disparadora AS "idAlternativaDisparadora",
                accion, id_item_destino AS "idItemDestino"
         FROM regla_condicional WHERE id_item_destino = ANY($1::int[])`,
        [idsItems]
      )
    : { rows: [] };

  const respuestas = await consultarBaseDatos(
    `SELECT id_item AS "idItem", id_alternativa AS "idAlternativa" FROM respuesta WHERE id_evaluacion = $1`,
    [idEvaluacion]
  );

  const dimensiones = await consultarBaseDatos(
    'SELECT id_dimension AS "idDimension", codigo, nombre, peso FROM dimension ORDER BY id_dimension ASC'
  );

  const itemsConAlternativas = items.rows.map((item) => ({
    ...item,
    alternativas: alternativas.rows.filter((a) => a.idItem === item.idItem)
  }));

  return {
    contexto,
    items: itemsConAlternativas,
    reglas: reglas.rows,
    respuestas: respuestas.rows,
    dimensiones: dimensiones.rows
  };
};

export const obtenerCuestionario = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  try {
    const datos = await cargarContextoCuestionario(idEvaluacion);
    if (!datos) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada.' });
    }
    if (datos.items.length === 0) {
      return respuesta.status(200).json({
        exito: true,
        items: [],
        reglas: [],
        respuestas: [],
        dimensiones: datos.dimensiones,
        proveedor: datos.contexto,
        mensaje: 'Todavía no hay ítems de evaluación configurados para su industria. Contacte a su unidad de negocio de referencia.'
      });
    }
    return respuesta.status(200).json({
      exito: true,
      items: datos.items,
      reglas: datos.reglas,
      respuestas: datos.respuestas,
      dimensiones: datos.dimensiones,
      proveedor: datos.contexto,
      evaluacionFinalizada: datos.contexto.estado === 'Finalizado'
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cargar el cuestionario.' });
  }
};

export const guardarRespuesta = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  const { idItem, idAlternativa } = peticion.body;

  if (!idItem || !idAlternativa) {
    return respuesta.status(400).json({ exito: false, mensaje: 'idItem e idAlternativa son obligatorios.' });
  }

  try {
    const alternativaValida = await consultarBaseDatos(
      'SELECT 1 FROM alternativa WHERE id_alternativa = $1 AND id_item = $2',
      [idAlternativa, idItem]
    );
    if (alternativaValida.rows.length === 0) {
      return respuesta.status(400).json({ exito: false, mensaje: 'La alternativa no corresponde al ítem indicado.' });
    }

    await consultarBaseDatos(
      `INSERT INTO respuesta (id_evaluacion, id_item, id_alternativa)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_evaluacion, id_item) DO UPDATE SET id_alternativa = EXCLUDED.id_alternativa, fecha = now()`,
      [idEvaluacion, idItem, idAlternativa]
    );

    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al guardar la respuesta.' });
  }
};

export const finalizarEvaluacion = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;

  try {
    const datos = await cargarContextoCuestionario(idEvaluacion);
    if (!datos) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada.' });
    }
    if (datos.contexto.estado === 'Finalizado') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Esta evaluación ya fue enviada anteriormente.' });
    }

    const respuestasPorItem = Object.fromEntries(datos.respuestas.map((r) => [r.idItem, r.idAlternativa]));
    const visibilidad = calcularVisibilidad(datos.items, datos.reglas, respuestasPorItem);

    const itemsAplicablesVisibles = datos.items.filter(
      (item) => visibilidad[item.idItem].visible && !visibilidad[item.idItem].deshabilitado
    );
    const itemsSinResponder = itemsAplicablesVisibles.filter((item) => respuestasPorItem[item.idItem] == null);

    if (itemsSinResponder.length > 0) {
      return respuesta.status(400).json({
        exito: false,
        mensaje: 'Faltan ítems por responder antes de poder finalizar la evaluación.',
        itemsFaltantes: itemsSinResponder.map((i) => i.codigo)
      });
    }

    const itemsRespondidos = itemsAplicablesVisibles.map((item) => {
      const idAlternativa = respuestasPorItem[item.idItem];
      const alternativa = item.alternativas.find((a) => a.idAlternativa === idAlternativa);
      return {
        idItem: item.idItem,
        idDimension: item.idDimension,
        peso: Number(item.peso),
        puntajeAlternativa: Number(alternativa.puntaje)
      };
    });

    const { puntajeTotal, dimensiones: puntajesPorDimension } = calcularPuntajes(itemsRespondidos, datos.dimensiones);

    if (puntajeTotal === null) {
      return respuesta.status(400).json({ exito: false, mensaje: 'No se pudo calcular ningún puntaje: no hay ítems respondidos.' });
    }

    await ejecutarTransaccion(async (cliente) => {
      await cliente.query(
        `UPDATE evaluacion SET puntaje_total = $1, estado = 'Finalizado', fecha_envio = now() WHERE id_evaluacion = $2`,
        [puntajeTotal, idEvaluacion]
      );
      await cliente.query('DELETE FROM puntaje_dimension WHERE id_evaluacion = $1', [idEvaluacion]);
      for (const dimension of puntajesPorDimension) {
        await cliente.query(
          'INSERT INTO puntaje_dimension (id_evaluacion, id_dimension, valor) VALUES ($1, $2, $3)',
          [idEvaluacion, dimension.idDimension, dimension.puntaje]
        );
      }
    });

    let recomendaciones = [];
    for (const dimension of puntajesPorDimension) {
      const filas = await consultarBaseDatos(
        'SELECT id_recomendacion AS "idRecomendacion", texto, umbral FROM recomendacion WHERE id_dimension = $1 AND umbral > $2',
        [dimension.idDimension, dimension.puntaje]
      );
      recomendaciones.push(...filas.rows.map((r) => ({ ...r, dimension: dimension.nombre })));
    }

    const nivel = determinarNivelDesempeno(puntajeTotal);

    await enviarReporteResultados(
      datos.contexto.correo,
      datos.contexto.razonSocial,
      puntajeTotal,
      recomendaciones
    );

    await registrarAuditoria({ idEvaluacion, accion: `Finalizó su evaluación con puntaje ${puntajeTotal}/100` });

    return respuesta.status(200).json({
      exito: true,
      puntajeTotal,
      nivel,
      dimensiones: puntajesPorDimension,
      recomendaciones
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al finalizar la evaluación.' });
  }
};

export const obtenerResultado = async (peticion, respuesta) => {
  const { idEvaluacion } = peticion.sesionProveedor;
  try {
    const evaluacion = await consultarBaseDatos(
      `SELECT ev.puntaje_total AS "puntajeTotal", ev.estado, p.razon_social AS "razonSocial", p.ruc
       FROM evaluacion ev JOIN proveedor p ON p.id_proveedor = ev.id_proveedor WHERE ev.id_evaluacion = $1`,
      [idEvaluacion]
    );
    if (!evaluacion.rows[0] || evaluacion.rows[0].estado !== 'Finalizado') {
      return respuesta.status(404).json({ exito: false, mensaje: 'Esta evaluación todavía no ha sido finalizada.' });
    }
    const puntajesDimension = await consultarBaseDatos(
      `SELECT d.codigo, d.nombre, pd.valor AS puntaje FROM puntaje_dimension pd
       JOIN dimension d ON d.id_dimension = pd.id_dimension WHERE pd.id_evaluacion = $1 ORDER BY d.id_dimension ASC`,
      [idEvaluacion]
    );
    return respuesta.status(200).json({
      exito: true,
      puntajeTotal: evaluacion.rows[0].puntajeTotal,
      nivel: determinarNivelDesempeno(evaluacion.rows[0].puntajeTotal),
      dimensiones: puntajesDimension.rows,
      razonSocial: evaluacion.rows[0].razonSocial,
      ruc: evaluacion.rows[0].ruc
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar el resultado.' });
  }
};
