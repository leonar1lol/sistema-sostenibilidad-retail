export function calcularVisibilidad(items, reglas, respuestasPorItem) {
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
}
