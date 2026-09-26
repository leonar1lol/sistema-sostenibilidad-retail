export const aplicarCabecerasSeguridad = (peticion, respuesta, siguiente) => {
  respuesta.setHeader('X-Content-Type-Options', 'nosniff');
  respuesta.setHeader('X-Frame-Options', 'SAMEORIGIN');
  respuesta.setHeader('X-XSS-Protection', '1; mode=block');
  respuesta.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  respuesta.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  if (process.env.MODO_PRODUCCION === 'true' || process.env.NODE_ENV === 'production') {
    respuesta.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  siguiente();
};
