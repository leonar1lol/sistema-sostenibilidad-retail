import jwt from 'jsonwebtoken';

export const verificarSesion = (peticion, respuesta, siguiente) => {
  const encabezado = peticion.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return respuesta.status(401).json({ exito: false, mensaje: 'Sesión no proporcionada.' });
  }

  try {
    peticion.usuario = jwt.verify(token, process.env.CLAVE_SECRETA_JWT);
    return siguiente();
  } catch {
    return respuesta.status(401).json({ exito: false, mensaje: 'Sesión inválida o expirada.' });
  }
};

export const requierePermiso = (codigoPermiso) => (peticion, respuesta, siguiente) => {
  const rol = peticion.usuario?.rol || '';
  const permisos = peticion.usuario?.permisos || [];

  if (
    rol === 'Administrador Corporativo' ||
    rol.toLowerCase().includes('admin') ||
    permisos.includes('*') ||
    permisos.includes(codigoPermiso)
  ) {
    return siguiente();
  }
  return respuesta.status(403).json({ exito: false, mensaje: 'No tiene permiso para esta operación.' });
};
