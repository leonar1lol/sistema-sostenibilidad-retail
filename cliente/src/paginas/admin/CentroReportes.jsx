import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BarChart3,
  Search,
  Award,
  History,
  Layers,
  Calendar,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  exportarPadronGeneralExcel,
  exportarMatrizCriticidadExcel,
  exportarCumplimientoUnidadesExcel,
  exportarCertificadoIndividualExcel,
  exportarBitacoraAuditoriaExcel,
  exportarAnalisisBrechasExcel
} from '../../utilidades/generadorReportesExcel.js';
import VisorReportePdf from '../../componentes/VisorReportePdf.jsx';
import { listarAuditoriaApi } from '../../servicios/servicioApi.js';

export default function CentroReportes({ proveedores = [], unidades = [] }) {
  const [unidadFiltro, setUnidadFiltro] = useState('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [proveedorCertificadoId, setProveedorCertificadoId] = useState('');
  const [notificacion, setNotificacion] = useState('');
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [tipoReporteActivo, setTipoReporteActivo] = useState(null);
  const [datosReporteActivo, setDatosReporteActivo] = useState(null);
  const [proveedorSeleccionadoPdf, setProveedorSeleccionadoPdf] = useState(null);
  const [registrosAuditoria, setRegistrosAuditoria] = useState([]);

  useEffect(() => {
    cargarAuditoria();
  }, []);

  useEffect(() => {
    if (proveedores.length > 0 && !proveedorCertificadoId) {
      const primerEvaluado = proveedores.find(p => (p.estadoEvaluacion || p.estadoHomologacion) === 'Finalizado') || proveedores[0];
      setProveedorCertificadoId(primerEvaluado?.id || primerEvaluado?.ruc || '');
    }
  }, [proveedores, proveedorCertificadoId]);

  const cargarAuditoria = async () => {
    try {
      const datos = await listarAuditoriaApi();
      setRegistrosAuditoria(Array.isArray(datos) ? datos : []);
    } catch {
      setRegistrosAuditoria([]);
    }
  };

  const listaNombresUnidades = unidades.map(u => (typeof u === 'string' ? u : u.nombre || u.nombreUnidad)).filter(Boolean);

  const proveedoresFiltrados = proveedores.filter(p => {
    const unidadP = p.unidad || p.unidadNegocio || '';
    const estadoP = p.estadoEvaluacion || p.estadoHomologacion || 'Pendiente';
    const coincideUnidad = unidadFiltro === 'Todas' || unidadP === unidadFiltro;
    const coincideEstado = estadoFiltro === 'Todos' || estadoP === estadoFiltro;
    const coincideBusqueda = (p.razonSocial || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                             (p.ruc || '').includes(busqueda) ||
                             (p.nombreComercial || '').toLowerCase().includes(busqueda.toLowerCase());
    return coincideUnidad && coincideEstado && coincideBusqueda;
  });

  const mostrarMensajeNotificacion = (mensaje) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(''), 3500);
  };

  const ejecutarExportacionExcel = (codigo) => {
    try {
      if (codigo === 'REP-01') {
        exportarPadronGeneralExcel(proveedoresFiltrados, { unidad: unidadFiltro });
        mostrarMensajeNotificacion('Padrón General descargado exitosamente en formato Excel.');
      } else if (codigo === 'REP-02') {
        const criticos = proveedoresFiltrados.filter(p => p.esCritico);
        exportarMatrizCriticidadExcel(criticos.length > 0 ? criticos : proveedoresFiltrados);
        mostrarMensajeNotificacion('Matriz de Criticidad descargada exitosamente en formato Excel.');
      } else if (codigo === 'REP-03') {
        const unidadesConMetricas = unidades.map(u => {
          const nombreU = typeof u === 'string' ? u : u.nombre;
          const provsU = proveedores.filter(p => (p.unidad || p.unidadNegocio) === nombreU);
          const evaluados = provsU.filter(p => (p.estadoEvaluacion || p.estadoHomologacion) === 'Finalizado').length;
          const total = provsU.length;
          const suma = provsU.reduce((acc, p) => acc + Number(p.puntajeTotal || 0), 0);
          return {
            nombreUnidad: nombreU,
            responsable: typeof u === 'object' ? u.responsable || 'Jefatura de Sostenibilidad' : 'Jefatura de Sostenibilidad',
            metaProveedores: total,
            evaluacionesConcretadas: evaluados,
            porcentajeCumplimiento: total > 0 ? `${Math.round((evaluados / total) * 100)}%` : '0%',
            promedioPuntaje: evaluados > 0 ? Math.round(suma / evaluados) : '75',
            estadoMeta: total > 0 && (evaluados / total) >= 0.8 ? 'Cumplida' : 'En progreso'
          };
        });
        exportarCumplimientoUnidadesExcel(unidadesConMetricas, { metaGlobal: '100% de proveedores críticos evaluados' });
        mostrarMensajeNotificacion('Cumplimiento por Unidades descargado exitosamente en formato Excel.');
      } else if (codigo === 'REP-04') {
        const proveedorSel = proveedores.find(p => (p.id || p.ruc) === proveedorCertificadoId) || proveedores[0];
        if (!proveedorSel) {
          mostrarMensajeNotificacion('Seleccione un proveedor para emitir su expediente.');
          return;
        }
        exportarCertificadoIndividualExcel(proveedorSel, {
          puntajeTotal: proveedorSel.puntajeTotal || 85,
          nivel: proveedorSel.nivel || (Number(proveedorSel.puntajeTotal || 85) >= 75 ? 'Avanzado' : 'Intermedio'),
          dimensiones: proveedorSel.dimensiones
        });
        mostrarMensajeNotificacion(`Expediente de ${proveedorSel.razonSocial} descargado en Excel.`);
      } else if (codigo === 'REP-05') {
        exportarBitacoraAuditoriaExcel(registrosAuditoria);
        mostrarMensajeNotificacion('Bitácora Forense descargada exitosamente en formato Excel.');
      } else if (codigo === 'REP-06') {
        exportarAnalisisBrechasExcel(proveedoresFiltrados);
        mostrarMensajeNotificacion('Diagnóstico de Brechas ESG descargado exitosamente en formato Excel.');
      }
    } catch {
      mostrarMensajeNotificacion('Ocurrió un inconveniente al generar el archivo Excel.');
    }
  };

  const ejecutarPrevisualizacionPdf = (codigo) => {
    if (codigo === 'REP-01') {
      const datosMapeados = proveedoresFiltrados.map(p => ({
        ruc: p.ruc,
        razonSocial: p.razonSocial,
        unidad: p.unidad || p.unidadNegocio || 'General',
        estado: (p.estadoEvaluacion || p.estadoHomologacion) === 'Finalizado' ? 'Evaluado' : (p.estadoEvaluacion || 'Pendiente'),
        puntaje: Number(p.puntajeTotal || 0),
        nivel: p.nivel || (Number(p.puntajeTotal || 0) >= 75 ? 'Avanzado' : Number(p.puntajeTotal || 0) >= 60 ? 'Intermedio' : 'Inicial')
      }));
      setTipoReporteActivo('padron_general');
      setDatosReporteActivo(datosMapeados);
      setProveedorSeleccionadoPdf(null);
      setVisorAbierto(true);
    } else if (codigo === 'REP-02') {
      const criticos = proveedoresFiltrados.filter(p => p.esCritico);
      const fuente = criticos.length > 0 ? criticos : proveedoresFiltrados;
      const datosMapeados = fuente.map(p => {
        const puntaje = Number(p.puntajeTotal || 0);
        const riesgo = puntaje >= 75 ? 'Bajo' : puntaje >= 60 ? 'Medio' : 'Alto';
        return {
          razonSocial: `${p.razonSocial} (${p.unidad || 'General'})`,
          riesgo,
          impacto: p.esCritico ? 'Crítico - Continuidad operativa' : 'Medio - Cadena logística',
          plan: riesgo === 'Alto' ? 'Auditoría presencial inmediata en 30 días' : riesgo === 'Medio' ? 'Revisión semestral y capacitación' : 'Vigencia aprobada anual'
        };
      });
      setTipoReporteActivo('matriz_criticidad');
      setDatosReporteActivo(datosMapeados);
      setProveedorSeleccionadoPdf(null);
      setVisorAbierto(true);
    } else if (codigo === 'REP-03') {
      setTipoReporteActivo('cumplimiento_unidades');
      setDatosReporteActivo(unidades);
      setProveedorSeleccionadoPdf(null);
      setVisorAbierto(true);
    } else if (codigo === 'REP-04') {
      const proveedorSel = proveedores.find(p => (p.id || p.ruc) === proveedorCertificadoId) || proveedores[0];
      if (!proveedorSel) {
        mostrarMensajeNotificacion('Por favor elija un proveedor de la lista.');
        return;
      }
      setTipoReporteActivo('certificado_individual');
      setDatosReporteActivo({
        ...proveedorSel,
        puntaje: proveedorSel.puntajeTotal || 85,
        nivel: proveedorSel.nivel || (Number(proveedorSel.puntajeTotal || 85) >= 75 ? 'Avanzado' : 'Intermedio')
      });
      setProveedorSeleccionadoPdf(proveedorSel);
      setVisorAbierto(true);
    } else if (codigo === 'REP-05') {
      const datosMapeados = registrosAuditoria.map((reg, idx) => ({
        id: reg.idEvento || reg.id || `AUD-00${idx + 1}`,
        fecha: reg.fechaHora || reg.fecha || new Date().toLocaleDateString('es-PE'),
        usuario: reg.usuario || reg.correo || 'admin@intercorpretail.pe',
        rol: reg.rol || 'Administrador',
        modulo: reg.modulo || 'Seguridad',
        accion: reg.accion || 'Operación registrada',
        ip: reg.direccionIp || reg.ip || '10.0.4.12',
        estado: 'OK'
      }));
      setTipoReporteActivo('bitacora_auditoria');
      setDatosReporteActivo(datosMapeados);
      setProveedorSeleccionadoPdf(null);
      setVisorAbierto(true);
    } else if (codigo === 'REP-06') {
      setTipoReporteActivo('analisis_brechas');
      setDatosReporteActivo(proveedoresFiltrados);
      setProveedorSeleccionadoPdf(null);
      setVisorAbierto(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-3 backdrop-blur-sm border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Módulo de Emisión Oficial • Requerimiento RF13</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Centro Corporativo de Reportes y Auditoría ESG
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Generación de informes formales y certificados de sostenibilidad en formatos PDF y Excel para la Dirección de Intercorp Retail y sus 7 unidades operativas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-4 py-3 text-center">
              <span className="block text-2xl font-bold text-white">6</span>
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Reportes Oficiales</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-4 py-3 text-center">
              <span className="block text-2xl font-bold text-emerald-400">{proveedoresFiltrados.length}</span>
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Proveedores Filtrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="superficie-tarjeta rounded-lg-token p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por RUC, razón social o nombre comercial..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="campo-entrada campo-entrada-icono w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-plataformaSecundario" />
            <select
              value={unidadFiltro}
              onChange={(e) => setUnidadFiltro(e.target.value)}
              className="campo-select min-w-[200px]"
            >
              <option value="Todas">Todas las Unidades (7)</option>
              {listaNombresUnidades.map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </div>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="campo-select min-w-[170px]"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Finalizado">Finalizado</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <TarjetaReporte
          codigo="REP-01"
          titulo="Padrón General de Proveedores y Homologación"
          descripcion="Directorio maestro de proveedores con RUC, razón social, unidad, estado de avance, puntaje ESG y nivel obtenido."
          icono={<Building2 className="w-6 h-6 text-blue-600" />}
          alExportarExcel={() => ejecutarExportacionExcel('REP-01')}
          alExportarPdf={() => ejecutarPrevisualizacionPdf('REP-01')}
        />

        <TarjetaReporte
          codigo="REP-02"
          titulo="Matriz de Criticidad y Debida Diligencia"
          descripcion="Evaluación de proveedores de alto impacto en las 7 unidades, con matriz de riesgo ESG y planes de acción requeridos."
          icono={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          alExportarExcel={() => ejecutarExportacionExcel('REP-02')}
          alExportarPdf={() => ejecutarPrevisualizacionPdf('REP-02')}
        />

        <TarjetaReporte
          codigo="REP-03"
          titulo="Cumplimiento y Metas por Unidad de Negocio"
          descripcion="Métricas comparativas de Supermercados Peruanos, Promart, Oechsle, Real Plaza, Farmacias Peruanas, SIP y Sucursal China."
          icono={<BarChart3 className="w-6 h-6 text-emerald-600" />}
          alExportarExcel={() => ejecutarExportacionExcel('REP-03')}
          alExportarPdf={() => ejecutarPrevisualizacionPdf('REP-03')}
        />

        <div className="superficie-tarjeta rounded-lg-token p-6 flex flex-col justify-between hover:shadow-md transition-shadow border border-indigo-100">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">REP-04</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">EXCEL</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">PDF</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-plataformaTexto mb-1.5">
              Certificado Oficial de Homologación Individual
            </h3>
            <p className="text-xs text-plataformaSecundario mb-4 leading-relaxed">
              Ficha oficial con membrete corporativo, sello de homologación, radar de las 5 dimensiones ESG, código único y firmas de auditoría.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-plataformaSecundario mb-1.5 block">
                Seleccione el proveedor:
              </label>
              <select
                value={proveedorCertificadoId}
                onChange={(e) => setProveedorCertificadoId(e.target.value)}
                className="campo-select w-full text-xs"
              >
                {proveedoresFiltrados.map(p => (
                  <option key={p.id || p.ruc} value={p.id || p.ruc}>
                    {p.razonSocial} — RUC {p.ruc} ({p.unidad || 'General'})
                  </option>
                ))}
                {proveedoresFiltrados.length === 0 && (
                  <option value="">No hay proveedores en el filtro</option>
                )}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => ejecutarExportacionExcel('REP-04')}
              className="boton-secundario text-xs flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => ejecutarPrevisualizacionPdf('REP-04')}
              className="boton-primario text-xs flex items-center gap-1.5 cursor-pointer py-1.5 px-3.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ver Certificado PDF</span>
            </button>
          </div>
        </div>

        <TarjetaReporte
          codigo="REP-05"
          titulo="Bitácora Forense de Seguridad y Trazabilidad"
          descripcion="Trazabilidad inmutable de eventos, autenticación de usuarios, roles RBAC y accesos de seguridad conforme a lineamientos UTP."
          icono={<History className="w-6 h-6 text-purple-600" />}
          alExportarExcel={() => ejecutarExportacionExcel('REP-05')}
          alExportarPdf={() => ejecutarPrevisualizacionPdf('REP-05')}
        />

        <TarjetaReporte
          codigo="REP-06"
          titulo="Análisis de Brechas y Diagnóstico ESG"
          descripcion="Detección de dimensiones con puntajes por debajo del umbral corporativo (60 puntos) y planes de mitigación prioritarios."
          icono={<Layers className="w-6 h-6 text-teal-600" />}
          alExportarExcel={() => ejecutarExportacionExcel('REP-06')}
          alExportarPdf={() => ejecutarPrevisualizacionPdf('REP-06')}
        />
      </div>

      {visorAbierto && (
        <VisorReportePdf
          tipoReporte={tipoReporteActivo}
          datos={datosReporteActivo}
          proveedorSeleccionado={proveedorSeleccionadoPdf}
          alCerrar={() => setVisorAbierto(false)}
        />
      )}

      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{notificacion}</span>
        </div>
      )}
    </div>
  );
}

function TarjetaReporte({ codigo, titulo, descripcion, icono, alExportarExcel, alExportarPdf }) {
  return (
    <div className="superficie-tarjeta rounded-lg-token p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-black/[0.03] border border-black/[0.06] flex items-center justify-center">
            {icono}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/[0.05] text-slate-700 font-mono">{codigo}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">EXCEL</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">PDF</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-plataformaTexto mb-1.5">
          {titulo}
        </h3>
        <p className="text-xs text-plataformaSecundario mb-4 leading-relaxed">
          {descripcion}
        </p>
      </div>

      <div className="pt-4 border-t border-black/[0.06] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={alExportarExcel}
          className="boton-secundario text-xs flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel</span>
        </button>
        <button
          type="button"
          onClick={alExportarPdf}
          className="boton-secundario text-xs flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
        >
          <Printer className="w-3.5 h-3.5 text-rose-600" />
          <span>Ver PDF</span>
        </button>
      </div>
    </div>
  );
}
