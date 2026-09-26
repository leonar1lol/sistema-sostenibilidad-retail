const registroPeticiones = new Map();

const temporizadorLimpieza = setInterval(() => {
  const ahora = Date.now();
  for (const [clave, datos] of registroPeticiones.entries()) {
    if (ahora - datos.inicioVentana > datos.duracionVentanaMs) {
      registroPeticiones.delete(clave);
    }
  }
}, 60000);

if (temporizadorLimpieza.unref) {
  temporizadorLimpieza.unref();
}

export const crearLimitador = ({ ventanaMinutos = 15, maximoIntentos = 10, mensaje = 'Demasiadas solicitudes. Intente más tarde.' }) => {
  const duracionVentanaMs = ventanaMinutos * 60 * 1000;

  return (peticion, respuesta, siguiente) => {
    const direccionIp = peticion.ip || peticion.headers['x-forwarded-for'] || peticion.socket.remoteAddress || 'desconocida';
    const clave = `${peticion.baseUrl || ''}${peticion.path}:${direccionIp}`;
    const ahora = Date.now();

    let registro = registroPeticiones.get(clave);

    if (!registro || ahora - registro.inicioVentana > duracionVentanaMs) {
      registro = {
        contador: 1,
        inicioVentana: ahora,
        duracionVentanaMs
      };
      registroPeticiones.set(clave, registro);
      respuesta.setHeader('X-RateLimit-Limit', maximoIntentos);
      respuesta.setHeader('X-RateLimit-Remaining', maximoIntentos - 1);
      return siguiente();
    }

    if (registro.contador >= maximoIntentos) {
      const tiempoRestanteSegundos = Math.ceil((registro.inicioVentana + duracionVentanaMs - ahora) / 1000);
      respuesta.setHeader('Retry-After', tiempoRestanteSegundos);
      respuesta.setHeader('X-RateLimit-Limit', maximoIntentos);
      respuesta.setHeader('X-RateLimit-Remaining', 0);
      return respuesta.status(429).json({
        exito: false,
        mensaje
      });
    }

    registro.contador += 1;
    respuesta.setHeader('X-RateLimit-Limit', maximoIntentos);
    respuesta.setHeader('X-RateLimit-Remaining', maximoIntentos - registro.contador);
    return siguiente();
  };
};

export const limitadorLogin = crearLimitador({
  ventanaMinutos: 15,
  maximoIntentos: 10,
  mensaje: 'Demasiados intentos de inicio de sesión. Por motivos de seguridad, espere 15 minutos.'
});

export const limitadorSolicitudOtp = crearLimitador({
  ventanaMinutos: 10,
  maximoIntentos: 5,
  mensaje: 'Demasiadas solicitudes de código OTP. Por favor espere 10 minutos para reintentar.'
});

export const limitadorVerificacionOtp = crearLimitador({
  ventanaMinutos: 10,
  maximoIntentos: 10,
  mensaje: 'Demasiados intentos de verificación de código. Intente nuevamente en 10 minutos.'
});
