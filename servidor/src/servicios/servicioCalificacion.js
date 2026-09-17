export const calcularVisibilidad = (items, reglas, respuestasPorItem) => {
  const resultado = {};

  for (const item of items) {
    const reglasDelItem = reglas.filter((r) => r.idItemDestino === item.idItem);

    if (reglasDelItem.length === 0) {
      resultado[item.idItem] = { visible: true, deshabilitado: false };
      continue;
    }

    const tieneReglaMostrar = reglasDelItem.some((r) => r.accion === 'mostrar');
    let visible = !tieneReglaMostrar;
    let deshabilitado = false;

    for (const regla of reglasDelItem) {
      const idAlternativaRespondida = respuestasPorItem[regla.idItemOrigen];
      const disparada = idAlternativaRespondida != null && idAlternativaRespondida === regla.idAlternativaDisparadora;

      if (regla.accion === 'mostrar' && disparada) visible = true;
      if (regla.accion === 'ocultar' && disparada) visible = false;
      if (regla.accion === 'deshabilitar' && disparada) deshabilitado = true;
    }

    resultado[item.idItem] = { visible, deshabilitado };
  }

  return resultado;
};

export const calcularPuntajes = (itemsRespondidos, dimensiones) => {
  const acumuladoPorDimension = {};

  for (const item of itemsRespondidos) {
    if (!acumuladoPorDimension[item.idDimension]) {
      acumuladoPorDimension[item.idDimension] = { sumaPonderada: 0, sumaPesos: 0 };
    }
    acumuladoPorDimension[item.idDimension].sumaPonderada += item.puntajeAlternativa * item.peso;
    acumuladoPorDimension[item.idDimension].sumaPesos += item.peso;
  }

  const puntajesPorDimension = [];
  for (const dimension of dimensiones) {
    const acumulado = acumuladoPorDimension[dimension.idDimension];
    if (!acumulado || acumulado.sumaPesos === 0) continue; // se omite, no cuenta como 0

    puntajesPorDimension.push({
      idDimension: dimension.idDimension,
      codigo: dimension.codigo,
      nombre: dimension.nombre,
      peso: Number(dimension.peso),
      puntaje: Math.round(acumulado.sumaPonderada / acumulado.sumaPesos)
    });
  }

  if (puntajesPorDimension.length === 0) {
    return { puntajeTotal: null, dimensiones: [] };
  }

  const sumaPonderadaGeneral = puntajesPorDimension.reduce((acc, d) => acc + d.puntaje * d.peso, 0);
  const sumaPesosGeneral = puntajesPorDimension.reduce((acc, d) => acc + d.peso, 0);

  return {
    puntajeTotal: Math.round(sumaPonderadaGeneral / sumaPesosGeneral),
    dimensiones: puntajesPorDimension
  };
};

export const determinarNivelDesempeno = (puntaje) => {
  if (puntaje >= 75) return 'Avanzado';
  if (puntaje >= 60) return 'Intermedio';
  return 'Inicial';
};
