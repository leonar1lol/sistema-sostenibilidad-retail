import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, CheckCircle2, X, AlertCircle, Trash2, GitBranch, Pencil, RotateCcw, ChevronDown } from 'lucide-react';
import {
  listarItemsBancoApi,
  crearItemBancoApi,
  editarItemBancoApi,
  cambiarEstadoItemBancoApi,
  actualizarIndustriasItemApi,
  listarDimensionesApi,
  listarIndustriasApi,
  listarReglasCondicionalesApi,
  crearReglaCondicionalApi,
  eliminarReglaCondicionalApi
} from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

const ETIQUETAS_ACCION = {
  mostrar: 'mostrar',
  ocultar: 'ocultar',
  deshabilitar: 'deshabilitar'
};

const truncarTexto = (texto, limite = 50) =>
  texto && texto.length > limite ? `${texto.slice(0, limite)}…` : texto;

export default function BancoPreguntas() {
  const [items, setItems] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroDimension, setFiltroDimension] = useState('todas');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dimensionesColapsadas, setDimensionesColapsadas] = useState(new Set());
  const [mostrarModalNuevoItem, setMostrarModalNuevoItem] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useMensajeTemporal();

  const [nuevaIdDimension, setNuevaIdDimension] = useState('');
  const [nuevoEnunciado, setNuevoEnunciado] = useState('');
  const [nuevoPeso, setNuevoPeso] = useState('1');
  const [nuevasIdsIndustrias, setNuevasIdsIndustrias] = useState([]);
  const [nuevasAlternativas, setNuevasAlternativas] = useState([
    { texto: '', puntaje: 100 },
    { texto: '', puntaje: 0 }
  ]);

  const [itemEnEdicion, setItemEnEdicion] = useState(null);
  const [editEnunciado, setEditEnunciado] = useState('');
  const [editPeso, setEditPeso] = useState('1');
  const [editIdDimension, setEditIdDimension] = useState('');
  const [editIdsIndustrias, setEditIdsIndustrias] = useState([]);
  const [miniReglaIdAlternativa, setMiniReglaIdAlternativa] = useState('');
  const [miniReglaAccion, setMiniReglaAccion] = useState('mostrar');
  const [miniReglaIdItemDestino, setMiniReglaIdItemDestino] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [itemsRemotos, dimensionesRemotas, industriasRemotas, reglasRemotas] = await Promise.all([
        listarItemsBancoApi(incluirInactivos),
        listarDimensionesApi(true),
        listarIndustriasApi(),
        listarReglasCondicionalesApi()
      ]);
      setItems(itemsRemotos);
      setDimensiones(dimensionesRemotas);
      setIndustrias(industriasRemotas);
      setReglas(reglasRemotas);
      const primeraActiva = dimensionesRemotas.find((d) => d.activo !== false);
      setNuevaIdDimension((actual) => actual || String(primeraActiva?.idDimension ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, [incluirInactivos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const mostrarAviso = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const itemsFiltrados = items.filter(
    (item) => filtroDimension === 'todas' || item.codigoDimension === filtroDimension
  );
  const dimensionesActivas = dimensiones.filter((d) => d.activo !== false);

  const alternarColapsoDimension = (idDimension) => {
    setDimensionesColapsadas((actual) => {
      const copia = new Set(actual);
      if (copia.has(idDimension)) copia.delete(idDimension); else copia.add(idDimension);
      return copia;
    });
  };

  const abrirNuevoItemParaDimension = (idDimension) => {
    setNuevaIdDimension(String(idDimension));
    setMostrarModalNuevoItem(true);
  };

  const actualizarAlternativa = (indice, campo, valor) => {
    setNuevasAlternativas((actual) => actual.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));
  };

  const agregarFilaAlternativa = () => {
    setNuevasAlternativas((actual) => [...actual, { texto: '', puntaje: 0 }]);
  };

  const quitarFilaAlternativa = (indice) => {
    setNuevasAlternativas((actual) => actual.filter((_, i) => i !== indice));
  };

  const alternarIndustriaSeleccionada = (idIndustria) => {
    setNuevasIdsIndustrias((actual) =>
      actual.includes(idIndustria) ? actual.filter((id) => id !== idIndustria) : [...actual, idIndustria]
    );
  };

  const crearItem = async (e) => {
    e.preventDefault();
    try {
      await crearItemBancoApi({
        enunciado: nuevoEnunciado,
        peso: Number(nuevoPeso),
        idDimension: Number(nuevaIdDimension),
        idsIndustrias: nuevasIdsIndustrias,
        alternativas: nuevasAlternativas.filter((a) => a.texto.trim() !== '')
      });
      await cargarDatos();
      setMostrarModalNuevoItem(false);
      setNuevoEnunciado('');
      setNuevoPeso('1');
      setNuevasIdsIndustrias([]);
      setNuevasAlternativas([{ texto: '', puntaje: 100 }, { texto: '', puntaje: 0 }]);
      mostrarAviso('Ítem incorporado exitosamente al banco de preguntas.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const borrarRegla = async (idRegla) => {
    try {
      await eliminarReglaCondicionalApi(idRegla);
      await cargarDatos();
      mostrarAviso('Regla condicional eliminada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstadoItem = async (item) => {
    try {
      await cambiarEstadoItemBancoApi(item.idItem, item.activo === false);
      await cargarDatos();
      mostrarAviso(item.activo === false ? 'Ítem reactivado.' : 'Ítem eliminado (borrado lógico).');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const abrirEdicion = (item) => {
    setItemEnEdicion(item);
    setEditEnunciado(item.enunciado);
    setEditPeso(String(item.peso));
    setEditIdDimension(String(item.idDimension));
    setEditIdsIndustrias(item.industrias.map((ind) => ind.idIndustria));
    setMiniReglaIdAlternativa('');
    setMiniReglaAccion('mostrar');
    setMiniReglaIdItemDestino('');
  };

  const alternarIndustriaEnEdicion = (idIndustria) => {
    setEditIdsIndustrias((actual) =>
      actual.includes(idIndustria) ? actual.filter((id) => id !== idIndustria) : [...actual, idIndustria]
    );
  };

  const guardarEdicionItem = async (e) => {
    e.preventDefault();
    try {
      await editarItemBancoApi(itemEnEdicion.idItem, {
        enunciado: editEnunciado,
        peso: Number(editPeso),
        idDimension: Number(editIdDimension)
      });
      await actualizarIndustriasItemApi(itemEnEdicion.idItem, editIdsIndustrias);
      await cargarDatos();
      setItemEnEdicion(null);
      mostrarAviso('Ítem actualizado exitosamente.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const reglasDelItemEnEdicion = itemEnEdicion
    ? reglas.filter((r) => r.idItemOrigen === itemEnEdicion.idItem)
    : [];

  // Reglas creadas desde OTRA pregunta que controlan la visibilidad de esta.
  // Sin esto, un admin que abre el ítem marcado "Condicional" en la lista no
  // tiene forma de ver ni quitar la regla que lo afecta.
  const reglasQueAfectanAlItemEnEdicion = itemEnEdicion
    ? reglas.filter((r) => r.idItemDestino === itemEnEdicion.idItem)
    : [];

  const reglaEnConflicto = itemEnEdicion && miniReglaIdItemDestino
    ? reglas.find((r) => r.idItemDestino === Number(miniReglaIdItemDestino) && r.accion !== miniReglaAccion)
    : null;

  const crearMiniRegla = async () => {
    try {
      await crearReglaCondicionalApi({
        idItemOrigen: itemEnEdicion.idItem,
        idAlternativaDisparadora: Number(miniReglaIdAlternativa),
        accion: miniReglaAccion,
        idItemDestino: Number(miniReglaIdItemDestino)
      });
      await cargarDatos();
      setMiniReglaIdAlternativa('');
      setMiniReglaIdItemDestino('');
      mostrarAviso('Regla condicional creada exitosamente.');
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
            Parametrización Corporativa (RF09, RF10, RF11)
          </span>
          <h2 className="text-titulo-seccion">
            Banco de Preguntas
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Enunciados, ponderaciones, asignación por industria y ramificación condicional — todo editable desde cada pregunta.
          </p>
        </div>

        <button onClick={() => setMostrarModalNuevoItem(true)} className="boton-primario flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Crear nuevo ítem</span>
        </button>
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : (
        <>
          <div className="superficie-tarjeta rounded-lg-token p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-plataformaSecundario" />
              <span className="text-cuerpo-pequeno font-semibold text-plataformaTexto">Filtrar por dimensión:</span>
              <div className="flex flex-wrap gap-2 ml-2">
                <button
                  onClick={() => setFiltroDimension('todas')}
                  className={`px-3 py-1.5 rounded-full text-etiqueta transition-all cursor-pointer ${
                    filtroDimension === 'todas' ? 'bg-plataformaTexto text-white' : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                  }`}
                >
                  Todas
                </button>
                {dimensionesActivas.map((d) => (
                  <button
                    key={d.idDimension}
                    onClick={() => setFiltroDimension(d.codigo)}
                    className={`px-3 py-1.5 rounded-full text-etiqueta transition-all cursor-pointer ${
                      filtroDimension === d.codigo ? 'bg-plataformaTexto text-white' : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                    }`}
                  >
                    {d.nombre}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 ml-auto text-cuerpo-pequeno text-plataformaSecundario cursor-pointer">
                <input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />
                Incluir eliminados
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {dimensiones
              .filter((d) => filtroDimension === 'todas' || d.codigo === filtroDimension)
              .filter((d) => d.activo !== false || items.some((item) => item.idDimension === d.idDimension))
              .map((dimension) => {
                const itemsDeDimension = itemsFiltrados.filter((item) => item.idDimension === dimension.idDimension);
                const colapsada = dimensionesColapsadas.has(dimension.idDimension);
                return (
                  <div
                    key={dimension.idDimension}
                    className={`superficie-tarjeta rounded-lg-token overflow-hidden border-l-4 ${dimension.activo === false ? 'border-black/20 opacity-70' : 'border-plataformaAzul'}`}
                  >
                    <button
                      type="button"
                      onClick={() => alternarColapsoDimension(dimension.idDimension)}
                      className="w-full flex items-center justify-between gap-3 px-6 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-cuerpo font-semibold text-plataformaTexto">{dimension.nombre}</span>
                        {dimension.activo === false && <span className="insignia-neutra uppercase">Dimensión eliminada</span>}
                        <span className="text-subtexto text-plataformaSecundario">
                          {itemsDeDimension.length} pregunta{itemsDeDimension.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-plataformaSecundario shrink-0 transition-transform ${colapsada ? '' : 'rotate-180'}`} />
                    </button>

                    {!colapsada && (
                      <div className="border-t border-black/[0.06]">
                        {itemsDeDimension.map((item) => (
                          <div
                            key={item.idItem}
                            className={`px-6 py-3 border-b border-black/[0.04] last:border-0 ${item.activo === false ? 'opacity-50' : ''}`}
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-cuerpo-pequeno text-plataformaTexto flex-1 min-w-[220px]">{item.enunciado}</span>
                              {reglas.some((r) => r.idItemDestino === item.idItem) && (
                                <span className="insignia-advertencia uppercase flex items-center gap-1 shrink-0" title="Su visibilidad depende de la respuesta a otra pregunta">
                                  <GitBranch className="w-3 h-3" /> Depende de otra
                                </span>
                              )}
                              {reglas.some((r) => r.idItemOrigen === item.idItem) && (
                                <span className="insignia-info uppercase flex items-center gap-1 shrink-0" title="La respuesta a esta pregunta afecta a otra">
                                  <GitBranch className="w-3 h-3" /> Dispara regla
                                </span>
                              )}
                              {item.activo === false && (
                                <span className="insignia-neutra uppercase shrink-0">Eliminado</span>
                              )}
                              <span className="insignia-neutra font-mono shrink-0">Peso: {item.peso}</span>
                              <button
                                type="button"
                                onClick={() => abrirEdicion(item)}
                                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaAzul transition-colors cursor-pointer shrink-0"
                                title="Editar ítem, industrias y reglas condicionales"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => cambiarEstadoItem(item)}
                                className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                                  item.activo === false ? 'hover:bg-emerald-50 text-plataformaSecundario hover:text-emerald-600' : 'hover:bg-red-50 text-plataformaSecundario hover:text-red-600'
                                }`}
                                title={item.activo === false ? 'Reactivar ítem' : 'Eliminar ítem (borrado lógico)'}
                              >
                                {item.activo === false ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                            {item.industrias.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.industrias.map((ind) => (
                                  <span key={ind.idIndustria} className="insignia-dim">{ind.nombre}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {itemsDeDimension.length === 0 && (
                          <p className="px-6 py-4 text-cuerpo-pequeno text-plataformaSecundario">
                            No hay preguntas en esta dimensión todavía.
                          </p>
                        )}

                        {dimension.activo !== false && (
                          <button
                            type="button"
                            onClick={() => abrirNuevoItemParaDimension(dimension.idDimension)}
                            className="w-full flex items-center justify-center gap-1.5 px-6 py-3 text-etiqueta text-plataformaAzul hover:bg-black/[0.02] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar nueva pregunta</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {mostrarModalNuevoItem && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={crearItem} className="contenido-modal !p-0 max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-black/[0.06] shrink-0">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Nuevo Ítem</span>
                <h3 className="text-titulo-seccion mt-1">Crear pregunta de evaluación</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevoItem(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Dimensión</label>
                <select value={nuevaIdDimension} onChange={(e) => setNuevaIdDimension(e.target.value)} className="campo-select w-full">
                  {dimensionesActivas.map((d) => (
                    <option key={d.idDimension} value={d.idDimension}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Enunciado de la pregunta</label>
                <textarea required rows={3} value={nuevoEnunciado} onChange={(e) => setNuevoEnunciado(e.target.value)} placeholder="Redacte la pregunta de evaluación..." className="campo-entrada w-full h-auto py-2" />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Peso dentro de la dimensión</label>
                <input type="number" step="0.1" min="0.1" value={nuevoPeso} onChange={(e) => setNuevoPeso(e.target.value)} className="campo-entrada w-full font-mono" />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-2">Alternativas de respuesta</label>
                <div className="space-y-2">
                  {nuevasAlternativas.map((alt, indice) => (
                    <div key={indice} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Texto de la alternativa"
                        value={alt.texto}
                        onChange={(e) => actualizarAlternativa(indice, 'texto', e.target.value)}
                        className="campo-entrada flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={alt.puntaje}
                        onChange={(e) => actualizarAlternativa(indice, 'puntaje', Number(e.target.value))}
                        className="campo-entrada w-20 font-mono"
                      />
                      {nuevasAlternativas.length > 2 && (
                        <button type="button" onClick={() => quitarFilaAlternativa(indice)} className="p-2 text-plataformaSecundario hover:text-red-600 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={agregarFilaAlternativa} className="boton-fantasma mt-2 text-etiqueta">
                  + Agregar alternativa
                </button>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-2">Industrias a las que aplica</label>
                <div className="flex flex-wrap gap-2">
                  {industrias.map((ind) => (
                    <button
                      type="button"
                      key={ind.idIndustria}
                      onClick={() => alternarIndustriaSeleccionada(ind.idIndustria)}
                      className={`px-3 py-1.5 rounded-full text-etiqueta transition-all cursor-pointer ${
                        nuevasIdsIndustrias.includes(ind.idIndustria) ? 'bg-plataformaTexto text-white' : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                      }`}
                    >
                      {ind.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-8 py-5 border-t border-black/[0.06] shrink-0">
              <button type="button" onClick={() => setMostrarModalNuevoItem(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar en banco</button>
            </div>
          </form>
        </div>
      )}

      {itemEnEdicion && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={guardarEdicionItem} className="contenido-modal !p-0 max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-black/[0.06] shrink-0">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  {dimensiones.find((d) => d.idDimension === itemEnEdicion.idDimension)?.nombre}
                </span>
                <h3 className="text-titulo-seccion mt-1">Editar ítem</h3>
              </div>
              <button type="button" onClick={() => setItemEnEdicion(null)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Dimensión</label>
                <select value={editIdDimension} onChange={(e) => setEditIdDimension(e.target.value)} className="campo-select w-full">
                  {dimensionesActivas.map((d) => (
                    <option key={d.idDimension} value={d.idDimension}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Enunciado de la pregunta</label>
                <textarea required rows={3} value={editEnunciado} onChange={(e) => setEditEnunciado(e.target.value)} className="campo-entrada w-full h-auto py-2" />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Peso dentro de la dimensión</label>
                <input type="number" step="0.1" min="0.1" value={editPeso} onChange={(e) => setEditPeso(e.target.value)} className="campo-entrada w-full font-mono" />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-2">Industrias a las que aplica</label>
                <div className="flex flex-wrap gap-2">
                  {industrias.map((ind) => (
                    <button
                      type="button"
                      key={ind.idIndustria}
                      onClick={() => alternarIndustriaEnEdicion(ind.idIndustria)}
                      className={`px-3 py-1.5 rounded-full text-etiqueta transition-all cursor-pointer ${
                        editIdsIndustrias.includes(ind.idIndustria) ? 'bg-plataformaTexto text-white' : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                      }`}
                    >
                      {ind.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-black/[0.06]">
                {reglasQueAfectanAlItemEnEdicion.length > 0 && (
                  <div className="mb-4">
                    <label className="text-etiqueta text-plataformaSecundario flex items-center gap-1.5 mb-2">
                      <GitBranch className="w-3.5 h-3.5" /> Esta pregunta depende de otra
                    </label>
                    <div className="space-y-1.5">
                      {reglasQueAfectanAlItemEnEdicion.map((r) => (
                        <div key={r.idRegla} className="flex items-center justify-between gap-2 p-2.5 rounded-sm-token bg-amber-50 border border-amber-200/60 text-cuerpo-pequeno">
                          <span>
                            Se {ETIQUETAS_ACCION[r.accion]} cuando en <span className="font-semibold">"{truncarTexto(r.enunciadoItemOrigen)}"</span> se responde "{r.textoAlternativaDisparadora}"
                          </span>
                          <button type="button" onClick={() => borrarRegla(r.idRegla)} className="p-1 text-plataformaSecundario hover:text-red-600 cursor-pointer shrink-0" title="Quitar esta condición">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="text-etiqueta text-plataformaSecundario flex items-center gap-1.5 mb-1">
                  <GitBranch className="w-3.5 h-3.5" /> Esta pregunta condiciona a otras
                </label>
                <p className="text-subtexto text-plataformaSecundario mb-2">
                  Ojo: en cuanto un ítem tiene una regla "mostrar", ese ítem queda oculto por defecto para todos los proveedores hasta que se cumpla la condición.
                </p>

                {reglasDelItemEnEdicion.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {reglasDelItemEnEdicion.map((r) => (
                      <div key={r.idRegla} className="flex items-center justify-between gap-2 p-2.5 rounded-sm-token bg-superficie-secundaria text-cuerpo-pequeno">
                        <span>
                          Si responde "{r.textoAlternativaDisparadora}" → {ETIQUETAS_ACCION[r.accion]} <span className="font-semibold">"{truncarTexto(r.enunciadoItemDestino)}"</span>
                        </span>
                        <button type="button" onClick={() => borrarRegla(r.idRegla)} className="p-1 text-plataformaSecundario hover:text-red-600 cursor-pointer shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 p-3 rounded-md-token bg-black/[0.02]">
                  <select value={miniReglaIdAlternativa} onChange={(e) => setMiniReglaIdAlternativa(e.target.value)} className="campo-select w-full text-cuerpo-pequeno">
                    <option value="">Si el proveedor responde…</option>
                    {itemEnEdicion.alternativas.map((a) => (
                      <option key={a.idAlternativa} value={a.idAlternativa}>{a.texto}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={miniReglaAccion} onChange={(e) => setMiniReglaAccion(e.target.value)} className="campo-select w-full text-cuerpo-pequeno">
                      <option value="mostrar">Entonces mostrar…</option>
                      <option value="ocultar">Entonces ocultar…</option>
                      <option value="deshabilitar">Entonces deshabilitar…</option>
                    </select>
                    <select value={miniReglaIdItemDestino} onChange={(e) => setMiniReglaIdItemDestino(e.target.value)} className="campo-select w-full text-cuerpo-pequeno">
                      <option value="">el ítem…</option>
                      {items.filter((i) => i.idItem !== itemEnEdicion.idItem).map((i) => (
                        <option key={i.idItem} value={i.idItem}>{truncarTexto(i.enunciado)}</option>
                      ))}
                    </select>
                  </div>
                  {reglaEnConflicto && (
                    <p className="text-subtexto text-amber-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Ese ítem ya tiene otra regla con la acción "{ETIQUETAS_ACCION[reglaEnConflicto.accion]}" — el resultado final dependerá de cuál se evalúe último.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={crearMiniRegla}
                    disabled={!miniReglaIdAlternativa || !miniReglaIdItemDestino}
                    className="boton-fantasma text-etiqueta justify-self-start disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Agregar esta regla
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-8 py-5 border-t border-black/[0.06] shrink-0">
              <button type="button" onClick={() => setItemEnEdicion(null)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
