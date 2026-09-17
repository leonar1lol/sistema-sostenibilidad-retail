import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, CheckCircle2, X, AlertCircle, Trash2, GitBranch } from 'lucide-react';
import {
  listarItemsBancoApi,
  crearItemBancoApi,
  listarDimensionesApi,
  listarIndustriasApi,
  listarReglasCondicionalesApi,
  crearReglaCondicionalApi,
  eliminarReglaCondicionalApi
} from '../../servicios/servicioApi.js';

const ETIQUETAS_ACCION = {
  mostrar: 'mostrar',
  ocultar: 'ocultar',
  deshabilitar: 'deshabilitar'
};

export default function BancoPreguntas() {
  const [vistaInterna, setVistaInterna] = useState('items');
  const [items, setItems] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroDimension, setFiltroDimension] = useState('todas');
  const [mostrarModalNuevoItem, setMostrarModalNuevoItem] = useState(false);
  const [mostrarModalNuevaRegla, setMostrarModalNuevaRegla] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevaIdDimension, setNuevaIdDimension] = useState('');
  const [nuevoEnunciado, setNuevoEnunciado] = useState('');
  const [nuevoPeso, setNuevoPeso] = useState('1');
  const [nuevasIdsIndustrias, setNuevasIdsIndustrias] = useState([]);
  const [nuevasAlternativas, setNuevasAlternativas] = useState([
    { texto: '', puntaje: 100 },
    { texto: '', puntaje: 0 }
  ]);

  const [reglaIdItemOrigen, setReglaIdItemOrigen] = useState('');
  const [reglaIdAlternativa, setReglaIdAlternativa] = useState('');
  const [reglaAccion, setReglaAccion] = useState('mostrar');
  const [reglaIdItemDestino, setReglaIdItemDestino] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [itemsRemotos, dimensionesRemotas, industriasRemotas, reglasRemotas] = await Promise.all([
        listarItemsBancoApi(),
        listarDimensionesApi(),
        listarIndustriasApi(),
        listarReglasCondicionalesApi()
      ]);
      setItems(itemsRemotos);
      setDimensiones(dimensionesRemotas);
      setIndustrias(industriasRemotas);
      setReglas(reglasRemotas);
      setNuevaIdDimension((actual) => actual || String(dimensionesRemotas[0]?.idDimension ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

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
        codigo: nuevoCodigo,
        enunciado: nuevoEnunciado,
        peso: Number(nuevoPeso),
        idDimension: Number(nuevaIdDimension),
        idsIndustrias: nuevasIdsIndustrias,
        alternativas: nuevasAlternativas.filter((a) => a.texto.trim() !== '')
      });
      await cargarDatos();
      setMostrarModalNuevoItem(false);
      setNuevoCodigo('');
      setNuevoEnunciado('');
      setNuevoPeso('1');
      setNuevasIdsIndustrias([]);
      setNuevasAlternativas([{ texto: '', puntaje: 100 }, { texto: '', puntaje: 0 }]);
      mostrarAviso('Ítem incorporado exitosamente al banco de preguntas.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const itemOrigenSeleccionado = items.find((i) => i.idItem === Number(reglaIdItemOrigen));

  const crearRegla = async (e) => {
    e.preventDefault();
    try {
      await crearReglaCondicionalApi({
        idItemOrigen: Number(reglaIdItemOrigen),
        idAlternativaDisparadora: Number(reglaIdAlternativa),
        accion: reglaAccion,
        idItemDestino: Number(reglaIdItemDestino)
      });
      await cargarDatos();
      setMostrarModalNuevaRegla(false);
      setReglaIdItemOrigen('');
      setReglaIdAlternativa('');
      setReglaIdItemDestino('');
      mostrarAviso('Regla condicional creada exitosamente.');
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
            Banco de Preguntas y Reglas Condicionales
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Configuración de enunciados, ponderaciones, asignación por industria y ramificación condicional.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/[0.06] mb-4">
        <nav className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setVistaInterna('items')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              vistaInterna === 'items' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Banco de Ítems ({items.length})
          </button>
          <button
            onClick={() => setVistaInterna('reglas')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              vistaInterna === 'reglas' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Reglas Condicionales ({reglas.length})
          </button>
        </nav>

        {vistaInterna === 'items' ? (
          <button onClick={() => setMostrarModalNuevoItem(true)} className="boton-primario flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Crear nuevo ítem</span>
          </button>
        ) : (
          <button onClick={() => setMostrarModalNuevaRegla(true)} className="boton-primario flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Nueva regla</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : vistaInterna === 'items' ? (
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
                {dimensiones.map((d) => (
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
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {itemsFiltrados.map((item) => (
              <div key={item.idItem} className="superficie-tarjeta rounded-lg-token p-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="insignia-info font-mono">{item.codigo}</span>
                      <span className="text-etiqueta font-medium text-plataformaTexto">Dimensión {item.nombreDimension}</span>
                      {reglas.some((r) => r.idItemDestino === item.idItem) && (
                        <span className="insignia-advertencia uppercase flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> Condicional
                        </span>
                      )}
                    </div>
                    <h4 className="text-cuerpo font-medium text-plataformaTexto">{item.enunciado}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="insignia-neutra font-mono">Peso: {item.peso}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-black/[0.06]">
                  <span className="text-etiqueta text-plataformaSecundario block">Alternativas de respuesta y escala de puntaje:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.alternativas.map((alt) => (
                      <div key={alt.idAlternativa} className="p-3 rounded-sm-token bg-superficie-secundaria text-cuerpo-pequeno flex items-center justify-between">
                        <span className="text-plataformaTexto">{alt.texto}</span>
                        <span className="text-plataformaAzul font-mono font-semibold shrink-0 ml-2">{alt.puntaje} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {item.industrias.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.industrias.map((ind) => (
                      <span key={ind.idIndustria} className="insignia-dim">{ind.nombre}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {itemsFiltrados.length === 0 && (
              <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
                No hay ítems registrados para esta dimensión todavía.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {reglas.map((r) => (
            <div key={r.idRegla} className="superficie-tarjeta rounded-lg-token p-5 flex items-center justify-between gap-4">
              <p className="text-cuerpo-pequeno text-plataformaTexto">
                Si el ítem <span className="font-mono font-semibold">{r.codigoItemOrigen}</span> = "{r.textoAlternativaDisparadora}"
                {' '}→ entonces <span className="font-semibold">{ETIQUETAS_ACCION[r.accion]}</span> el ítem{' '}
                <span className="font-mono font-semibold">{r.codigoItemDestino}</span>
              </p>
              <button onClick={() => borrarRegla(r.idRegla)} className="p-2 rounded-full hover:bg-red-50 text-plataformaSecundario hover:text-red-600 transition-colors cursor-pointer shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {reglas.length === 0 && (
            <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
              No hay reglas condicionales configuradas todavía.
            </div>
          )}
        </div>
      )}

      {mostrarModalNuevoItem && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4 overflow-y-auto py-10">
          <form onSubmit={crearItem} className="contenido-modal max-w-lg w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Nuevo Ítem</span>
                <h3 className="text-titulo-seccion mt-1">Crear pregunta de evaluación</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevoItem(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Código</label>
                  <input type="text" required placeholder="ej. ETI-18" value={nuevoCodigo} onChange={(e) => setNuevoCodigo(e.target.value)} className="campo-entrada w-full font-mono" />
                </div>
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Dimensión</label>
                  <select value={nuevaIdDimension} onChange={(e) => setNuevaIdDimension(e.target.value)} className="campo-select w-full">
                    {dimensiones.map((d) => (
                      <option key={d.idDimension} value={d.idDimension}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
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

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevoItem(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar en banco</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalNuevaRegla && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={crearRegla} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Motor de Reglas</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Regla Condicional</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevaRegla(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Si el ítem origen</label>
                <select
                  required
                  value={reglaIdItemOrigen}
                  onChange={(e) => { setReglaIdItemOrigen(e.target.value); setReglaIdAlternativa(''); }}
                  className="campo-select w-full"
                >
                  <option value="">Seleccione un ítem…</option>
                  {items.map((i) => (
                    <option key={i.idItem} value={i.idItem}>{i.codigo} — {i.enunciado.slice(0, 50)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Es respondido con la alternativa</label>
                <select required value={reglaIdAlternativa} onChange={(e) => setReglaIdAlternativa(e.target.value)} className="campo-select w-full" disabled={!itemOrigenSeleccionado}>
                  <option value="">Seleccione una alternativa…</option>
                  {itemOrigenSeleccionado?.alternativas.map((a) => (
                    <option key={a.idAlternativa} value={a.idAlternativa}>{a.texto} ({a.puntaje} pts)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Entonces</label>
                <select value={reglaAccion} onChange={(e) => setReglaAccion(e.target.value)} className="campo-select w-full">
                  <option value="mostrar">Mostrar</option>
                  <option value="ocultar">Ocultar</option>
                  <option value="deshabilitar">Deshabilitar</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">El ítem destino</label>
                <select required value={reglaIdItemDestino} onChange={(e) => setReglaIdItemDestino(e.target.value)} className="campo-select w-full">
                  <option value="">Seleccione un ítem…</option>
                  {items.filter((i) => i.idItem !== Number(reglaIdItemOrigen)).map((i) => (
                    <option key={i.idItem} value={i.idItem}>{i.codigo} — {i.enunciado.slice(0, 50)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevaRegla(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Crear regla</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
