export const exportarProveedoresAExcel = (proveedores, resumen = null) => {
  const filasResumen = [];
  if (resumen) {
    filasResumen.push(
      ['Reporte de Sostenibilidad de Proveedores - Intercorp Retail'],
      [`Generado: ${new Date().toLocaleString('es-PE')}`],
      [`Filtro de unidad: ${resumen.unidadSeleccionada === 'todas' ? 'Todas las unidades' : resumen.unidadSeleccionada}`],
      [`Solo proveedores críticos: ${resumen.soloCriticosActivo ? 'Sí' : 'No'}`],
      [],
      ['Indicador', 'Único', 'Incluyendo duplicados'],
      ['Avance Global', `${resumen.avanceGlobalUnico}%`, `${resumen.avanceGlobalGeneral}%`],
      ['Proveedores Críticos', resumen.criticosTotales, resumen.criticosIncluyendoDuplicados],
      ['Completados', resumen.encuestasCompletadas, resumen.completadosIncluyendoDuplicados],
      ['Pendientes', resumen.criticosTotales - resumen.encuestasCompletadas, resumen.criticosIncluyendoDuplicados - resumen.completadosIncluyendoDuplicados],
      ['Padrón Activo (filtrado)', resumen.totalProveedores, ''],
      ['Promedio ESG (críticos finalizados)', `${resumen.promedioAvance}%`, ''],
      []
    );
  }

  const encabezados = [
    'RUC',
    'Razón Social',
    'Representante',
    'Correo',
    'Unidad de Negocio',
    'Industria',
    'Tipo',
    'País',
    'Tamaño de Empresa',
    'Crítico para',
    'Estado',
    'Estado de Evaluación',
    'Puntaje General',
    'Ambiental',
    'Social',
    'Ética y Gobernanza',
    'Laboral',
    'Cadena de Suministro',
    'Nivel de Riesgo',
    'Puntaje Final Ponderado',
    'Puntaje ASG',
    'Puntaje Origen',
    'Puntaje Participación',
    'Puntaje Crítico de Negocio',
    'Criticidad de Negocio',
    'Nivel de Participación',
    'Fecha de Evaluación'
  ];

  const celda = (valor) => (valor === null || valor === undefined ? '""' : `"${valor}"`);

  const filas = proveedores.map((prov) => {
    const dim = prov.dimensiones || {};
    return [
      celda(prov.ruc),
      celda(prov.razonSocial),
      celda(prov.representante),
      celda(prov.correo),
      celda((prov.unidades || []).join(', ')),
      celda(prov.industria),
      celda(prov.tipo),
      celda(prov.pais),
      celda(prov.tamanoEmpresa),
      celda((prov.unidadesCriticas || []).join(', ') || 'No'),
      celda(prov.activo === false ? 'Eliminado' : 'Activo'),
      celda(prov.estadoEvaluacion || 'Sin evaluación'),
      prov.puntajeTotal !== null && prov.puntajeTotal !== undefined ? Number(prov.puntajeTotal) : '""',
      dim.AMB ?? '""',
      dim.SOC ?? '""',
      dim.ETI ?? '""',
      dim.LAB ?? '""',
      dim.CAD ?? '""',
      celda(prov.nivelRiesgo),
      prov.puntajeFinal ?? '""',
      prov.puntajeAsg ?? '""',
      prov.puntajeOrigen ?? '""',
      prov.puntajeParticipacion ?? '""',
      prov.puntajeCriticoNegocio ?? '""',
      celda(prov.nivelCriticidadNegocio),
      celda(prov.nivelParticipacion),
      celda(prov.fechaEvaluacion ? new Date(prov.fechaEvaluacion).toLocaleDateString('es-PE') : '-')
    ];
  });

  const celdaSimple = (valor) => (valor === '' || valor === null || valor === undefined ? '' : `"${valor}"`);

  const contenidoCsv = '﻿' + [
    ...filasResumen.map((fila) => fila.map(celdaSimple).join(';')),
    encabezados.join(';'),
    ...filas.map((fila) => fila.join(';'))
  ].join('\r\n');

  const archivoBlob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
  const enlaceDescarga = document.createElement('a');
  const urlBlob = URL.createObjectURL(archivoBlob);

  enlaceDescarga.setAttribute('href', urlBlob);
  enlaceDescarga.setAttribute('download', `Reporte_Proveedores_Sostenibilidad_Intercorp_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(enlaceDescarga);
  enlaceDescarga.click();
  document.body.removeChild(enlaceDescarga);
};
