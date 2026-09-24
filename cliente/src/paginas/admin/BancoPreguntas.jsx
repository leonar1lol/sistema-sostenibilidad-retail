import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  X,
  AlertCircle,
  Trash2,
  GitBranch,
  Search,
  ArrowRight,
  HelpCircle,
  Eye,
  EyeOff,
  Slash,
  Sparkles
} from 'lucide-react';
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
  mostrar: { texto: 'Mostrar ítem', clase: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icono: Eye },
  ocultar: { texto: 'Ocultar ítem', clase: 'bg-rose-500/10 text-rose-700 border-rose-500/20', icono: EyeOff },
  deshabilitar: { texto: 'Deshabilitar ítem', clase: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icono: Slash }
};

export default function BancoPreguntas() {
  const [vistaInterna, setVistaInterna] = useState('items');
  const [items, setItems] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroDimension, setFiltroDimension] = useState('todas');
  const [busquedaItem, setBusquedaItem] = useState('');
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
  const [reglaAccion, setReglaAccion] = useState('ocultar');
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

  const itemsFiltrados = items.filter((item) => {
    const coincideDimension = filtroDimension === 'todas' || item.codigoDimension === filtroDimension;
    const coincideTexto =
      busquedaItem.trim() === '' ||
      item.codigo.toLowerCase().includes(busquedaItem.toLowerCase()) ||
      item.enunciado.toLowerCase().includes(busquedaItem.toLowerCase());
    return coincideDimension && coincideTexto;
  });

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
    if (!reglaIdItemOrigen || !reglaIdAlternativa || !reglaIdItemDestino) {
      setMensajeError('Debe completar el ítem origen, la alternativa detonante y el ítem destino.');
      return;
    }
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
            Parametrización Corporativa (RF04, RF05, RF09)
          </span>
          <h2 className="text-titulo-seccion">
            Banco de Preguntas y Reglas Condicionales
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Configuración de reactivos, ponderaciones, aplicabilidad por industria y motor de ramificación lógica.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-2">
        <nav className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setVistaInterna('items')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium transition-all cursor-pointer flex items-center gap-2 ${
              vistaInterna === 'items'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <span>Banco de Ítems</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/[0.05] text-plataformaTexto font-mono">
              {items.length}
            </span>
          </button>
          <button
            onClick={() => setVistaInterna('reglas')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium transition-all cursor-pointer flex items-center gap-2 ${
              vistaInterna === 'reglas'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Reglas Condicionales</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/[0.05] text-plataformaTexto font-mono">
              {reglas.length}
            </span>
          </button>
        </nav>

        {vistaInterna === 'items' ? (
          <button
            onClick={() => setMostrarModalNuevoItem(true)}
            className="boton-primario flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear nuevo ítem</span>
          </button>
        ) : (
          <button
            onClick={() => setMostrarModalNuevaRegla(true)}
            className="boton-primario flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva regla lógica</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : vistaInterna === 'items' ? (
        <>
          <div className="superficie-tarjeta rounded-lg-token p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código de pregunta o texto de enunciado..."
                value={busquedaItem}
                onChange={(e) => setBusquedaItem(e.target.value)}
                className="campo-entrada campo-entrada-icono w-full"
              />
              {busquedaItem && (
                <button
                  type="button"
                  onClick={() => setBusquedaItem('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-plataformaSecundario hover:text-plataformaTexto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <Filter className="w-3.5 h-3.5 text-plataformaSecundario shrink-0" />
              <span className="text-xs font-semibold text-plataformaSecundario">Dimensión:</span>
              <button
                onClick={() => setFiltroDimension('todas')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filtroDimension === 'todas'
                    ? 'bg-plataformaTexto text-white'
                    : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                }`}
              >
                Todas ({items.length})
              </button>
              {dimensiones.map((d) => {
                const cuentaPorDim = items.filter((i) => i.codigoDimension === d.codigo).length;
                return (
                  <button
                    key={d.idDimension}
                    onClick={() => setFiltroDimension(d.codigo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      filtroDimension === d.codigo
                        ? 'bg-plataformaTexto text-white'
                        : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                    }`}
                  >
                    {d.nombre} ({cuentaPorDim})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {itemsFiltrados.map((item) => {
              const esDestinoDeRegla = reglas.some((r) => r.idItemDestino === item.idItem);
              const esOrigenDeRegla = reglas.some((r) => r.idItemOrigen === item.idItem);
              return (
                <div
                  key={item.idItem}
                  className="superficie-tarjeta rounded-lg-token p-6 flex flex-col gap-4 hover:border-black/[0.12] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md-token bg-plataformaAzul/10 text-plataformaAzul">
                          {item.codigo}
                        </span>
                        <span className="text-xs font-semibold text-plataformaTexto">
                          {item.nombreDimension}
                        </span>
                        {esDestinoDeRegla && (
                          <span className="insignia-advertencia inline-flex items-center gap-1 text-[10px]">
                            <GitBranch className="w-3 h-3" /> Condicionado por regla
                          </span>
                        )}
                        {esOrigenDeRegla && (
                          <span className="insignia-info inline-flex items-center gap-1 text-[10px]">
                            <Sparkles className="w-3 h-3" /> Detona regla
                          </span>
                        )}
                      </div>
                      <h4 className="text-cuerpo font-medium text-plataformaTexto leading-snug">
                        {item.enunciado}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md-token bg-black/[0.03] border border-black/[0.05] text-plataformaSecundario">
                        Peso: {item.peso}x
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-black/[0.04]">
                    <span className="text-etiqueta text-plataformaSecundario block">
                      Alternativas parametrizadas y escalas de puntuación:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.alternativas.map((alt) => (
                        <div
                          key={alt.idAlternativa}
                          className="p-3 rounded-md-token bg-black/[0.015] border border-black/[0.04] text-xs flex items-center justify-between gap-3"
                        >
                          <span className="text-plataformaTexto font-medium">{alt.texto}</span>
                          <span className="font-mono font-bold text-plataformaAzul bg-plataformaAzul/10 px-2 py-0.5 rounded-md-token shrink-0">
                            {alt.puntaje} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.industrias && item.industrias.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-plataformaSecundario">Aplica a:</span>
                      {item.industrias.map((ind) => (
                        <span key={ind.idIndustria} className="insignia-neutra text-[10px]">
                          {ind.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {itemsFiltrados.length === 0 && (
              <div className="superficie-tarjeta rounded-lg-token p-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
                No se encontraron preguntas que coincidan con los criterios especificados.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg-token bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-plataformaAzul shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-blue-950">
                ¿Cómo funciona el motor de reglas condicionales? (RF09)
              </h4>
              <p className="text-xs text-blue-900/80 mt-0.5">
                Las reglas permiten adaptar dinámicamente el cuestionario según las respuestas previas del proveedor. Cuando el proveedor selecciona la alternativa detonante en el ítem de origen, el ítem de destino se muestra, oculta o deshabilita en tiempo real sin recargar la página.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {reglas.map((r) => {
              const accionInfo = ETIQUETAS_ACCION[r.accion] || ETIQUETAS_ACCION.ocultar;
              const IconoAccion = accionInfo.icono;
              return (
                <div
                  key={r.idRegla}
                  className="superficie-tarjeta rounded-lg-token p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black/[0.12] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    <div className="p-3 rounded-md-token bg-black/[0.02] border border-black/[0.05] sm:max-w-xs flex-1">
                      <div className="text-[10px] uppercase font-bold text-plataformaSecundario mb-0.5">
                        Condición Detonante
                      </div>
                      <div className="text-xs text-plataformaTexto">
                        Si <strong className="font-mono text-plataformaAzul">{r.codigoItemOrigen}</strong> responde:
                      </div>
                      <div className="text-xs font-semibold text-plataformaTexto mt-1 bg-white p-1.5 rounded border border-black/[0.06] truncate">
                        "{r.textoAlternativaDisparadora}"
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-plataformaSecundario shrink-0">
                      <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-black/[0.04] text-[10px] font-mono">
                        <span>ENTONCES</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                      <div className="sm:hidden flex items-center gap-1 text-xs">
                        <span>↓ Entonces</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-md-token bg-black/[0.02] border border-black/[0.05] sm:max-w-xs flex-1">
                      <div className="text-[10px] uppercase font-bold text-plataformaSecundario mb-0.5">
                        Acción sobre Destino
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${accionInfo.clase}`}>
                          <IconoAccion className="w-3 h-3" />
                          {accionInfo.texto}
                        </span>
                        <span className="font-mono font-bold text-xs text-plataformaTexto ml-1">
                          {r.codigoItemDestino}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => borrarRegla(r.idRegla)}
                    title="Eliminar regla condicional"
                    className="p-2 rounded-full hover:bg-rose-50 text-plataformaSecundario hover:text-rose-600 transition-colors cursor-pointer self-end md:self-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {reglas.length === 0 && (
              <div className="superficie-tarjeta rounded-lg-token p-12 text-center text-cuerpo-pequeno text-plataformaSecundario">
                No hay reglas condicionales configuradas todavía.
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarModalNuevoItem && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4 overflow-y-auto py-10">
          <form onSubmit={crearItem} className="contenido-modal max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Nuevo Reactivo</span>
                <h3 className="text-titulo-seccion mt-1">Crear Pregunta de Evaluación</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevoItem(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: ETI-18"
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                    className="campo-entrada w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">Dimensión ESG *</label>
                  <select
                    value={nuevaIdDimension}
                    onChange={(e) => setNuevaIdDimension(e.target.value)}
                    className="campo-select w-full"
                  >
                    {dimensiones.map((d) => (
                      <option key={d.idDimension} value={d.idDimension}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Enunciado de la Pregunta *</label>
                <textarea
                  required
                  rows={3}
                  value={nuevoEnunciado}
                  onChange={(e) => setNuevoEnunciado(e.target.value)}
                  placeholder="Redacte la pregunta técnica para la homologación..."
                  className="campo-entrada w-full h-auto py-2"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Ponderador de Importancia</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={nuevoPeso}
                  onChange={(e) => setNuevoPeso(e.target.value)}
                  className="campo-entrada w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-2">
                  Alternativas de Respuesta y Puntuación (0 a 100)
                </label>
                <div className="space-y-2">
                  {nuevasAlternativas.map((alt, indice) => (
                    <div key={indice} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Texto de la alternativa..."
                        value={alt.texto}
                        onChange={(e) => actualizarAlternativa(indice, 'texto', e.target.value)}
                        className="campo-entrada flex-1 text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={alt.puntaje}
                        onChange={(e) => actualizarAlternativa(indice, 'puntaje', Number(e.target.value))}
                        className="campo-entrada w-20 font-mono text-xs"
                      />
                      {nuevasAlternativas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => quitarFilaAlternativa(indice)}
                          className="p-2 text-plataformaSecundario hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarFilaAlternativa}
                  className="boton-fantasma mt-2 text-xs cursor-pointer"
                >
                  + Agregar otra alternativa
                </button>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-2">Industrias Aplicables</label>
                <div className="flex flex-wrap gap-1.5">
                  {industrias.map((ind) => (
                    <button
                      type="button"
                      key={ind.idIndustria}
                      onClick={() => alternarIndustriaSeleccionada(ind.idIndustria)}
                      className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        nuevasIdsIndustrias.includes(ind.idIndustria)
                          ? 'bg-plataformaTexto text-white font-medium'
                          : 'bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto'
                      }`}
                    >
                      {ind.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setMostrarModalNuevoItem(false)}
                className="boton-secundario cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="boton-primario cursor-pointer">
                Guardar en banco
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalNuevaRegla && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={crearRegla} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Motor Lógico</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Regla Condicional</h3>
                <p className="text-subtexto text-plataformaSecundario mt-0.5">
                  Ramificación automática de ítems en el portal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevaRegla(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">1. Ítem Origen (Disparador)</label>
                <select
                  required
                  value={reglaIdItemOrigen}
                  onChange={(e) => {
                    setReglaIdItemOrigen(e.target.value);
                    setReglaIdAlternativa('');
                  }}
                  className="campo-select w-full"
                >
                  <option value="">Seleccione una pregunta detonante…</option>
                  {items.map((i) => (
                    <option key={i.idItem} value={i.idItem}>
                      {i.codigo} — {i.enunciado.slice(0, 45)}…
                    </option>
                  ))}
                </select>
              </div>

              {itemOrigenSeleccionado && (
                <div>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">
                    2. Respuesta que activa la regla
                  </label>
                  <select
                    required
                    value={reglaIdAlternativa}
                    onChange={(e) => setReglaIdAlternativa(e.target.value)}
                    className="campo-select w-full"
                  >
                    <option value="">Seleccione la alternativa específica…</option>
                    {itemOrigenSeleccionado.alternativas.map((a) => (
                      <option key={a.idAlternativa} value={a.idAlternativa}>
                        {a.texto} ({a.puntaje} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">3. Acción a ejecutar</label>
                <select
                  value={reglaAccion}
                  onChange={(e) => setReglaAccion(e.target.value)}
                  className="campo-select w-full"
                >
                  <option value="ocultar">Ocultar el ítem destino</option>
                  <option value="mostrar">Mostrar el ítem destino</option>
                  <option value="deshabilitar">Deshabilitar el ítem destino</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">4. Ítem Destino (Afectado)</label>
                <select
                  required
                  value={reglaIdItemDestino}
                  onChange={(e) => setReglaIdItemDestino(e.target.value)}
                  className="campo-select w-full"
                >
                  <option value="">Seleccione el reactivo afectado…</option>
                  {items
                    .filter((i) => i.idItem !== Number(reglaIdItemOrigen))
                    .map((i) => (
                      <option key={i.idItem} value={i.idItem}>
                        {i.codigo} — {i.enunciado.slice(0, 45)}…
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setMostrarModalNuevaRegla(false)}
                className="boton-secundario cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="boton-primario cursor-pointer">
                Crear regla
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
