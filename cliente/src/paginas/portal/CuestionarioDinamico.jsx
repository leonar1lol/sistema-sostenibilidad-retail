import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Circle, Lock, ArrowRight, AlertCircle, Paperclip, X, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';
import { calcularVisibilidad } from '../../utilidades/motorReglas.js';
import {
  obtenerCuestionarioPortalApi,
  guardarRespuestaPortalApi,
  finalizarEvaluacionPortalApi,
  listarEvidenciaItemPortalApi,
  subirEvidenciaPortalApi,
  eliminarEvidenciaPortalApi
} from '../../servicios/servicioApi.js';

const TAMANO_MAXIMO_MB = 5;

function ControlEvidencia({ idItem }) {
  const [evidencias, setEvidencias] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEvidenciaItemPortalApi(idItem).then(setEvidencias).catch(() => setEvidencias([]));
  }, [idItem]);

  const alSeleccionarArchivo = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setError(`El archivo supera los ${TAMANO_MAXIMO_MB} MB permitidos.`);
      return;
    }

    setError('');
    setSubiendo(true);
    try {
      const nueva = await subirEvidenciaPortalApi(idItem, archivo);
      setEvidencias((previas) => [...(previas || []), nueva]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const borrar = async (idEvidencia) => {
    try {
      await eliminarEvidenciaPortalApi(idEvidencia);
      setEvidencias((previas) => previas.filter((e) => e.idEvidencia !== idEvidencia));
    } catch (err) {
      setError(err.message);
    }
  };

  if (evidencias === null) return null;

  return (
    <div className="mt-4 pt-4 border-t border-black/[0.04]">
      <span className="text-etiqueta text-plataformaSecundario block mb-2">Evidencia de sustento (opcional)</span>

      {evidencias.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {evidencias.map((ev) => (
            <div key={ev.idEvidencia} className="flex items-center gap-2 text-subtexto text-plataformaTexto bg-black/[0.02] rounded-md-token px-3 py-1.5">
              <Paperclip className="w-3.5 h-3.5 text-plataformaSecundario shrink-0" />
              <span className="truncate flex-1">{ev.nombreArchivo}</span>
              <button type="button" onClick={() => borrar(ev.idEvidencia)} className="text-plataformaSecundario hover:text-red-600 cursor-pointer shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="boton-fantasma text-etiqueta inline-flex items-center gap-1.5 cursor-pointer">
        {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
        <span>{subiendo ? 'Subiendo…' : 'Adjuntar evidencia'}</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={alSeleccionarArchivo} disabled={subiendo} />
      </label>

      {error && <p className="text-subtexto text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

export default function CuestionarioDinamico({ datosProveedor, alFinalizarCuestionario }) {
  const [cargando, setCargando] = useState(true);
  const [items, setItems] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [dimensionActiva, setDimensionActiva] = useState(null);
  const [mensajeInfo, setMensajeInfo] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerCuestionarioPortalApi()
      .then((datos) => {
        setItems(datos.items);
        setReglas(datos.reglas);
        setDimensiones(datos.dimensiones);
        setRespuestas(Object.fromEntries(datos.respuestas.map((r) => [r.idItem, r.idAlternativa])));
        if (datos.mensaje) setMensajeInfo(datos.mensaje);
        const primeraDimensionConItems = datos.dimensiones.find((d) => datos.items.some((i) => i.idDimension === d.idDimension));
        setDimensionActiva(primeraDimensionConItems?.idDimension ?? null);
      })
      .catch((error) => setMensajeError(error.message))
      .finally(() => setCargando(false));
  }, []);

  const visibilidad = useMemo(() => calcularVisibilidad(items, reglas, respuestas), [items, reglas, respuestas]);

  const itemsAplicablesVisibles = useMemo(
    () => items.filter((item) => visibilidad[item.idItem]?.visible && !visibilidad[item.idItem]?.deshabilitado),
    [items, visibilidad]
  );

  const totalRespondidos = itemsAplicablesVisibles.filter((item) => respuestas[item.idItem] != null).length;
  const porcentajeAvance = itemsAplicablesVisibles.length > 0
    ? Math.round((totalRespondidos / itemsAplicablesVisibles.length) * 100)
    : 0;

  const dimensionesConItems = dimensiones.filter((d) => items.some((i) => i.idDimension === d.idDimension && visibilidad[i.idItem]?.visible));

  const itemsDeDimensionActiva = items.filter(
    (item) => item.idDimension === dimensionActiva && visibilidad[item.idItem]?.visible
  );

  const seleccionarAlternativa = useCallback(async (idItem, idAlternativa) => {
    setRespuestas((previas) => ({ ...previas, [idItem]: idAlternativa }));
    try {
      await guardarRespuestaPortalApi(idItem, idAlternativa);
    } catch (error) {
      setMensajeError(`No se pudo guardar la respuesta: ${error.message}`);
    }
  }, []);

  const finalizar = async () => {
    setEnviando(true);
    setMensajeError('');
    try {
      const resultado = await finalizarEvaluacionPortalApi();
      alFinalizarCuestionario(resultado);
    } catch (error) {
      setMensajeError(
        error.itemsFaltantes?.length
          ? `Faltan por responder: ${error.itemsFaltantes.join(', ')}`
          : error.message
      );
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center text-cuerpo-pequeno text-plataformaSecundario">
        Cargando su cuestionario…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <TarjetaBento clasePersonalizada="p-8 text-center shadow-sm-token">
          <AlertCircle className="w-8 h-8 text-plataformaSecundario mx-auto mb-3 opacity-60" />
          <h3 className="text-titulo-seccion text-plataformaTexto mb-2">Cuestionario no disponible todavía</h3>
          <p className="text-cuerpo-pequeno text-plataformaSecundario">
            {mensajeInfo || 'Todavía no hay ítems configurados para su industria. Contacte a su unidad de negocio de referencia.'}
          </p>
        </TarjetaBento>
      </div>
    );
  }

  const todoRespondido = totalRespondidos === itemsAplicablesVisibles.length && itemsAplicablesVisibles.length > 0;
  const dimensionActivaDatos = dimensiones.find((d) => d.idDimension === dimensionActiva);
  
  const itemsDimActivaRespondidos = itemsDeDimensionActiva.filter((i) => respuestas[i.idItem] != null).length;
  const dimensionActivaCompletada = itemsDeDimensionActiva.length > 0 && itemsDimActivaRespondidos === itemsDeDimensionActiva.length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-plataformaAzul/10 text-plataformaAzul rounded-full text-etiqueta font-semibold">
        <span>Paso 3 de 4 • Cuestionario de Sostenibilidad</span>
      </div>

      <TarjetaBento clasePersonalizada="p-6 mb-5 shadow-sm-token">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-etiqueta text-plataformaSecundario block">
              {datosProveedor?.razonSocial} • RUC {datosProveedor?.ruc}
            </span>
            <h2 className="text-titulo-seccion text-plataformaTexto mt-0.5">
              Evaluación de Prácticas
            </h2>
          </div>
          <div className="sm:text-right">
            <span className="text-etiqueta font-mono font-semibold text-plataformaTexto">
              {porcentajeAvance}% completado
            </span>
            <span className="text-subtexto text-plataformaSecundario block">
              {totalRespondidos} de {itemsAplicablesVisibles.length} ítems
            </span>
          </div>
        </div>

        <BarraProgreso porcentaje={porcentajeAvance} altura="h-1" />

        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-black/[0.04] overflow-x-auto pb-1">
          {dimensionesConItems.map((dim) => {
            const itemsDim = items.filter((i) => i.idDimension === dim.idDimension && visibilidad[i.idItem]?.visible);
            const respondidosDim = itemsDim.filter((i) => respuestas[i.idItem] != null).length;
            const completa = itemsDim.length > 0 && respondidosDim === itemsDim.length;

            return (
              <button
                key={dim.idDimension}
                onClick={() => setDimensionActiva(dim.idDimension)}
                className={`px-3.5 py-2 rounded-full text-subtexto font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  dimensionActiva === dim.idDimension
                    ? 'bg-plataformaAzul text-white shadow-xs-token'
                    : completa
                    ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                    : 'bg-black/[0.04] text-plataformaSecundario hover:bg-black/[0.08]'
                }`}
              >
                {completa && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{dim.nombre}</span>
                <div className="flex items-center justify-center bg-black/10 text-current px-1.5 py-0.5 rounded-full text-[10px] ml-1">
                  <span>{respondidosDim}/{itemsDim.length}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        {dimensionActivaDatos?.descripcion && (
          <div className="mt-3 text-cuerpo-pequeno text-plataformaSecundario italic">
            {dimensionActivaDatos.descripcion}
          </div>
        )}
      </TarjetaBento>

      <div className="bg-blue-50/50 border border-blue-100 rounded-md-token p-4 mb-5 flex gap-3 text-cuerpo-pequeno text-blue-800">
        <Info className="w-5 h-5 shrink-0 text-blue-500" />
        <p>Seleccione la respuesta que mejor describe las prácticas de su empresa. Cada pregunta es de selección única. Sus respuestas se guardan automáticamente al seleccionar.</p>
      </div>

      {mensajeError && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200/60 rounded-md-token flex items-center gap-2.5 text-cuerpo-pequeno text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {dimensionActivaCompletada && (
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-md-token flex items-center justify-center gap-3 text-emerald-800 shadow-sm-token"
        >
          <div className="bg-emerald-500 text-white rounded-full p-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-medium text-cuerpo">¡Dimensión completada!</span>
        </motion.div>
      )}

      <div className="space-y-5">
        {itemsDeDimensionActiva.map((item, indice) => {
          const respuestaElegida = respuestas[item.idItem];
          const deshabilitado = visibilidad[item.idItem]?.deshabilitado;

          return (
            <TarjetaBento key={item.idItem} clasePersonalizada={`p-6 shadow-sm-token ${deshabilitado ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="insignia-info font-mono font-bold">
                  Pregunta {indice + 1} de {itemsDeDimensionActiva.length}
                </span>
                <span className="text-subtexto text-plataformaSecundario font-mono px-2 bg-black/[0.03] rounded">
                  {item.codigo}
                </span>
                {deshabilitado && (
                  <span className="insignia-neutra flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Deshabilitado por regla condicional
                  </span>
                )}
              </div>
              <h3 className="text-cuerpo font-medium text-plataformaTexto mb-4">{item.enunciado}</h3>

              <div className="space-y-2.5">
                {item.alternativas.map((alternativa) => {
                  const estaSeleccionada = respuestaElegida === alternativa.idAlternativa;
                  return (
                    <div
                      key={alternativa.idAlternativa}
                      onClick={() => !deshabilitado && seleccionarAlternativa(item.idItem, alternativa.idAlternativa)}
                      className={`p-4 rounded-md-token border transition-all duration-180 flex items-center gap-3 ${
                        deshabilitado ? 'cursor-not-allowed border-black/[0.06]' : 'cursor-pointer'
                      } ${
                        estaSeleccionada
                          ? 'border-plataformaAzul bg-plataformaAzul/[0.04] ring-1 ring-plataformaAzul'
                          : 'border-black/[0.06] bg-black/[0.01] hover:border-black/[0.12] hover:bg-black/[0.02]'
                      }`}
                    >
                      {estaSeleccionada ? (
                        <CheckCircle2 className="w-5 h-5 text-plataformaAzul shrink-0 stroke-[2]" />
                      ) : (
                        <Circle className="w-5 h-5 text-plataformaSecundario/40 shrink-0 stroke-[1.5]" />
                      )}
                      <span className="text-cuerpo text-plataformaTexto">{alternativa.texto}</span>
                    </div>
                  );
                })}
              </div>

              {respuestaElegida != null && !deshabilitado && <ControlEvidencia idItem={item.idItem} />}
            </TarjetaBento>
          );
        })}
      </div>

      <div className="flex items-center justify-end pt-8 pb-4">
        {todoRespondido ? (
          <motion.button
            whileHover={{ scale: enviando ? 1 : 1.02 }}
            whileTap={{ scale: enviando ? 1 : 0.98 }}
            type="button"
            disabled={enviando}
            onClick={finalizar}
            className={`w-full sm:w-auto px-8 py-4 rounded-lg-token text-white font-semibold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md-token ${enviando ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>{enviando ? 'Enviando resultados...' : '¡Listo! Enviar y ver resultados'}</span>
            <CheckCircle2 className="w-6 h-6" />
          </motion.button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="boton-primario opacity-40 cursor-not-allowed"
          >
            <span>Finalizar evaluación</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        )}
      </div>
    </div>
  );
}
