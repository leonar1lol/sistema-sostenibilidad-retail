import { useCallback, useRef, useState } from 'react';

// Mensaje de error/aviso que se autolimpia: evita que un banner de error se
// quede fijo en pantalla toda la sesión después de un intento fallido.
export function useMensajeTemporal(duracionMs = 6000) {
  const [mensaje, setMensajeInterno] = useState('');
  const temporizadorRef = useRef(null);

  const setMensaje = useCallback((texto) => {
    clearTimeout(temporizadorRef.current);
    setMensajeInterno(texto);
    if (texto) {
      temporizadorRef.current = setTimeout(() => setMensajeInterno(''), duracionMs);
    }
  }, [duracionMs]);

  return [mensaje, setMensaje];
}
