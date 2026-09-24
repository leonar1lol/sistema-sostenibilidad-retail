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

// Modelo de criticidad corporativa: combina el puntaje ASG del cuestionario con
// factores de riesgo del proveedor (origen, criticidad de negocio, participación),
// ponderados según configuracion_pesos/configuracion_criticidad (RF-equivalente al
// modelo de "criticidad" de la plataforma de referencia de Intercorp Retail).
export const calcularPuntajeFinalPonderado = (puntajeAsg, proveedor, pesos, criticidadPorTipo) => {
  if (!pesos || puntajeAsg === null || puntajeAsg === undefined) return null;

  const configTipo = criticidadPorTipo.find((c) => c.tipoIndustria === proveedor.tipoIndustria) || criticidadPorTipo[0];
  if (!configTipo) return null;

  const valorOrigen = proveedor.pais === 'Perú' ? pesos.criticidadLocal : pesos.criticidadInternacional;

  const mapaNegocio = { Alto: configTipo.criticoAlto, Medio: configTipo.criticoMedio, Bajo: configTipo.criticoBajo };
  const valorNegocio = mapaNegocio[proveedor.nivelCriticidadNegocio] ?? configTipo.criticoBajo;

  const mapaParticipacion = { Alta: configTipo.participacionAlta, Media: configTipo.participacionMedia, Baja: configTipo.participacionBaja };
  const valorParticipacion = mapaParticipacion[proveedor.nivelParticipacion] ?? configTipo.participacionBaja;

  const puntajeFinal =
    pesos.pesoAsg * Number(puntajeAsg) +
    pesos.pesoNegocio * valorNegocio +
    pesos.pesoOrigen * valorOrigen +
    pesos.pesoParticipacion * valorParticipacion;

  const nivelRiesgo =
    puntajeFinal < configTipo.umbralBajo ? 'Alto' : puntajeFinal < configTipo.umbralMedio ? 'Medio' : 'Bajo';

  const redondear = (n) => Math.round(n * 100) / 100;

  // Se exponen también los componentes del cálculo (no solo el resultado final),
  // igual que el desglose "Puntajes ESG" de la plataforma de referencia de
  // Intercorp Retail: permite entender POR QUÉ un proveedor quedó en ese nivel
  // de riesgo, no solo ver el número compuesto.
  return {
    puntajeFinal: redondear(puntajeFinal),
    nivelRiesgo,
    puntajeAsg: redondear(Number(puntajeAsg)),
    puntajeOrigen: redondear(valorOrigen),
    puntajeParticipacion: redondear(valorParticipacion),
    puntajeCriticoNegocio: redondear(valorNegocio)
  };
};
