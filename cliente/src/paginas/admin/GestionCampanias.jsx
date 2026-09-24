import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Send,
  ChevronRight,
  Megaphone,
  Check,
  Search,
  ExternalLink,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  listarCampaniasApi,
  crearCampaniaApi,
  cambiarEstadoCampaniaApi,
  listarEvaluacionesDeCampaniaApi,
  asignarEvaluacionApi,
  enviarRecordatorioApi,
  listarUnidadesApi,
  listarProveedoresAdminApi
} from '../../servicios/servicioApi.js';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';

const INSIGNIA_ESTADO = {
  Borrador: 'insignia-neutra',
  Publicada: 'insignia-exito',
  Cerrada: 'insignia-peligro'
};

export default function GestionCampanias({ alRegistrarAuditoria }) {
  const [campanias, setCampanias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [campaniaSeleccionada, setCampaniaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPeriodo, setNuevoPeriodo] = useState('');
  const [idProveedorAsignar, setIdProveedorAsignar] = useState('');
  const [enlaceCopiadoId, setEnlaceCopiadoId] = useState(null);
  const [busquedaEvaluacion, setBusquedaEvaluacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [campaniasRemotas, unidadesRemotas, proveedoresRemotos] = await Promise.all([
        listarCampaniasApi(),
        listarUnidadesApi(),
        listarProveedoresAdminApi()
      ]);
      setCampanias(campaniasRemotas);
      setUnidades(unidadesRemotas);
      setProveedores(proveedoresRemotos);
      setIdProveedorAsignar((actual) => actual || String(proveedoresRemotos[0]?.idProveedor ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarEvaluaciones = useCallback(async (campania) => {
    setCampaniaSeleccionada(campania);
    try {
      const evaluacionesRemotas = await listarEvaluacionesDeCampaniaApi(campania.idCampania);
      setEvaluaciones(evaluacionesRemotas);
    } catch (error) {
      setMensajeError(error.message);
    }
  }, []);

  const mostrarAviso = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const copiarEnlace = async (texto, idIdentificador = null) => {
    try {
      await navigator.clipboard.writeText(texto);
      if (idIdentificador) {
        setEnlaceCopiadoId(idIdentificador);
        setTimeout(() => setEnlaceCopiadoId(null), 2500);
      }
      mostrarAviso('Enlace copiado al portapapeles.');
    } catch {
      setMensajeError('No se pudo copiar el enlace automáticamente. Cópielo manualmente.');
    }
  };

  const crearCampania = async (e) => {
    e.preventDefault();
    try {
      await crearCampaniaApi({ nombre: nuevoNombre, periodo: nuevoPeriodo });
      await cargarDatos();
      setMostrarModalNueva(false);
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Creación de campaña',
          modulo: 'Campañas',
          detalles: `Se creó la campaña ${nuevoNombre} (${nuevoPeriodo})`
        });
      }
      setNuevoNombre('');
      setNuevoPeriodo('');
      mostrarAviso('Campaña creada en estado Borrador.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstado = async (campania, estado) => {
    try {
      await cambiarEstadoCampaniaApi(campania.idCampania, estado);
      await cargarDatos();
      if (campaniaSeleccionada?.idCampania === campania.idCampania) {
        setCampaniaSeleccionada({ ...campaniaSeleccionada, estado });
      }
      mostrarAviso(`Campaña actualizada a estado ${estado}.`);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const asignarEvaluacion = async () => {
    if (!campaniaSeleccionada || !idProveedorAsignar) return;
    try {
      const resultado = await asignarEvaluacionApi(campaniaSeleccionada.idCampania, Number(idProveedorAsignar));
      await cargarEvaluaciones(campaniaSeleccionada);
      await copiarEnlace(resultado.enlace);
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Asignación de evaluación',
          modulo: 'Campañas',
          detalles: `Evaluación asignada en la campaña ${campaniaSeleccionada.nombre}`
        });
      }
      mostrarAviso('Evaluación asignada. Enlace copiado al portapapeles.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const enviarRecordatorio = async (evaluacion) => {
    try {
      await enviarRecordatorioApi(evaluacion.idEvaluacion);
      await cargarEvaluaciones(campaniaSeleccionada);
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Envío de recordatorio',
          modulo: 'Campañas',
          detalles: `Recordatorio enviado a ${evaluacion.razonSocial}`
        });
      }
      mostrarAviso(`Recordatorio enviado a ${evaluacion.razonSocial}.`);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const evaluacionesFiltradas = evaluaciones.filter((ev) => {
    if (!busquedaEvaluacion.trim()) return true;
    const termino = busquedaEvaluacion.toLowerCase();
    return (
      (ev.razonSocial && ev.razonSocial.toLowerCase().includes(termino)) ||
      (ev.unidad && ev.unidad.toLowerCase().includes(termino)) ||
      (ev.estado && ev.estado.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="space-y-6">
      {mensajeExito && (
        <div className="toast-notificacion fixed top-20 right-6 z-50 px-5 py-3 rounded-full text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeExito}</span>
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
            Gestión de Campañas (RF12, RF21)
          </span>
          <h2 className="text-titulo-seccion">
            Campañas de Evaluación
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Planificación de periodos, emisión de enlaces corporativos por unidad y monitoreo de avances.
          </p>
        </div>
        <button
          onClick={() => setMostrarModalNueva(true)}
          className="boton-primario flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva campaña</span>
        </button>
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando campañas desde el servidor…
        </div>
      ) : (
        <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tabla-premium w-full text-left">
              <thead>
                <tr>
                  <th>Campaña</th>
                  <th>Periodo</th>
                  <th className="text-center">Unidades</th>
                  <th className="text-center">Proveedores</th>
                  <th className="text-center">Finalizadas</th>
                  <th className="text-center">Tasa Avance</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Gestión</th>
                </tr>
              </thead>
              <tbody>
                {campanias.map((c) => {
                  const total = Number(c.totalProveedores) || 0;
                  const finalizadas = Number(c.totalFinalizadas) || 0;
                  const porcentaje = total > 0 ? Math.round((finalizadas / total) * 100) : 0;
                  const esSeleccionada = campaniaSeleccionada?.idCampania === c.idCampania;
                  return (
                    <tr
                      key={c.idCampania}
                      className={`cursor-pointer transition-colors ${
                        esSeleccionada ? 'bg-blue-50/40' : 'hover:bg-black/[0.015]'
                      }`}
                      onClick={() => cargarEvaluaciones(c)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-plataformaTexto">{c.nombre}</td>
                      <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">{c.periodo}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{c.totalUnidades}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{c.totalProveedores}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{c.totalFinalizadas}</td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16">
                            <BarraProgreso porcentaje={porcentaje} altura="h-1" />
                          </div>
                          <span className="text-xs font-semibold text-plataformaTexto">{porcentaje}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={INSIGNIA_ESTADO[c.estado] || 'insignia-neutra'}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cargarEvaluaciones(c);
                          }}
                          className="text-etiqueta text-plataformaAzul hover:underline inline-flex items-center gap-0.5 cursor-pointer font-medium"
                        >
                          <span>{esSeleccionada ? 'Viendo' : 'Gestionar'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {campanias.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
                      <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      No hay campañas registradas todavía. Cree una para comenzar las evaluaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaniaSeleccionada && (
        <div className="superficie-tarjeta rounded-lg-token p-6 space-y-6 border-2 border-plataformaAzul/20 shadow-xs-token">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-etiqueta text-plataformaAzul uppercase font-semibold">
                  Campaña Activa en Panel
                </span>
                <span className={INSIGNIA_ESTADO[campaniaSeleccionada.estado] || 'insignia-neutra'}>
                  {campaniaSeleccionada.estado}
                </span>
              </div>
              <h3 className="text-titulo-tarjeta mt-1 text-plataformaTexto">{campaniaSeleccionada.nombre}</h3>
              <p className="text-cuerpo-pequeno text-plataformaSecundario">Periodo de homologación: {campaniaSeleccionada.periodo}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-plataformaSecundario font-medium mr-1">Cambiar estado:</span>
              {['Borrador', 'Publicada', 'Cerrada'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => cambiarEstado(campaniaSeleccionada, estado)}
                  disabled={campaniaSeleccionada.estado === estado}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:cursor-default ${
                    campaniaSeleccionada.estado === estado
                      ? 'bg-plataformaTexto text-white shadow-xs-token'
                      : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-cuerpo-pequeno font-semibold text-plataformaTexto">
                Enlaces directos de auto-registro por Unidad de Negocio (RF12)
              </h4>
              <span className="text-subtexto text-plataformaSecundario">
                Comparta estos enlaces con los compradores de cada gerencia
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {unidades.map((u) => {
                const enlace = `${window.location.origin}/?campania=${campaniaSeleccionada.idCampania}&unidad=${u.idUnidad}`;
                const estaCopiado = enlaceCopiadoId === `unidad-${u.idUnidad}`;
                return (
                  <div
                    key={u.idUnidad}
                    className="flex items-center gap-2 p-3 rounded-md-token bg-black/[0.02] border border-black/[0.05] hover:border-black/[0.12] transition-colors"
                  >
                    <span className="text-xs font-semibold text-plataformaTexto w-36 shrink-0 truncate">
                      {u.nombre}
                    </span>
                    <span className="text-[11px] font-mono text-plataformaSecundario truncate flex-1 select-all">
                      {enlace}
                    </span>
                    <button
                      type="button"
                      onClick={() => copiarEnlace(enlace, `unidad-${u.idUnidad}`)}
                      className={`p-1.5 rounded-md-token transition-colors cursor-pointer shrink-0 ${
                        estaCopiado
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'hover:bg-black/[0.06] text-plataformaSecundario hover:text-plataformaAzul'
                      }`}
                      title="Copiar enlace al portapapeles"
                    >
                      {estaCopiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-lg-token bg-black/[0.015] border border-black/[0.05]">
            <h4 className="text-cuerpo-pequeno font-semibold text-plataformaTexto mb-2">
              Asignar evaluación directa a un proveedor del padrón
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <select
                value={idProveedorAsignar}
                onChange={(e) => setIdProveedorAsignar(e.target.value)}
                className="campo-select flex-1 w-full"
              >
                {proveedores.map((p) => (
                  <option key={p.idProveedor} value={p.idProveedor}>
                    {p.razonSocial} — RUC: {p.ruc} ({p.unidad})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={asignarEvaluacion}
                className="boton-primario shrink-0 w-full sm:w-auto cursor-pointer"
              >
                Asignar y copiar enlace
              </button>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-cuerpo-pequeno font-semibold text-plataformaTexto">
                  Padrón de Proveedores Evaluados en esta Campaña ({evaluaciones.length})
                </h4>
                <p className="text-subtexto text-plataformaSecundario">
                  Seguimiento individual de avance y recordatorios de envío
                </p>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar proveedor..."
                  value={busquedaEvaluacion}
                  onChange={(e) => setBusquedaEvaluacion(e.target.value)}
                  className="campo-entrada campo-entrada-icono w-full text-xs py-1.5"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-md-token border border-black/[0.06]">
              <table className="tabla-premium w-full text-left">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Unidad</th>
                    <th className="text-center">Estado</th>
                    <th>Último Recordatorio</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluacionesFiltradas.map((ev) => (
                    <tr key={ev.idEvaluacion}>
                      <td className="py-3 px-4 font-medium text-plataformaTexto">{ev.razonSocial}</td>
                      <td className="py-3 px-4 text-cuerpo-pequeno text-plataformaSecundario">{ev.unidad || 'Sin asignar'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={INSIGNIA_ESTADO[ev.estado] || 'insignia-neutra'}>
                          {ev.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-subtexto text-plataformaSecundario">
                        {ev.fechaEnvio ? new Date(ev.fechaEnvio).toLocaleString('es-PE') : 'Sin recordatorio'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ev.estado !== 'Finalizado' && (
                          <button
                            type="button"
                            onClick={() => enviarRecordatorio(ev)}
                            className="inline-flex items-center gap-1 text-xs text-plataformaAzul hover:underline cursor-pointer font-medium"
                          >
                            <Send className="w-3 h-3" />
                            <span>Recordar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {evaluacionesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-subtexto text-plataformaSecundario">
                        No hay evaluaciones registradas en esta campaña aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNueva && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={crearCampania} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Planificación</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Campaña de Sostenibilidad</h3>
                <p className="text-subtexto text-plataformaSecundario mt-0.5">
                  Se creará inicialmente en estado Borrador
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNueva(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">
                  Nombre de la Campaña *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Homologación Anual ESG 2026"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="campo-entrada w-full text-xs"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">
                  Periodo de Vigencia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 2026-I o Q1-Q2 2026"
                  value={nuevoPeriodo}
                  onChange={(e) => setNuevoPeriodo(e.target.value)}
                  className="campo-entrada w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setMostrarModalNueva(false)}
                className="boton-secundario cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="boton-primario cursor-pointer">
                Crear campaña
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
