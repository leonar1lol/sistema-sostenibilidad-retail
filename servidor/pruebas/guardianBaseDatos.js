const extraerHost = (cadenaConexion) => {
  try {
    if (!cadenaConexion) return '';
    const urlObj = new URL(cadenaConexion);
    return urlObj.host || urlObj.hostname || '';
  } catch {
    const coincidencia = cadenaConexion.match(/@([^:\/?#]+)/);
    return coincidencia ? coincidencia[1] : '';
  }
};

export const verificarAislamientoBaseDatos = () => {
  const urlOperativa = process.env.URL_BASE_DATOS || '';
  const urlTest = process.env.URL_BASE_DATOS_TEST || '';

  if (!urlTest) {
    return true;
  }

  if (urlTest === urlOperativa) {
    throw new Error('BLOQUEO DE SEGURIDAD CRITICO: URL_BASE_DATOS_TEST no puede ser identica a la base operativa.');
  }

  const hostOperativo = extraerHost(urlOperativa);
  const hostTest = extraerHost(urlTest);

  if (hostOperativo && hostTest && hostOperativo === hostTest) {
    throw new Error('BLOQUEO DE SEGURIDAD CRITICO: URL_BASE_DATOS_TEST apunta al mismo host de base de datos operativa.');
  }

  return true;
};

export const crearSimuladorBaseDatos = (manejadorConsultas) => {
  return {
    query: async (textoConsulta, parametros = []) => {
      verificarAislamientoBaseDatos();
      if (manejadorConsultas) {
        return manejadorConsultas(textoConsulta, parametros);
      }
      return { rows: [], rowCount: 0 };
    }
  };
};
