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
  Trash2,
  RotateCcw
} from 'lucide-react';
import { exportarProveedoresAExcel } from '../../utilidades/exportadorExcel.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';
import {
  listarProveedoresAdminApi,
  crearProveedorAdminApi,
  alternarCriticidadUnidadApi,
  cambiarEstadoProveedorApi,
  actualizarClasificacionRiesgoApi,
  listarUnidadesApi,
  listarIndustriasApi,
  listarEvidenciaProveedorAdminApi
} from '../../servicios/servicioApi.js';

const NIVELES_NEGOCIO = ['Alto', 'Medio', 'Bajo'];
const NIVELES_PARTICIPACION = ['Alta', 'Media', 'Baja'];
const TAMANOS_EMPRESA = ['MYPE', 'PYME', 'Gran empresa'];

function EvidenciaFicha({ idProveedor }) {
  const [evidencias, setEvidencias] = useState(null);

  useEffect(() => {
    listarEvidenciaProveedorAdminApi(idProveedor).then(setEvidencias).catch(() => setEvidencias([]));
  }, [idProveedor]);

  if (!evidencias) {
    return <p className="text-subtexto text-plataformaSecundario">Cargando evidencia adjuntada…</p>;
  }
  if (evidencias.length === 0) {
    return <p className="text-subtexto text-plataformaSecundario">Este proveedor no adjuntó documentos de sustento.</p>;
  }

  return (
    <div className="space-y-1.5">
      {evidencias.map((ev) => (
        <a
          key={ev.idEvidencia}
          href={ev.urlDescarga}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-subtexto text-plataformaTexto bg-black/[0.02] hover:bg-black/[0.04] rounded-md-token px-3 py-1.5 transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5 text-plataformaSecundario shrink-0" />
          <span className="truncate flex-1" title={ev.enunciadoItem}>{ev.enunciadoItem} — {ev.nombreArchivo}</span>
          <Download className="w-3.5 h-3.5 text-plataformaSecundario shrink-0" />
        </a>
      ))}
    </div>
  );
}

export default function GestionProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('todas');
  const [filtroSoloCriticos, setFiltroSoloCriticos] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState('');
  const [mensajeError, setMensajeError] = useMensajeTemporal();

  const [nuevoRuc, setNuevoRuc] = useState('');
  const [nuevaRazon, setNuevaRazon] = useState('');
  const [nuevoRepresentante, setNuevoRepresentante] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Retail');
  const [nuevasIdsUnidad, setNuevasIdsUnidad] = useState([]);
  const [nuevaIdIndustria, setNuevaIdIndustria] = useState('');
  const [nuevoPais, setNuevoPais] = useState('Perú');
  const [nuevoTamanoEmpresa, setNuevoTamanoEmpresa] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [proveedoresRemotos, unidadesRemotas, industriasRemotas] = await Promise.all([
        listarProveedoresAdminApi(incluirInactivos),
        listarUnidadesApi(),
        listarIndustriasApi()
      ]);
      setProveedores(proveedoresRemotos);
      setUnidades(unidadesRemotas);
      setIndustrias(industriasRemotas);
      setNuevaIdIndustria((actual) => actual || String(industriasRemotas[0]?.idIndustria ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, [incluirInactivos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const proveedoresFiltrados = proveedores.filter((item) => {
    const coincideTexto =
      item.razonSocial.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      item.ruc.includes(terminoBusqueda);
    const coincideUnidad = filtroUnidad === 'todas' || (item.unidades || []).includes(filtroUnidad);
    // Ojo: "atiende esta unidad" y "es crítico para esta unidad" son cosas
    // distintas. Con una unidad puntual filtrada, "Críticos" debe exigir que
    // sea crítico PARA ESA unidad, no para cualquier otra que también atienda.
    const coincideCritico = !filtroSoloCriticos || (
      filtroUnidad === 'todas'
        ? (item.unidadesCriticas || []).length > 0
        : (item.unidadesCriticas || []).includes(filtroUnidad)
    );
    return coincideTexto && coincideUnidad && coincideCritico;
  });

  const mostrarAviso = (texto) => {
    setMensajeNotificacion(texto);
    setTimeout(() => setMensajeNotificacion(''), 3000);
  };

  const alternarCriticoDeUnidad = async (prov, unidad) => {
    try {
      await alternarCriticidadUnidadApi(prov.idProveedor, unidad.idUnidad, !unidad.esCritico);
      await cargarDatos();
      mostrarAviso(`Criticidad actualizada para ${unidad.nombre}.`);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstadoProveedor = async (prov) => {
    try {
      await cambiarEstadoProveedorApi(prov.idProveedor, prov.activo === false);
      await cargarDatos();
      mostrarAviso(prov.activo === false ? 'Proveedor reactivado.' : 'Proveedor eliminado (borrado lógico).');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const actualizarClasificacionRiesgo = async (idProveedor, cambios) => {
    try {
      const actualizado = await actualizarClasificacionRiesgoApi(idProveedor, cambios);
      setProveedorSeleccionado((actual) => (actual ? { ...actual, ...actualizado } : actual));
      await cargarDatos();
      mostrarAviso('Clasificación de riesgo actualizada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const alternarNuevaUnidad = (idUnidad) => {
    setNuevasIdsUnidad((actual) =>
      actual.includes(idUnidad) ? actual.filter((id) => id !== idUnidad) : [...actual, idUnidad]
    );
  };

  const registrarNuevoProveedor = async (e) => {
    e.preventDefault();
    if (nuevasIdsUnidad.length === 0) {
      setMensajeError('Debe seleccionar al menos una unidad de negocio.');
      return;
    }
    try {
      await crearProveedorAdminApi({
        ruc: nuevoRuc,
        razonSocial: nuevaRazon,
        representante: nuevoRepresentante,
        correo: nuevoCorreo,
        tipo: nuevoTipo,
        idsUnidad: nuevasIdsUnidad,
        idIndustria: nuevaIdIndustria ? Number(nuevaIdIndustria) : null,
        pais: nuevoPais,
        tamanoEmpresa: nuevoTamanoEmpresa || null
      });
      await cargarDatos();
      setMostrarModalNuevo(false);
      setNuevoRuc('');
      setNuevaRazon('');
      setNuevoRepresentante('');
      setNuevoCorreo('');
      setNuevasIdsUnidad([]);
      setNuevoTamanoEmpresa('');
      mostrarAviso('Proveedor incorporado exitosamente al padrón corporativo. Cuando el proveedor inicie sesión con su correo, completará sus propios datos de contacto.');
    } catch (error) {
      setMensajeError(error.message);
    }
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
            className="boton-secundario flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar lista ({proveedoresFiltrados.length})</span>
          </button>
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="boton-primario flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Incorporar proveedor</span>
          </button>
        </div>
      </div>

      <div className="superficie-tarjeta rounded-lg-token p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por razón social o RUC..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="campo-entrada campo-entrada-icono w-full"
            />
          </div>

          <div>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltroSoloCriticos(!filtroSoloCriticos)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroSoloCriticos
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 px-4 h-11 rounded-md-token text-cuerpo-pequeno font-medium'
                  : 'boton-secundario h-11'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Críticos</span>
            </button>
            <label className="flex items-center gap-1.5 text-cuerpo-pequeno text-plataformaSecundario cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />
              Incluir eliminados
            </label>
          </div>
        </div>
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
                <th>Crítico para</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Puntaje</th>
                <th className="text-center">Riesgo</th>
                <th className="text-right">Administrar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-plataformaSecundario">
                    Cargando datos reales desde el servidor…
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="estado-vacio py-12 text-center text-plataformaSecundario flex flex-col items-center">
                      <Search className="w-8 h-8 mb-3 opacity-50" />
                      <span>No se encontraron proveedores que coincidan con los criterios de búsqueda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((prov) => (
                  <tr key={prov.idProveedor} onClick={() => setProveedorSeleccionado(prov)} className={`cursor-pointer ${prov.activo === false ? 'opacity-50' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-plataformaTexto">
                        {prov.razonSocial} {prov.activo === false && <span className="insignia-neutra uppercase ml-1.5">Eliminado</span>}
                      </div>
                      <div className="text-subtexto text-plataformaSecundario">{prov.representante || 'Sin representante registrado'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cuerpo-pequeno text-plataformaSecundario">
                      {prov.ruc}
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaTexto">
                      {prov.unidades && prov.unidades.length > 0 ? prov.unidades.join(', ') : 'Sin asignar'}
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">
                      {prov.industria}
                    </td>
                    <td className="py-3.5 px-4">
                      {(prov.unidadesDetalle || []).length === 0 ? (
                        <span className="text-black/30 font-normal text-cuerpo-pequeno">Sin unidad asignada</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {prov.unidadesDetalle.map((u) => (
                            <button
                              key={u.idUnidad}
                              onClick={(e) => { e.stopPropagation(); alternarCriticoDeUnidad(prov, u); }}
                              title={u.esCritico ? `Quitar criticidad para ${u.nombre}` : `Marcar crítico para ${u.nombre}`}
                              className={`px-2 py-0.5 rounded-full text-subtexto font-medium transition-all cursor-pointer inline-flex items-center gap-1 ${
                                u.esCritico
                                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                                  : 'bg-black/[0.03] text-plataformaSecundario border border-black/[0.06] hover:border-amber-400/50'
                              }`}
                            >
                              <ShieldAlert className="w-3 h-3" />
                              {u.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {prov.estadoEvaluacion === 'Finalizado' ? (
                        <span className="inline-flex items-center gap-1 insignia-exito">
                          <CheckCircle2 className="w-3 h-3" />
                          Finalizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 insignia-neutra">
                          <Clock className="w-3 h-3" />
                          {prov.estadoEvaluacion || 'Sin evaluación'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {prov.puntajeTotal !== null && prov.puntajeTotal !== undefined ? (
                        Math.round(Number(prov.puntajeTotal))
                      ) : (
                        <span className="text-black/30 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {prov.nivelRiesgo ? (
                        <span className={`insignia-${prov.nivelRiesgo === 'Alto' ? 'peligro' : prov.nivelRiesgo === 'Medio' ? 'advertencia' : 'exito'}`}>
                          {prov.nivelRiesgo}
                        </span>
                      ) : (
                        <span className="text-black/30 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); cambiarEstadoProveedor(prov); }}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          prov.activo === false ? 'hover:bg-emerald-50 text-plataformaSecundario hover:text-emerald-600' : 'hover:bg-red-50 text-plataformaSecundario hover:text-red-600'
                        }`}
                        title={prov.activo === false ? 'Reactivar proveedor' : 'Eliminar proveedor (borrado lógico)'}
                      >
                        {prov.activo === false ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {proveedorSeleccionado && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <div className="contenido-modal !p-0 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-black/[0.06] shrink-0">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Ficha de Sostenibilidad
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  {proveedorSeleccionado.razonSocial}
                </h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
                  RUC {proveedorSeleccionado.ruc} • {(proveedorSeleccionado.unidades || []).join(', ') || 'Sin unidad asignada'}
                </p>
                {(proveedorSeleccionado.unidadesCriticas || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {proveedorSeleccionado.unidadesCriticas.map((nombre) => (
                      <span key={nombre} className="px-2 py-0.5 rounded-full text-subtexto font-medium bg-amber-500/15 text-amber-700 border border-amber-500/30 inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Crítico para {nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setProveedorSeleccionado(null)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04]">
                <div>
                  <span className="text-subtexto text-plataformaSecundario block">Representante legal</span>
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">{proveedorSeleccionado.representante || '—'}</span>
                </div>
                <div>
                  <span className="text-subtexto text-plataformaSecundario block">Persona que evaluó</span>
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">{proveedorSeleccionado.nombreContacto || '—'}</span>
                </div>
                <div>
                  <span className="text-subtexto text-plataformaSecundario block">Cargo</span>
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">{proveedorSeleccionado.cargoContacto || '—'}</span>
                </div>
                <div>
                  <span className="text-subtexto text-plataformaSecundario block">Celular / DNI</span>
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">
                    {proveedorSeleccionado.celularContacto || '—'} / {proveedorSeleccionado.dniContacto || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                  <span className="text-cuerpo-pequeno font-medium text-plataformaSecundario">
                    Puntaje General
                  </span>
                  <span className="text-[24px] font-bold font-mono text-plataformaTexto">
                    {proveedorSeleccionado.puntajeTotal !== null && proveedorSeleccionado.puntajeTotal !== undefined
                      ? Math.round(Number(proveedorSeleccionado.puntajeTotal))
                      : 'Sin evaluar'}
                  </span>
                </div>

                {proveedorSeleccionado.puntajeFinal !== null && proveedorSeleccionado.puntajeFinal !== undefined && (
                  <div className="p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                    <span className="text-cuerpo-pequeno font-medium text-plataformaSecundario">
                      Puntaje final ponderado
                    </span>
                    <div className="text-right">
                      <span className="text-[20px] font-bold font-mono text-plataformaTexto block">{proveedorSeleccionado.puntajeFinal}</span>
                      <span className={`insignia-${proveedorSeleccionado.nivelRiesgo === 'Alto' ? 'peligro' : proveedorSeleccionado.nivelRiesgo === 'Medio' ? 'advertencia' : 'exito'}`}>
                        Riesgo {proveedorSeleccionado.nivelRiesgo}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {proveedorSeleccionado.puntajeFinal !== null && proveedorSeleccionado.puntajeFinal !== undefined && (
                <div className="p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04]">
                  <span className="text-etiqueta text-plataformaSecundario block mb-2">Desglose del puntaje final</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Puntaje ASG', proveedorSeleccionado.puntajeAsg],
                      ['Origen', proveedorSeleccionado.puntajeOrigen],
                      ['Participación', proveedorSeleccionado.puntajeParticipacion],
                      ['Crítico de negocio', proveedorSeleccionado.puntajeCriticoNegocio]
                    ].map(([etiqueta, valor]) => (
                      <div key={etiqueta}>
                        <span className="text-subtexto text-plataformaSecundario block">{etiqueta}</span>
                        <span className="text-cuerpo font-mono font-semibold text-plataformaTexto">{valor ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-md-token bg-black/[0.02] border border-black/[0.04] space-y-3">
                <span className="text-etiqueta text-plataformaSecundario block">Clasificación de riesgo corporativo</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-subtexto text-plataformaSecundario block mb-1">País</label>
                    <input
                      type="text"
                      value={proveedorSeleccionado.pais || ''}
                      onChange={(e) => setProveedorSeleccionado({ ...proveedorSeleccionado, pais: e.target.value })}
                      className="campo-entrada w-full text-cuerpo-pequeno"
                    />
                  </div>
                  <div>
                    <label className="text-subtexto text-plataformaSecundario block mb-1">Tamaño</label>
                    <select
                      value={proveedorSeleccionado.tamanoEmpresa || ''}
                      onChange={(e) => setProveedorSeleccionado({ ...proveedorSeleccionado, tamanoEmpresa: e.target.value })}
                      className="campo-select w-full text-cuerpo-pequeno"
                    >
                      <option value="">Sin definir</option>
                      {TAMANOS_EMPRESA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-subtexto text-plataformaSecundario block mb-1">Criticidad</label>
                    <select
                      value={proveedorSeleccionado.nivelCriticidadNegocio || 'Bajo'}
                      onChange={(e) => setProveedorSeleccionado({ ...proveedorSeleccionado, nivelCriticidadNegocio: e.target.value })}
                      className="campo-select w-full text-cuerpo-pequeno"
                    >
                      {NIVELES_NEGOCIO.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-subtexto text-plataformaSecundario block mb-1">Participación</label>
                    <select
                      value={proveedorSeleccionado.nivelParticipacion || 'Baja'}
                      onChange={(e) => setProveedorSeleccionado({ ...proveedorSeleccionado, nivelParticipacion: e.target.value })}
                      className="campo-select w-full text-cuerpo-pequeno"
                    >
                      {NIVELES_PARTICIPACION.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => actualizarClasificacionRiesgo(proveedorSeleccionado.idProveedor, {
                      pais: proveedorSeleccionado.pais,
                      tamanoEmpresa: proveedorSeleccionado.tamanoEmpresa || null,
                      nivelCriticidadNegocio: proveedorSeleccionado.nivelCriticidadNegocio,
                      nivelParticipacion: proveedorSeleccionado.nivelParticipacion
                    })}
                    className="boton-secundario h-9 px-4 text-xs"
                  >
                    Guardar clasificación
                  </button>
                </div>
              </div>

              {proveedorSeleccionado.dimensiones ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(proveedorSeleccionado.dimensiones).map(([nombreDimension, valor]) => (
                    <div key={nombreDimension} className="p-3 rounded-md-token bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                      <span className="text-subtexto text-plataformaSecundario">{nombreDimension}</span>
                      <span className="font-mono font-semibold text-plataformaTexto">{Math.round(Number(valor))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-subtexto text-plataformaSecundario">
                  Este proveedor todavía no completó su evaluación en el portal. El puntaje y las recomendaciones aparecerán aquí en cuanto finalice el cuestionario.
                </p>
              )}

              <div>
                <span className="text-etiqueta text-plataformaSecundario block mb-2">Evidencia documental (RF25)</span>
                <EvidenciaFicha idProveedor={proveedorSeleccionado.idProveedor} />
              </div>
            </div>

            <div className="flex justify-end px-8 py-5 border-t border-black/[0.06] shrink-0">
              <button
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
          <form
            onSubmit={registrarNuevoProveedor}
            className="contenido-modal !p-0 max-w-2xl w-full max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-black/[0.06] shrink-0">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Nuevo Registro
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  Incorporar Proveedor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="space-y-4">
                <span className="text-etiqueta text-plataformaSecundario block uppercase">Información de la empresa</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">RUC (11 dígitos)</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={nuevoRuc}
                      onChange={(e) => setNuevoRuc(e.target.value)}
                      className="campo-entrada w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">Razón Social</label>
                    <input
                      type="text"
                      required
                      value={nuevaRazon}
                      onChange={(e) => setNuevaRazon(e.target.value)}
                      className="campo-entrada w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">Representante</label>
                    <input
                      type="text"
                      value={nuevoRepresentante}
                      onChange={(e) => setNuevoRepresentante(e.target.value)}
                      className="campo-entrada w-full"
                    />
                  </div>
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">Correo</label>
                    <input
                      type="email"
                      required
                      value={nuevoCorreo}
                      onChange={(e) => setNuevoCorreo(e.target.value)}
                      className="campo-entrada w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">Tipo</label>
                    <select
                      value={nuevoTipo}
                      onChange={(e) => setNuevoTipo(e.target.value)}
                      className="campo-select w-full"
                    >
                      <option value="Retail">Retail</option>
                      <option value="No retail">No retail</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">País</label>
                    <input type="text" value={nuevoPais} onChange={(e) => setNuevoPais(e.target.value)} className="campo-entrada w-full" />
                  </div>
                  <div>
                    <label className="text-etiqueta text-plataformaSecundario block mb-1">Tamaño</label>
                    <select value={nuevoTamanoEmpresa} onChange={(e) => setNuevoTamanoEmpresa(e.target.value)} className="campo-select w-full">
                      <option value="">Sin definir</option>
                      {TAMANOS_EMPRESA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-black/[0.06]">
                <span className="text-etiqueta text-plataformaSecundario block uppercase pt-4">
                  Unidades de negocio a las que provee (puede marcar varias)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {unidades.map((u) => (
                    <label key={u.idUnidad} className="flex items-center gap-2 p-2 rounded-sm-token bg-black/[0.02] border border-black/[0.04] text-cuerpo-pequeno cursor-pointer hover:border-plataformaAzul/30 transition-colors">
                      <input type="checkbox" checked={nuevasIdsUnidad.includes(u.idUnidad)} onChange={() => alternarNuevaUnidad(u.idUnidad)} />
                      {u.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-subtexto text-plataformaSecundario">
                Los datos de la persona que completa la evaluación (nombre, cargo, celular, DNI) los registra
                el propio proveedor al ingresar con su correo — el admin no los define aquí.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-8 py-5 border-t border-black/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="boton-secundario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
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
