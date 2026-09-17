import bcrypt from 'bcryptjs';
import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const listarUsuarios = async (peticion, respuesta) => {
  try {
    const resultado = await consultarBaseDatos(
      `SELECT u.id_usuario AS "idUsuario", u.correo, u.nombre, u.estado,
              u.id_rol AS "idRol", r.nombre AS rol,
              u.id_unidad AS "idUnidad", un.nombre AS unidad
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       LEFT JOIN unidad_negocio un ON un.id_unidad = u.id_unidad
       ORDER BY u.id_usuario ASC`
    );
    return respuesta.status(200).json({ exito: true, usuarios: resultado.rows });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar usuarios.' });
  }
};

export const crearUsuario = async (peticion, respuesta) => {
  const { correo, nombre, clave, idRol, idUnidad } = peticion.body;

  if (!correo || !nombre || !clave || !idRol) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Correo, nombre, contraseña y rol son obligatorios.' });
  }

  try {
    const claveHash = await bcrypt.hash(clave, 10);
    const resultado = await consultarBaseDatos(
      `INSERT INTO usuario (correo, nombre, clave_hash, id_rol, id_unidad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario AS "idUsuario", correo, nombre, estado`,
      [correo.toLowerCase(), nombre, claveHash, idRol, idUnidad || null]
    );
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Creó el usuario ${correo}` });
    return respuesta.status(201).json({ exito: true, usuario: resultado.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return respuesta.status(409).json({ exito: false, mensaje: 'Ya existe un usuario con ese correo.' });
    }
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al crear el usuario.' });
  }
};

export const editarUsuario = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { nombre, idRol, idUnidad } = peticion.body;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE usuario SET nombre = COALESCE($1, nombre), id_rol = COALESCE($2, id_rol), id_unidad = $3
       WHERE id_usuario = $4
       RETURNING id_usuario AS "idUsuario", correo, nombre, estado`,
      [nombre || null, idRol || null, idUnidad || null, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }
    await registrarAuditoria({ idUsuario: peticion.usuario.idUsuario, accion: `Editó el usuario #${id}` });
    return respuesta.status(200).json({ exito: true, usuario: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al editar el usuario.' });
  }
};

export const cambiarEstadoUsuario = async (peticion, respuesta) => {
  const { id } = peticion.params;
  const { estado } = peticion.body;

  try {
    const resultado = await consultarBaseDatos(
      `UPDATE usuario SET estado = $1 WHERE id_usuario = $2
       RETURNING id_usuario AS "idUsuario", correo, estado`,
      [!!estado, id]
    );
    if (!resultado.rows[0]) {
      return respuesta.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${estado ? 'Activó' : 'Desactivó'} el usuario #${id}`
    });
    return respuesta.status(200).json({ exito: true, usuario: resultado.rows[0] });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al cambiar el estado del usuario.' });
  }
};
