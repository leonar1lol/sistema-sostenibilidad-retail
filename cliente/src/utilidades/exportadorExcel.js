export const exportarProveedoresAExcel = (proveedores) => {
  const encabezados = [
    'RUC',
    'Razón Social',
    'Representante',
    'Correo',
    'Unidad de Negocio',
    'Industria',
    'Crítico',
    'Estado de Evaluación',
    'Puntaje General',
    'Ambiental',
    'Social',
    'Ética y Gobernanza',
    'Laboral',
    'Cadena de Suministro',
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
      celda(prov.unidad),
      celda(prov.industria),
      prov.esCritico ? '"SÍ"' : '"NO"',
      celda(prov.estadoEvaluacion || 'Sin evaluación'),
      prov.puntajeTotal !== null && prov.puntajeTotal !== undefined ? Number(prov.puntajeTotal) : '""',
      dim.AMB ?? '""',
      dim.SOC ?? '""',
      dim.ETI ?? '""',
      dim.LAB ?? '""',
      dim.CAD ?? '""',
      celda(prov.fechaEvaluacion ? new Date(prov.fechaEvaluacion).toLocaleDateString('es-PE') : '-')
    ];
  });

  const contenidoCsv = '﻿' + [
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
