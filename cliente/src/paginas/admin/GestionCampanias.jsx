import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, AlertCircle, X, Copy, Send, ChevronRight, Megaphone, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  listarCampaniasApi,
  crearCampaniaApi,
  cambiarEstadoCampaniaApi,
  eliminarCampaniaApi,
  listarEvaluacionesDeCampaniaApi,
  enviarRecordatorioApi
} from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

const INSIGNIA_ESTADO = {
  Borrador: 'insignia-neutra',
  Publicada: 'insignia-exito',
  Cerrada: 'insignia-peligro'
};

export default function GestionCampanias({ alRegistrarAuditoria }) {
  const [campanias, setCampanias] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [campaniaSeleccionada, setCampaniaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPeriodo, setNuevoPeriodo] = useState('');
  const [campaniaAEliminar, setCampaniaAEliminar] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useMensajeTemporal();

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const campaniasRemotas = await listarCampaniasApi();
      setCampanias(campaniasRemotas);
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

  const copiarEnlace = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
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
        alRegistrarAuditoria({ accion: 'Creación de campaña', modulo: 'Campañas', detalles: `Se creó la campaña ${nuevoNombre} (${nuevoPeriodo})` });
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

  const confirmarEliminarCampania = async () => {
    if (!campaniaAEliminar) return;
    try {
      await eliminarCampaniaApi(campaniaAEliminar.idCampania);
      if (campaniaSeleccionada?.idCampania === campaniaAEliminar.idCampania) {
        setCampaniaSeleccionada(null);
      }
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({ accion: 'Eliminación de campaña', modulo: 'Campañas', detalles: `Se eliminó la campaña ${campaniaAEliminar.nombre}` });
      }
      mostrarAviso('Campaña eliminada.');
      setCampaniaAEliminar(null);
    } catch (error) {
      setMensajeError(error.message);
      setCampaniaAEliminar(null);
    }
  };

  const enviarRecordatorio = async (evaluacion) => {
    try {
      await enviarRecordatorioApi(evaluacion.idEvaluacion);
      await cargarEvaluaciones(campaniaSeleccionada);
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({ accion: 'Envío de recordatorio', modulo: 'Campañas', detalles: `Recordatorio enviado a ${evaluacion.razonSocial}` });
      }
      mostrarAviso(`Recordatorio enviado a ${evaluacion.razonSocial}.`);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

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
            Solo una campaña puede estar publicada a la vez: es la que reciben los proveedores que se autoregistran.
          </p>
        </div>
        <button onClick={() => setMostrarModalNueva(true)} className="boton-primario flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Nueva campaña</span>
        </button>
      </div>

      {!cargando && (
        campanias.some((c) => c.estado === 'Publicada') ? (
          <div className="rounded-md-token bg-emerald-50 border border-emerald-200/60 p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-cuerpo-pequeno text-emerald-800">
              Campaña activa actualmente: <strong>{campanias.find((c) => c.estado === 'Publicada').nombre}</strong>{' '}
              ({campanias.find((c) => c.estado === 'Publicada').periodo}). Los proveedores que se registren con el enlace público se asocian a esta campaña.
            </p>
          </div>
        ) : (
          <div className="rounded-md-token bg-amber-50 border border-amber-200/60 p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-cuerpo-pequeno text-amber-800">
              No hay ninguna campaña publicada. Los proveedores no podrán autoregistrarse hasta que publique una.
            </p>
          </div>
        )
      )}

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
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
                  <th className="text-center">Estado</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {campanias.map((c) => (
                  <tr key={c.idCampania} className="cursor-pointer" onClick={() => cargarEvaluaciones(c)}>
                    <td className="py-3.5 px-4 font-semibold text-plataformaTexto">{c.nombre}</td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">{c.periodo}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{c.totalUnidades}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{c.totalProveedores}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{c.totalFinalizadas}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={INSIGNIA_ESTADO[c.estado]}>{c.estado}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); cargarEvaluaciones(c); }} className="text-etiqueta text-plataformaAzul hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                          <span>Gestionar</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCampaniaAEliminar(c); }}
                          title="Eliminar campaña"
                          className="p-1.5 rounded-full hover:bg-red-50 text-plataformaSecundario hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {campanias.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
                      <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      No hay campañas registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaniaSeleccionada && (
        <div className="superficie-tarjeta rounded-lg-token p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-titulo-tarjeta">{campaniaSeleccionada.nombre}</h3>
              <p className="text-cuerpo-pequeno text-plataformaSecundario">{campaniaSeleccionada.periodo}</p>
            </div>
            <div className="flex items-center gap-2">
              {['Borrador', 'Publicada', 'Cerrada'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => cambiarEstado(campaniaSeleccionada, estado)}
                  disabled={campaniaSeleccionada.estado === estado}
                  className={`px-3 py-1.5 rounded-full text-etiqueta transition-all cursor-pointer disabled:cursor-default ${
                    campaniaSeleccionada.estado === estado ? 'bg-plataformaTexto text-white' : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {campaniaSeleccionada.estado !== 'Publicada' && (
            <p className="text-subtexto text-plataformaSecundario -mt-4">
              Al publicar esta campaña, cualquier otra campaña que esté publicada se cerrará automáticamente.
            </p>
          )}

          <div>
            <h4 className="text-cuerpo-pequeno font-semibold text-plataformaTexto mb-2">Enlace público de acceso</h4>
            <div className="flex items-center gap-2 p-3 rounded-sm-token bg-black/[0.02] border border-black/[0.04]">
              <span className="text-subtexto font-mono text-plataformaSecundario truncate flex-1">{window.location.origin}/</span>
              <button onClick={() => copiarEnlace(`${window.location.origin}/`)} className="p-1.5 rounded-full hover:bg-black/[0.06] text-plataformaSecundario hover:text-plataformaAzul cursor-pointer shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-subtexto text-plataformaSecundario mt-1.5">
              Cualquier proveedor puede acceder con este enlace; declara él mismo su industria y las unidades de negocio a las que atiende en el formulario de registro.
            </p>
          </div>

          <div>
            <h4 className="text-cuerpo-pequeno font-semibold text-plataformaTexto mb-2">Evaluaciones de esta campaña ({evaluaciones.length})</h4>
            <div className="overflow-x-auto">
              <table className="tabla-premium w-full text-left">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Unidad</th>
                    <th className="text-center">Estado</th>
                    <th>Último envío</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluaciones.map((ev) => (
                    <tr key={ev.idEvaluacion}>
                      <td className="py-3 px-4 font-medium text-plataformaTexto">{ev.razonSocial}</td>
                      <td className="py-3 px-4 text-cuerpo-pequeno text-plataformaSecundario">{ev.unidad || 'Sin asignar'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={INSIGNIA_ESTADO[ev.estado] || 'insignia-neutra'}>{ev.estado}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-subtexto text-plataformaSecundario">
                        {ev.fechaEnvio ? new Date(ev.fechaEnvio).toLocaleString('es-PE') : 'Nunca'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ev.estado === 'Finalizado' ? (
                          <span className="text-subtexto text-plataformaSecundario">Ya finalizó</span>
                        ) : (
                          <button onClick={() => enviarRecordatorio(ev)} title="Enviar recordatorio" className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaAzul transition-colors cursor-pointer">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {evaluaciones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-cuerpo-pequeno text-plataformaSecundario">
                        Todavía no hay proveedores con evaluación asignada en esta campaña.
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
                <span className="text-etiqueta text-plataformaAzul block uppercase">Nueva Campaña</span>
                <h3 className="text-titulo-seccion mt-1">Crear campaña de evaluación</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNueva(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input type="text" required placeholder="ej. Evaluación de Sostenibilidad 2026-II" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="campo-entrada w-full" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Periodo</label>
                <input type="text" required placeholder="ej. 2026-II" value={nuevoPeriodo} onChange={(e) => setNuevoPeriodo(e.target.value)} className="campo-entrada w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNueva(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Crear campaña</button>
            </div>
          </form>
        </div>
      )}

      {campaniaAEliminar && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <div className="contenido-modal max-w-sm w-full p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-50 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-titulo-tarjeta">Eliminar campaña</h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
                  ¿Eliminar <strong>{campaniaAEliminar.nombre}</strong> ({campaniaAEliminar.periodo})? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCampaniaAEliminar(null)} className="boton-secundario">Cancelar</button>
              <button type="button" onClick={confirmarEliminarCampania} className="boton-primario !bg-red-600 hover:!bg-red-700">Eliminar definitivamente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
