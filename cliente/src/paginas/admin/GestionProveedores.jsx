import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ShieldAlert,
  Plus,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet,
  AlertCircle,
  Paperclip,
  Download,
  RotateCcw,
  Eye,
  Building,
  Award,
  Globe,
  Phone,
  Mail,
  UserCheck,
  FileText
} from 'lucide-react';
import { exportarProveedoresAExcel } from '../../utilidades/exportadorExcel.js';
import {
  listarProveedoresAdminApi,
  crearProveedorAdminApi,
  alternarProveedorCriticoApi,
  listarUnidadesApi,
  listarIndustriasApi,
  listarEvidenciaProveedorAdminApi
} from '../../servicios/servicioApi.js';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';

function EvidenciaFicha({ idProveedor }) {
  const [evidencias, setEvidencias] = useState(null);

  useEffect(() => {
    listarEvidenciaProveedorAdminApi(idProveedor).then(setEvidencias).catch(() => setEvidencias([]));
  }, [idProveedor]);

  if (!evidencias) {
    return <p className="text-subtexto text-plataformaSecundario">Cargando evidencia adjuntada…</p>;
  }
  if (evidencias.length === 0) {
    return (
      <div className="p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04] text-center">
        <Paperclip className="w-5 h-5 mx-auto mb-1 text-plataformaSecundario opacity-40" />
        <p className="text-subtexto text-plataformaSecundario">Este proveedor no ha adjuntado documentos de sustento aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {evidencias.map((ev) => (
        <a
          key={ev.idEvidencia}
          href={ev.urlDescarga}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-subtexto text-plataformaTexto bg-black/[0.02] hover:bg-black/[0.05] border border-black/[0.04] rounded-md-token px-3 py-2 transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5 text-plataformaAzul shrink-0" />
          <span className="truncate flex-1 font-medium">{ev.codigoItem} — {ev.nombreArchivo}</span>
          <Download className="w-3.5 h-3.5 text-plataformaSecundario shrink-0" />
        </a>
      ))}
    </div>
  );
}

export default function GestionProveedores({
  filtroUnidadInicial = 'todas',
  filtroSoloCriticosInicial = false,
  filtroEstadoInicial = 'todos'
}) {
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState(filtroUnidadInicial);
  const [filtroSoloCriticos, setFiltroSoloCriticos] = useState(filtroSoloCriticosInicial);
  const [filtroEstado, setFiltroEstado] = useState(filtroEstadoInicial);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [pestanaModal, setPestanaModal] = useState('esg');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const [nuevoRuc, setNuevoRuc] = useState('');
  const [nuevaRazon, setNuevaRazon] = useState('');
  const [nuevoRepresentante, setNuevoRepresentante] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Retail');
  const [nuevaIdUnidad, setNuevaIdUnidad] = useState('');
  const [nuevaIdIndustria, setNuevaIdIndustria] = useState('');

  useEffect(() => {
    setFiltroUnidad(filtroUnidadInicial);
  }, [filtroUnidadInicial]);

  useEffect(() => {
    setFiltroSoloCriticos(filtroSoloCriticosInicial);
  }, [filtroSoloCriticosInicial]);

  useEffect(() => {
    setFiltroEstado(filtroEstadoInicial);
  }, [filtroEstadoInicial]);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [proveedoresRemotos, unidadesRemotas, industriasRemotas] = await Promise.all([
        listarProveedoresAdminApi(),
        listarUnidadesApi(),
        listarIndustriasApi()
      ]);
      setProveedores(proveedoresRemotos);
      setUnidades(unidadesRemotas);
      setIndustrias(industriasRemotas);
      setNuevaIdUnidad((actual) => actual || String(unidadesRemotas[0]?.idUnidad ?? ''));
      setNuevaIdIndustria((actual) => actual || String(industriasRemotas[0]?.idIndustria ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const hayFiltrosActivos =
    terminoBusqueda.trim() !== '' ||
    filtroUnidad !== 'todas' ||
    filtroSoloCriticos ||
    filtroEstado !== 'todos';

  const limpiarFiltros = () => {
    setTerminoBusqueda('');
    setFiltroUnidad('todas');
    setFiltroSoloCriticos(false);
    setFiltroEstado('todos');
  };

  const proveedoresFiltrados = proveedores.filter((item) => {
    const coincideTexto =
      item.razonSocial.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      item.ruc.includes(terminoBusqueda);
    const coincideUnidad = filtroUnidad === 'todas' || item.unidad === filtroUnidad;
    const coincideCritico = !filtroSoloCriticos || item.esCritico;
    let coincideEstado = true;
    if (filtroEstado === 'Finalizado') {
      coincideEstado = item.estadoEvaluacion === 'Finalizado';
    } else if (filtroEstado === 'En proceso') {
      coincideEstado = item.estadoEvaluacion === 'En proceso' || item.estadoEvaluacion === 'En progreso';
    } else if (filtroEstado === 'Sin evaluacion') {
      coincideEstado = !item.estadoEvaluacion || item.estadoEvaluacion === 'Sin evaluación' || item.estadoEvaluacion === 'Pendiente';
    }
    return coincideTexto && coincideUnidad && coincideCritico && coincideEstado;
  });

  const mostrarAviso = (texto) => {
    setMensajeNotificacion(texto);
    setTimeout(() => setMensajeNotificacion(''), 3000);
  };

  const alternarCritico = async (prov) => {
    try {
      await alternarProveedorCriticoApi(prov.idProveedor, !prov.esCritico);
      await cargarDatos();
      if (proveedorSeleccionado?.idProveedor === prov.idProveedor) {
        setProveedorSeleccionado((prev) => ({ ...prev, esCritico: !prov.esCritico }));
      }
      mostrarAviso('Estado de criticidad actualizado.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const registrarNuevoProveedor = async (e) => {
    e.preventDefault();
    setMensajeError('');
    if (nuevoRuc.length !== 11) {
      setMensajeError('El número de RUC debe contener exactamente 11 dígitos numéricos.');
      return;
    }
    try {
      await crearProveedorAdminApi({
        ruc: nuevoRuc,
        razonSocial: nuevaRazon,
        representante: nuevoRepresentante,
        correo: nuevoCorreo,
        tipo: nuevoTipo,
        idUnidad: Number(nuevaIdUnidad),
        idIndustria: nuevaIdIndustria ? Number(nuevaIdIndustria) : null
      });
      await cargarDatos();
      setMostrarModalNuevo(false);
      setNuevoRuc('');
      setNuevaRazon('');
      setNuevoRepresentante('');
      setNuevoCorreo('');
      mostrarAviso('Proveedor incorporado exitosamente al padrón corporativo.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const obtenerNivelEsg = (puntaje) => {
    if (puntaje === null || puntaje === undefined) return { etiqueta: 'Sin evaluar', clase: 'insignia-neutra' };
    const num = Number(puntaje);
    if (num >= 75) return { etiqueta: 'Nivel Avanzado', clase: 'insignia-exito' };
    if (num >= 60) return { etiqueta: 'Nivel Intermedio', clase: 'insignia-info' };
    return { etiqueta: 'Nivel Inicial', clase: 'insignia-advertencia' };
  };

  return (
    <div className="space-y-6">
      {mensajeNotificacion && (
        <div className="toast-notificacion fixed top-20 right-6 z-50 px-5 py-3 rounded-full text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeNotificacion}</span>
        </div>
      )}

      {mensajeError && (
        <div className="rounded-md-token bg-red-50 border border-red-200/60 p-3 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-etiqueta text-plataformaSecundario block mb-1">
            Gestión de Padrón Corporativo (RF06, RF07)
          </span>
          <h2 className="text-titulo-seccion">
            Directorio de Proveedores
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Administración unificada de proveedores críticos y regulares de las 7 unidades de negocio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportarProveedoresAExcel(proveedoresFiltrados)}
            className="boton-secundario flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar lista ({proveedoresFiltrados.length})</span>
          </button>
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="boton-primario flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Incorporar proveedor</span>
          </button>
        </div>
      </div>

      <div className="superficie-tarjeta rounded-lg-token p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por razón social o RUC..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="campo-entrada campo-entrada-icono w-full pr-8"
            />
            {terminoBusqueda && (
              <button
                type="button"
                onClick={() => setTerminoBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-plataformaSecundario hover:text-plataformaTexto p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={filtroUnidad}
              onChange={(e) => setFiltroUnidad(e.target.value)}
              className="campo-select w-full"
            >
              <option value="todas">Todas las unidades</option>
              {unidades.map((u) => (
                <option key={u.idUnidad} value={u.nombre}>{u.nombre}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="campo-select w-full"
            >
              <option value="todos">Todos los estados</option>
              <option value="Finalizado">Finalizado</option>
              <option value="En proceso">En proceso</option>
              <option value="Sin evaluacion">Sin evaluación</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={() => setFiltroSoloCriticos(!filtroSoloCriticos)}
              className={`w-full flex items-center justify-center gap-1.5 transition-all cursor-pointer h-11 rounded-md-token text-cuerpo-pequeno font-medium ${
                filtroSoloCriticos
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                  : 'boton-secundario'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Solo Críticos</span>
            </button>
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] text-xs">
            <span className="text-plataformaSecundario">
              Filtros activos — Mostrando <strong className="text-plataformaTexto">{proveedoresFiltrados.length}</strong> de <strong className="text-plataformaTexto">{proveedores.length}</strong> proveedores
            </span>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 text-plataformaAzul hover:underline cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer filtros</span>
            </button>
          </div>
        )}
      </div>

      <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla-premium w-full text-left">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>RUC</th>
                <th>Unidad de Negocio</th>
                <th>Industria</th>
                <th className="text-center">Crítico</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Puntaje ESG</th>
                <th className="text-right">Ficha</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-plataformaSecundario">
                    Cargando datos reales desde el servidor…
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="estado-vacio py-12 text-center text-plataformaSecundario flex flex-col items-center">
                      <Search className="w-8 h-8 mb-3 opacity-50" />
                      <span>No se encontraron proveedores que coincidan con los criterios de búsqueda.</span>
                      {hayFiltrosActivos && (
                        <button
                          type="button"
                          onClick={limpiarFiltros}
                          className="boton-secundario mt-3 text-xs"
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((prov) => {
                  const nivelEsg = obtenerNivelEsg(prov.puntajeTotal);
                  return (
                    <tr
                      key={prov.idProveedor}
                      onClick={() => setProveedorSeleccionado(prov)}
                      className="cursor-pointer hover:bg-black/[0.015] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-plataformaTexto">{prov.razonSocial}</div>
                        <div className="text-subtexto text-plataformaSecundario">{prov.representante || 'Sin representante registrado'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cuerpo-pequeno text-plataformaSecundario">
                        {prov.ruc}
                      </td>
                      <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaTexto">
                        {prov.unidad}
                      </td>
                      <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">
                        {prov.industria || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alternarCritico(prov);
                          }}
                          title={prov.esCritico ? 'Proveedor Crítico (clic para quitar)' : 'No crítico (clic para marcar)'}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            prov.esCritico
                              ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                              : 'text-black/20 hover:text-amber-500'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {prov.estadoEvaluacion === 'Finalizado' ? (
                          <span className="inline-flex items-center gap-1 insignia-exito">
                            <CheckCircle2 className="w-3 h-3" />
                            Finalizado
                          </span>
                        ) : prov.estadoEvaluacion === 'En proceso' || prov.estadoEvaluacion === 'En progreso' ? (
                          <span className="inline-flex items-center gap-1 insignia-info">
                            <Clock className="w-3 h-3" />
                            En proceso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 insignia-neutra">
                            <Clock className="w-3 h-3" />
                            Sin evaluación
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        {prov.puntajeTotal !== null && prov.puntajeTotal !== undefined ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-plataformaTexto font-bold">
                              {Math.round(Number(prov.puntajeTotal))} pts
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${nivelEsg.clase}`}>
                              {nivelEsg.etiqueta.replace('Nivel ', '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-black/30 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProveedorSeleccionado(prov);
                          }}
                          className="p-1.5 rounded-md-token hover:bg-black/[0.04] text-plataformaAzul inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {proveedorSeleccionado && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <div className="contenido-modal max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-etiqueta text-plataformaAzul font-semibold uppercase tracking-wider">
                    Ficha Técnica de Proveedor
                  </span>
                  {proveedorSeleccionado.esCritico && (
                    <span className="insignia-advertencia inline-flex items-center gap-1 text-[10px]">
                      <ShieldAlert className="w-3 h-3" /> Crítico
                    </span>
                  )}
                </div>
                <h3 className="text-titulo-seccion mt-1 text-plataformaTexto">
                  {proveedorSeleccionado.razonSocial}
                </h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario">
                  RUC: <span className="font-mono font-semibold">{proveedorSeleccionado.ruc}</span> • Unidad: {proveedorSeleccionado.unidad}
                </p>
              </div>
              <button
                onClick={() => setProveedorSeleccionado(null)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-black/[0.06] mt-4 mb-5">
              <button
                type="button"
                onClick={() => setPestanaModal('esg')}
                className={`px-4 py-2 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  pestanaModal === 'esg'
                    ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                    : 'text-plataformaSecundario hover:text-plataformaTexto'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Desempeño ESG y Evidencias</span>
              </button>
              <button
                type="button"
                onClick={() => setPestanaModal('legal')}
                className={`px-4 py-2 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  pestanaModal === 'legal'
                    ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                    : 'text-plataformaSecundario hover:text-plataformaTexto'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Ficha Corporativa y Legal</span>
              </button>
            </div>

            {pestanaModal === 'esg' ? (
              <div className="space-y-5">
                <div className="p-4 rounded-lg-token bg-black/[0.02] border border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-etiqueta text-plataformaSecundario block mb-1">
                      Calificación Global Homologada
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-extrabold font-mono text-plataformaTexto">
                        {proveedorSeleccionado.puntajeTotal !== null && proveedorSeleccionado.puntajeTotal !== undefined
                          ? Math.round(Number(proveedorSeleccionado.puntajeTotal))
                          : '--'}
                      </span>
                      <span className="text-cuerpo-pequeno text-plataformaSecundario">/ 100 puntos</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${obtenerNivelEsg(proveedorSeleccionado.puntajeTotal).clase}`}>
                        {obtenerNivelEsg(proveedorSeleccionado.puntajeTotal).etiqueta}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alternarCritico(proveedorSeleccionado)}
                    className="boton-secundario text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>{proveedorSeleccionado.esCritico ? 'Quitar condición de crítico' : 'Marcar como crítico'}</span>
                  </button>
                </div>

                {proveedorSeleccionado.dimensiones ? (
                  <div>
                    <span className="text-etiqueta text-plataformaSecundario block mb-2 font-semibold">
                      Desglose Ponderado por Dimensión ESG
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(proveedorSeleccionado.dimensiones).map(([codigo, valor]) => {
                        const puntajeDim = Math.round(Number(valor));
                        return (
                          <div key={codigo} className="p-3.5 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-medium text-plataformaTexto">{codigo}</span>
                              <span className="font-mono font-bold text-xs text-plataformaAzul">{puntajeDim}%</span>
                            </div>
                            <BarraProgreso porcentaje={puntajeDim} altura="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-md-token bg-amber-50/50 border border-amber-200/50 text-subtexto text-amber-900">
                    Este proveedor no ha completado el cuestionario de sostenibilidad. Cuando finalice sus respuestas en el portal, el motor de cálculo registrará aquí los porcentajes por dimensión.
                  </div>
                )}

                <div>
                  <span className="text-etiqueta text-plataformaSecundario block mb-2 font-semibold">
                    Evidencias Documentales Adjuntadas (RF25)
                  </span>
                  <EvidenciaFicha idProveedor={proveedorSeleccionado.idProveedor} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-cuerpo-pequeno">
                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Razón Social</span>
                    <span className="font-semibold text-plataformaTexto">{proveedorSeleccionado.razonSocial}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Nombre Comercial</span>
                    <span className="font-semibold text-plataformaTexto">{proveedorSeleccionado.nombreComercial || 'No especificado'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">RUC (Registro Único de Contribuyente)</span>
                    <span className="font-mono font-semibold text-plataformaTexto">{proveedorSeleccionado.ruc}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Tipo de Proveedor</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.tipo || 'Retail'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Dirección Fiscal</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.direccionFiscal || 'No registrada'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Región / Departamento</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.departamento || 'No registrada'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Representante Legal</span>
                    <span className="font-medium text-plataformaTexto">
                      {proveedorSeleccionado.representante || 'No registrado'}
                      {proveedorSeleccionado.cargoRepresentante ? ` (${proveedorSeleccionado.cargoRepresentante})` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Teléfono de Contacto</span>
                    <span className="font-mono font-medium text-plataformaTexto">{proveedorSeleccionado.telefono || 'No registrado'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Correo Electrónico</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.correo || 'No registrado'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Sitio Web Corporativo</span>
                    {proveedorSeleccionado.sitioWeb ? (
                      <a
                        href={proveedorSeleccionado.sitioWeb}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-plataformaAzul hover:underline truncate block"
                      >
                        {proveedorSeleccionado.sitioWeb}
                      </a>
                    ) : (
                      <span className="text-plataformaSecundario">No registrado</span>
                    )}
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Tamaño de Empresa</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.tamanoEmpresa || 'No especificado'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Años de Operación</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.aniosOperacion || 'No especificado'}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Unidad de Negocio Principal</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.unidad}</span>
                  </div>

                  <div className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04]">
                    <span className="text-[11px] text-plataformaSecundario block mb-0.5 font-medium">Industria / Rubro</span>
                    <span className="font-medium text-plataformaTexto">{proveedorSeleccionado.industria || 'General'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-5 mt-5 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setProveedorSeleccionado(null)}
                className="boton-primario"
              >
                Cerrar ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={registrarNuevoProveedor} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Nuevo Registro
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  Incorporar Proveedor
                </h3>
                <p className="text-subtexto text-plataformaSecundario mt-0.5">
                  Registro para homologación y auditoría de sostenibilidad
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">RUC (11 dígitos numéricos) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  placeholder="Ej: 20100130204"
                  maxLength={11}
                  value={nuevoRuc}
                  onChange={(e) => setNuevoRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="campo-entrada w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Alimentos S.A.C."
                  value={nuevaRazon}
                  onChange={(e) => setNuevaRazon(e.target.value)}
                  className="campo-entrada w-full"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Representante Legal</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza Rivera"
                  value={nuevoRepresentante}
                  onChange={(e) => setNuevoRepresentante(e.target.value)}
                  className="campo-entrada w-full"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="contacto@empresa.com.pe"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  className="campo-entrada w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Unidad</label>
                  <select
                    value={nuevaIdUnidad}
                    onChange={(e) => setNuevaIdUnidad(e.target.value)}
                    className="campo-select w-full"
                  >
                    {unidades.map((u) => (
                      <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Industria</label>
                  <select
                    value={nuevaIdIndustria}
                    onChange={(e) => setNuevaIdIndustria(e.target.value)}
                    className="campo-select w-full"
                  >
                    {industrias.map((i) => (
                      <option key={i.idIndustria} value={i.idIndustria}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Tipo de Proveedor</label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value)}
                  className="campo-select w-full"
                >
                  <option value="Retail">Retail</option>
                  <option value="No retail">No retail</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="boton-secundario cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario cursor-pointer"
              >
                Guardar en padrón
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
