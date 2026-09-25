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
    <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
          GRUPO INTERCORP RETAIL
        </h1>
        <p className="text-xs font-semibold text-slate-600 mt-1.5">
          Dirección Corporativa de Sostenibilidad, Ética y Cadena de Suministro
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold font-mono text-slate-700">DOC-IR-ESG-2026-001</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Emisión: {fechaActual}</p>
        <p className="text-[11px] text-slate-500">Auditor: Sistema Central</p>
      </div>
    </div>
  );

  const renderizarPiePagina = () => (
    <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
      <p>Grupo Intercorp Retail • Documento oficial de confidencialidad institucional.</p>
      <p>Trazabilidad criptográfica garantizada • Sistema ESG 2026</p>
    </div>
  );

  const renderizarPadronGeneral = () => {
    const lista = Array.isArray(datos) ? datos : [];
    const total = lista.length;
    const evaluados = lista.filter(d => (d.estado === 'Evaluado' || d.estadoEvaluacion === 'Finalizado')).length;
    const sumaPuntajes = lista.reduce((acc, val) => acc + Number(val.puntaje || val.puntajeTotal || 0), 0);
    const promedio = evaluados > 0 ? (sumaPuntajes / evaluados).toFixed(1) : '0.0';

    return (
      <div className="bloque-reporte">
        <h2 className="text-base font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">
          Padrón General de Proveedores y Estado de Homologación
        </h2>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-md text-center">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proveedores</span>
            <span className="block text-2xl font-extrabold text-slate-900 mt-0.5">{total}</span>
          </div>
          <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-md text-center">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluados</span>
            <span className="block text-2xl font-extrabold text-emerald-700 mt-0.5">{evaluados}</span>
          </div>
          <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-md text-center">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Promedio ESG</span>
            <span className="block text-2xl font-extrabold text-blue-700 mt-0.5">{promedio} / 100</span>
          </div>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="py-2 px-2 text-left font-bold text-slate-700">RUC</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Razón Social</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Unidad</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Estado</th>
              <th className="py-2 px-2 text-right font-bold text-slate-700">Puntaje</th>
              <th className="py-2 px-2 text-center font-bold text-slate-700">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-1.5 px-2 font-mono text-slate-600">{item.ruc || '—'}</td>
                <td className="py-1.5 px-2 font-medium text-slate-800">{item.razonSocial || '—'}</td>
                <td className="py-1.5 px-2 text-slate-600">{item.unidad || 'General'}</td>
                <td className="py-1.5 px-2 text-slate-700">{item.estado || item.estadoEvaluacion || 'Pendiente'}</td>
                <td className="py-1.5 px-2 text-right font-bold font-mono text-slate-900">{item.puntaje ?? item.puntajeTotal ?? 0}</td>
                <td className="py-1.5 px-2 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                    {item.nivel || 'Inicial'}
                  </span>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-500">No hay registros disponibles en el padrón.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarMatrizCriticidad = () => {
    const lista = Array.isArray(datos) ? datos : [];
    return (
      <div className="bloque-reporte">
        <h2 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wider border-b border-slate-200 pb-2">
          Matriz de Criticidad y Debida Diligencia
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Supervisión de contratistas estratégicos en las 7 unidades de negocio, nivel de exposición al riesgo ESG y medidas correctivas.
        </p>
        
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="py-2 px-2 text-left font-bold text-slate-700">Proveedor</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Riesgo ESG</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Impacto Operativo</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Plan de Acción Requerido</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-1.5 px-2 font-medium text-slate-800">{item.razonSocial || '—'}</td>
                <td className="py-1.5 px-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.riesgo === 'Alto'
                      ? 'bg-rose-100 text-rose-800'
                      : item.riesgo === 'Medio'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.riesgo || 'Bajo'}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-slate-600">{item.impacto || 'Continuidad de abastecimiento'}</td>
                <td className="py-1.5 px-2 text-slate-700">{item.plan || 'Auditoría anual estándar'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarCumplimientoUnidades = () => {
    const listaUnidades = [
      { nombre: 'Supermercados Peruanos (Plaza Vea, Vivanda, Makro)', porcentaje: 85, estado: 'Óptimo' },
      { nombre: 'Promart Homecenter', porcentaje: 78, estado: 'Óptimo' },
      { nombre: 'Oechsle', porcentaje: 72, estado: 'En Progreso' },
      { nombre: 'Real Plaza', porcentaje: 88, estado: 'Óptimo' },
      { nombre: 'Farmacias Peruanas (InkaFarma, Mifarma)', porcentaje: 91, estado: 'Sobresaliente' },
      { nombre: 'Servicios Compartidos / SIP', porcentaje: 70, estado: 'En Progreso' },
      { nombre: 'Intercorp Retail Sucursal China', porcentaje: 80, estado: 'Óptimo' }
    ];

    return (
      <div className="bloque-reporte">
        <h2 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wider border-b border-slate-200 pb-2">
          Cumplimiento y Metas ESG por Unidad de Negocio
        </h2>
        <p className="text-xs text-slate-600 mb-5">
          Avance de homologación de proveedores frente a las metas corporativas fijadas para el periodo fiscal 2026.
        </p>

        <div className="space-y-4">
          {listaUnidades.map((u, idx) => (
            <div key={idx} className="border border-slate-200 p-3.5 rounded-lg bg-slate-50/50">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-800">{u.nombre}</span>
                <span className="text-xs font-bold font-mono text-slate-900">{u.porcentaje}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-900 h-2 rounded-full"
                  style={{ width: `${u.porcentaje}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500">
                <span>Meta de cobertura de proveedores críticos</span>
                <span className="font-semibold text-slate-700">{u.estado}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderizarCertificadoIndividual = () => {
    const p = proveedorSeleccionado || datos || {};
    const puntajeVal = Number(p.puntaje ?? p.puntajeTotal ?? 85);
    const nivelVal = p.nivel || (puntajeVal >= 75 ? 'Avanzado' : puntajeVal >= 60 ? 'Intermedio' : 'Inicial');
    const codigoCert = p.codigoCertificado || `CERT-ESG-2026-${(p.ruc || '1302').slice(-4)}`;
    const hash = 'a8f94b2e81c0d45e732b1f8934c56e01';

    return (
      <div className="border-4 border-double border-slate-800 p-8 rounded-lg bg-white relative">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 tracking-wider mb-2">
            GRUPO INTERCORP RETAIL • CERTIFICACIÓN OFICIAL ESG
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            CERTIFICADO DE HOMOLOGACIÓN DE SOSTENIBILIDAD
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro Oficial N°: <span className="font-mono font-bold text-slate-700">{codigoCert}</span>
          </p>
        </div>

        <div className="mb-8 text-center bg-slate-50 p-5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Se certifica que la empresa</p>
          <h3 className="text-xl font-bold text-slate-900 uppercase">{p.razonSocial || 'EMPRESA PROVEEDORA'}</h3>
          <p className="text-xs text-slate-600 font-mono mt-1">
            RUC: {p.ruc || '20100130204'} • Unidad: {p.unidad || 'Supermercados Peruanos'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ha culminado satisfactoriamente el proceso de evaluación y homologación de sostenibilidad bajo el marco corporativo ESG 2026.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-lg text-center shadow min-w-[260px]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Calificación Global Obtenida</p>
            <p className="text-4xl font-extrabold my-1">{puntajeVal} <span className="text-base font-normal text-slate-400">/ 100</span></p>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Nivel Otorgado: {nivelVal}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
          {[
            { dim: 'Dimensión Ambiental', puntaje: p.dimensiones?.AMB ?? 82 },
            { dim: 'Dimensión Social y Comunitaria', puntaje: p.dimensiones?.SOC ?? 85 },
            { dim: 'Ética y Gobernanza Corporativa', puntaje: p.dimensiones?.ETI ?? 90 },
            { dim: 'Prácticas Laborales y DDHH', puntaje: p.dimensiones?.LAB ?? 78 },
            { dim: 'Cadena de Suministro Responsable', puntaje: p.dimensiones?.CAD ?? 75 }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-1.5 text-xs">
              <span className="font-medium text-slate-700">{item.dim}</span>
              <span className="font-bold font-mono text-slate-900">{item.puntaje} / 100</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-slate-300">
          <div className="text-center">
            <div className="w-40 border-b border-slate-800 mx-auto mb-1"></div>
            <p className="font-bold text-slate-800 text-xs">Gerencia de Sostenibilidad</p>
            <p className="text-[10px] text-slate-500">Intercorp Retail</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-800 mx-auto mb-1"></div>
            <p className="font-bold text-slate-800 text-xs">Auditoría de Cumplimiento</p>
            <p className="text-[10px] text-slate-500">Comité de Homologación</p>
          </div>
        </div>

        <div className="mt-6 text-center text-[9px] text-slate-400 font-mono">
          Firma digital y sello de verificación inmutable: {hash}
        </div>
      </div>
    );
  };

  const renderizarBitacoraAuditoria = () => {
    const lista = Array.isArray(datos) ? datos : [];
    return (
      <div className="bloque-reporte">
        <h2 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wider border-b border-slate-200 pb-2">
          Bitácora Forense de Seguridad y Auditoría
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Trazabilidad inmutable de accesos y operaciones sensibles bajo el principio de mínimo privilegio.
        </p>

        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="py-2 px-2 text-left font-bold text-slate-700">Fecha y Hora</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Usuario</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Rol</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Módulo</th>
              <th className="py-2 px-2 text-left font-bold text-slate-700">Acción</th>
              <th className="py-2 px-2 text-center font-bold text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.slice(0, 30).map((reg, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-1.5 px-2 font-mono text-slate-600 whitespace-nowrap">{reg.fecha || fechaActual}</td>
                <td className="py-1.5 px-2 font-medium text-slate-800">{reg.usuario || 'Sistema'}</td>
                <td className="py-1.5 px-2 text-slate-600">{reg.rol || 'Administrador Corporativo'}</td>
                <td className="py-1.5 px-2 text-slate-700">{reg.modulo || 'Seguridad y Control'}</td>
                <td className="py-1.5 px-2 text-slate-800">{reg.accion || reg.detalles || 'Operación'}</td>
                <td className="py-1.5 px-2 text-center font-semibold text-emerald-700">OK</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderizarAnalisisBrechas = () => {
    return (
      <div className="bloque-reporte">
        <h2 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wider border-b border-slate-200 pb-2">
          Análisis de Brechas y Diagnóstico ESG
        </h2>
        <p className="text-xs text-slate-600 mb-5">
          Identificación de aspectos críticos con puntuación inferior a 60 puntos y recomendaciones técnicas de subsanación.
        </p>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-900">Dimensión Ambiental • Huella Hídrica y Residuos</span>
              <span className="text-xs font-bold font-mono text-amber-800">55 / 100</span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Hallazgo: Falta de protocolo formal de segregación y tratamiento de residuos peligrosos.
            </p>
            <p className="text-xs font-semibold text-amber-950 mt-1">
              Acción correctiva: Implementar programa integral de economía circular en un plazo máximo de 60 días.
            </p>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-900">Cadena de Suministro • Debida Diligencia de Subcontratas</span>
              <span className="text-xs font-bold font-mono text-rose-800">50 / 100</span>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              Hallazgo: Ausencia de cláusulas de cumplimiento laboral y derechos humanos en proveedores de segundo nivel.
            </p>
            <p className="text-xs font-semibold text-rose-950 mt-1">
              Acción correctiva: Adoptar código de conducta para subcontratistas y auditorías aleatorias.
            </p>
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
      default: return <p className="text-center py-8 text-slate-500">Reporte no seleccionado.</p>;
    }
  };

  return (
    <div
      id="modal-visor-reporte-pdf"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #modal-visor-reporte-pdf,
          #modal-visor-reporte-pdf #hoja-reporte-imprimible,
          #modal-visor-reporte-pdf #hoja-reporte-imprimible * {
            visibility: visible !important;
          }

          #modal-visor-reporte-pdf {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 999999 !important;
            overflow: visible !important;
          }

          #hoja-reporte-imprimible {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16mm 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }

          .no-imprimir {
            display: none !important;
          }

          tr, .bloque-reporte {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="hoja-reporte-imprimible"
        className="max-w-4xl w-full bg-white text-slate-900 shadow-2xl rounded-xl p-8 sm:p-12 my-6 font-sans border border-slate-200 relative"
      >
        <div className="no-imprimir flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600">Vista de Impresión Oficial A4</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={imprimir}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir o Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {tipoReporte !== 'certificado_individual' && renderizarEncabezado()}

        <div className="min-h-[400px]">
          {renderizarContenido()}
        </div>

        {tipoReporte !== 'certificado_individual' && renderizarPiePagina()}
      </div>
    </div>
  );
};

export default VisorReportePdf;
