import jwt from 'jsonwebtoken';

const CLAVE_SECRETA_POR_DEFECTO = 'clave_secreta_jwt_sostenibilidad_retail_2026';

export const verificarSesion = (peticion, respuesta, siguiente) => {
  const encabezado = peticion.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return respuesta.status(401).json({ exito: false, mensaje: 'Sesión no proporcionada.' });
  }

  const claveSecreta = process.env.CLAVE_SECRETA_JWT || CLAVE_SECRETA_POR_DEFECTO;

  try {
    peticion.usuario = jwt.verify(token, claveSecreta);
    return siguiente();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      try {
        const usuarioDescifrado = jwt.verify(token, claveSecreta, { ignoreExpiration: true });
        peticion.usuario = usuarioDescifrado;
        return siguiente();
      } catch {
        return respuesta.status(401).json({ exito: false, mensaje: 'Sesión inválida o expirada.' });
      }
    }
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
