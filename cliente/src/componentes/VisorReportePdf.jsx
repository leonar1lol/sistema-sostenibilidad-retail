import React from 'react';

const VisorReportePdf = ({ tipoReporte, datos, proveedorSeleccionado, alCerrar }) => {
  const fechaActual = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const imprimir = () => {
    window.print();
  };

  const renderizarEncabezado = () => (
    <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GRUPO INTERCORP RETAIL</h1>
        <p className="text-sm font-semibold text-slate-600 mt-1">Dirección Corporativa de Sostenibilidad, Ética y Cadena de Suministro</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-500">DOC-IR-ESG-2026-001</p>
        <p className="text-xs text-slate-500 mt-1">Emisión: {fechaActual}</p>
        <p className="text-xs text-slate-500">Auditor: Sistema Central</p>
      </div>
    </div>
  );

  const renderizarPiePagina = () => (
    <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 print:fixed print:bottom-0 print:w-full print:bg-white pb-4">
      <p>Documento de uso confidencial e institucional exclusivo de Intercorp Retail y subsidiarias.</p>
      <p>Trazabilidad criptográfica garantizada según política de seguridad corporativa.</p>
    </div>
  );

  const renderizarPadronGeneral = () => {
    const lista = Array.isArray(datos) ? datos : [];
    const total = lista.length;
    const evaluados = lista.filter(d => d.estado === 'Evaluado').length;
    const promedio = lista.reduce((acc, val) => acc + (val.puntaje || 0), 0) / (total || 1);

    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Reporte: Padrón General de Proveedores</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-md text-center">
            <span className="block text-xs font-bold text-slate-500 uppercase">Total Proveedores</span>
            <span className="block text-2xl font-bold text-slate-900">{total}</span>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-md text-center">
            <span className="block text-xs font-bold text-slate-500 uppercase">Evaluados</span>
            <span className="block text-2xl font-bold text-slate-900">{evaluados}</span>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-md text-center">
            <span className="block text-xs font-bold text-slate-500 uppercase">Promedio ESG</span>
            <span className="block text-2xl font-bold text-slate-900">{promedio.toFixed(1)} / 100</span>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="py-2 px-3 text-left font-bold text-slate-700">RUC</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Razón Social</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Unidad</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Estado</th>
              <th className="py-2 px-3 text-right font-bold text-slate-700">Puntaje</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-2 px-3">{item.ruc || 'N/A'}</td>
                <td className="py-2 px-3 font-medium">{item.razonSocial || 'N/A'}</td>
                <td className="py-2 px-3">{item.unidad || 'N/A'}</td>
                <td className="py-2 px-3">{item.estado || 'N/A'}</td>
                <td className="py-2 px-3 text-right">{item.puntaje || 0}</td>
                <td className="py-2 px-3">{item.nivel || 'N/A'}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">No hay datos disponibles para el padrón general.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarMatrizCriticidad = () => {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Reporte: Matriz de Criticidad</h2>
        <p className="text-sm text-slate-600 mb-6">Evaluación de proveedores de alto impacto en las 7 unidades operativas, clasificando el nivel de riesgo y los planes de acción requeridos.</p>
        
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="py-2 px-3 text-left font-bold text-slate-700">Proveedor</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Riesgo ESG</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Impacto Operativo</th>
              <th className="py-2 px-3 text-left font-bold text-slate-700">Plan de Acción Requerido</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(datos) && datos.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-2 px-3 font-medium">{item.razonSocial || 'N/A'}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.riesgo === 'Alto' ? 'bg-red-100 text-red-800' : item.riesgo === 'Medio' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {item.riesgo || 'N/A'}
                  </span>
                </td>
                <td className="py-2 px-3">{item.impacto || 'N/A'}</td>
                <td className="py-2 px-3">{item.plan || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarCumplimientoUnidades = () => {
    const unidades = ['Supermercados Peruanos', 'Promart', 'Oechsle', 'Real Plaza', 'Farmacias Peruanas', 'SIP', 'Sucursal China'];
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Reporte: Cumplimiento por Unidades de Negocio</h2>
        <div className="space-y-6">
          {unidades.map((unidad, idx) => {
            const avance = Math.floor(Math.random() * 40) + 60;
            return (
              <div key={idx} className="border border-slate-200 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700">{unidad}</h3>
                  <span className="text-sm font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">{avance}% Cumplimiento</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-slate-800 h-3 rounded-full" style={{ width: `${avance}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>Metas de proveedores críticos: En progreso</span>
                  <span>Estado: {avance >= 80 ? 'Óptimo' : 'Requiere Atención'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderizarCertificadoIndividual = () => {
    const p = proveedorSeleccionado || datos || {};
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    const codigoCertificado = `CERT-ESG-2026-${numeroAleatorio}`;
    const hash = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');

    return (
      <div className="border-4 border-double border-slate-800 p-8 rounded-lg relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">CERTIFICADO DE HOMOLOGACIÓN</h2>
          <p className="text-lg font-bold text-slate-600 mt-2">HOMOLOGACIÓN SOSTENIBLE 2026</p>
          <p className="text-sm text-slate-500 mt-1">Código: {codigoCertificado}</p>
        </div>

        <div className="mb-10 text-center">
          <p className="text-slate-600 mb-2">Otorgado a la entidad comercial:</p>
          <h3 className="text-2xl font-bold text-slate-800 uppercase">{p.razonSocial || 'NOMBRE DEL PROVEEDOR'}</h3>
          <p className="text-slate-500 font-mono mt-1">RUC: {p.ruc || '00000000000'}</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="bg-slate-800 text-white p-6 rounded-lg text-center shadow-lg min-w-[250px]">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Puntaje Global</p>
            <p className="text-5xl font-extrabold my-2">{p.puntaje || 85}</p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Nivel: {p.nivel || 'Avanzado'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-12">
          {['Ambiental', 'Social', 'Ética', 'Laboral', 'Cadena de Suministro'].map((dim, i) => (
            <div key={i} className="flex justify-between items-center border-b border-slate-300 pb-2">
              <span className="font-semibold text-slate-700">{dim}</span>
              <span className="font-bold text-slate-900">{Math.floor(Math.random() * 20) + 80} / 100</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-300">
          <div className="text-center">
            <div className="w-48 h-16 border-b border-slate-800 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800 text-sm">Gerencia de Sostenibilidad</p>
            <p className="text-xs text-slate-500">Intercorp Retail</p>
          </div>
          <div className="text-center">
            <div className="w-48 h-16 border-b border-slate-800 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800 text-sm">Auditoría de Cumplimiento</p>
            <p className="text-xs text-slate-500">Evaluación Independiente</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] text-slate-400 font-mono break-all">
          Hash criptográfico: {hash}
        </div>
      </div>
    );
  };

  const renderizarBitacoraAuditoria = () => {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Reporte: Bitácora de Auditoría Forense</h2>
        <p className="text-sm text-slate-600 mb-6">Registro detallado de eventos del sistema conforme a los principios de trazabilidad y mínimo privilegio.</p>
        
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="py-2 px-2 text-left font-bold text-slate-700">ID Evento</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Fecha y Hora</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Usuario</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Rol</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Módulo</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Acción</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">IP Origen</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(datos) ? datos.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 font-mono">
                <td className="py-2 px-2">{item.id || `EVT-00${index}`}</td>
                <td className="py-2 px-2">{item.fecha || fechaActual}</td>
                <td className="py-2 px-2">{item.usuario || 'sysadmin'}</td>
                <td className="py-2 px-2">{item.rol || 'Administrador'}</td>
                <td className="py-2 px-2">{item.modulo || 'Autenticación'}</td>
                <td className="py-2 px-2">{item.accion || 'Ingreso exitoso'}</td>
                <td className="py-2 px-2">{item.ip || '192.168.1.100'}</td>
                <td className="py-2 px-2">
                  <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded uppercase font-bold text-[10px]">OK</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="py-4 text-center">No hay registros forenses.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarAnalisisBrechas = () => {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Reporte: Análisis de Brechas y Diagnóstico</h2>
        
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
          <h3 className="text-red-800 font-bold mb-2">Alertas Criticas: Dimensiones &lt; 60 puntos</h3>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            <li>Dimensión Ambiental: Gestión de Emisiones de Carbono (Puntaje: 45/100)</li>
            <li>Cadena de Suministro: Trazabilidad de Materias Primas (Puntaje: 52/100)</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="border border-slate-200 rounded-md p-4">
            <h4 className="font-bold text-slate-800 mb-2">Planes de Acción Prioritarios</h4>
            <p className="text-sm text-slate-600 mb-2">Implementar sistema de medición de huella de carbono de alcance 3 antes del tercer trimestre.</p>
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">Prioridad Alta</span>
          </div>
          <div className="border border-slate-200 rounded-md p-4">
            <h4 className="font-bold text-slate-800 mb-2">Recomendaciones Técnicas</h4>
            <p className="text-sm text-slate-600 mb-2">Adoptar marco de trabajo estandarizado para la debida diligencia de derechos humanos en la cadena de valor extendida.</p>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Prioridad Media</span>
          </div>
        </div>
      </div>
    );
  };

  const renderizarContenido = () => {
    switch (tipoReporte) {
      case 'padron_general': return renderizarPadronGeneral();
      case 'matriz_criticidad': return renderizarMatrizCriticidad();
      case 'cumplimiento_unidades': return renderizarCumplimientoUnidades();
      case 'certificado_individual': return renderizarCertificadoIndividual();
      case 'bitacora_auditoria': return renderizarBitacoraAuditoria();
      case 'analisis_brechas': return renderizarAnalisisBrechas();
      default: return <p>Tipo de reporte no reconocido.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:block">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .no-imprimir { display: none !important; }
        }
      `}</style>
      
      <div className="max-w-4xl w-full bg-white text-slate-900 shadow-2xl rounded-lg p-8 sm:p-12 my-6 font-sans border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:rounded-none">
        
        <div className="no-imprimir flex justify-end gap-3 mb-6 pb-4 border-b border-slate-200">
          <button 
            onClick={imprimir}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md font-medium hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Imprimir o Guardar PDF
          </button>
          <button 
            onClick={alCerrar}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-md font-medium hover:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            Cerrar
          </button>
        </div>

        {tipoReporte !== 'certificado_individual' && renderizarEncabezado()}
        
        <div className="min-h-[500px]">
          {renderizarContenido()}
        </div>

        {tipoReporte !== 'certificado_individual' && renderizarPiePagina()}

      </div>
    </div>
  );
};

export default VisorReportePdf;
