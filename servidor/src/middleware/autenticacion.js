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
  // La única fuente de verdad es la lista de permisos emitida en el token
  // (reflejo exacto de la Matriz de Permisos). No se hacen excepciones por
  // nombre de rol: el Administrador Corporativo tiene acceso total porque
  // iniciarSesion le agrega el comodín '*', no por comparar texto.
  const permisos = peticion.usuario?.permisos || [];

  if (permisos.includes('*') || permisos.includes(codigoPermiso)) {
    return siguiente();
  }
  return respuesta.status(403).json({ exito: false, mensaje: 'No tiene permiso para esta operación.' });
};
