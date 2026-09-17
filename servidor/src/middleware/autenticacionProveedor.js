import jwt from 'jsonwebtoken';

export const verificarSesionProveedor = (peticion, respuesta, siguiente) => {
  const encabezado = peticion.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return respuesta.status(401).json({ exito: false, mensaje: 'Sesión no proporcionada.' });
  }

  try {
    const datos = jwt.verify(token, process.env.CLAVE_SECRETA_JWT);
    if (datos.tipo !== 'proveedor') {
      return respuesta.status(401).json({ exito: false, mensaje: 'Sesión inválida.' });
    }
    peticion.sesionProveedor = datos;
    return siguiente();
  } catch {
    return respuesta.status(401).json({ exito: false, mensaje: 'Sesión inválida o expirada.' });
  }
};

export const requiereEvaluacionAsignada = (peticion, respuesta, siguiente) => {
  if (!peticion.sesionProveedor?.idEvaluacion) {
    return respuesta.status(403).json({ exito: false, mensaje: 'Debe completar el registro antes de continuar.' });
  }
  return siguiente();
};
