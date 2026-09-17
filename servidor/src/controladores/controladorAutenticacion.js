import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const iniciarSesion = async (peticion, respuesta) => {
  const { correo, clave } = peticion.body;

  if (!correo || !clave) {
    return respuesta.status(400).json({ exito: false, mensaje: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const resultadoUsuario = await consultarBaseDatos(
      `SELECT u.id_usuario, u.correo, u.nombre, u.clave_hash, u.estado, u.id_rol, u.id_unidad,
              r.nombre AS rol, un.nombre AS unidad
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       LEFT JOIN unidad_negocio un ON un.id_unidad = u.id_unidad
       WHERE u.correo = $1`,
      [correo.toLowerCase()]
    );

    const usuario = resultadoUsuario.rows[0];

    if (!usuario || !usuario.estado) {
      return respuesta.status(401).json({ exito: false, mensaje: 'Credenciales inválidas.' });
    }

    const claveValida = await bcrypt.compare(clave, usuario.clave_hash);
    if (!claveValida) {
      return respuesta.status(401).json({ exito: false, mensaje: 'Credenciales inválidas.' });
    }

    const resultadoPermisos = await consultarBaseDatos(
      `SELECT p.codigo FROM rol_permiso rp JOIN permiso p ON p.id_permiso = rp.id_permiso WHERE rp.id_rol = $1`,
      [usuario.id_rol]
    );
    const permisos = resultadoPermisos.rows.map((fila) => fila.codigo);

    const token = jwt.sign(
      {
        idUsuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        idUnidad: usuario.id_unidad,
        unidad: usuario.unidad,
        permisos
      },
      process.env.CLAVE_SECRETA_JWT,
      { expiresIn: '8h' }
    );

    await registrarAuditoria({ idUsuario: usuario.id_usuario, accion: 'Inicio de sesión exitoso' });

    return respuesta.status(200).json({
      exito: true,
      token,
      usuario: {
        idUsuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        idUnidad: usuario.id_unidad,
        unidad: usuario.unidad,
        permisos
      }
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al iniciar sesión.' });
  }
};
