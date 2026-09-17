import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  listarUnidadesApi,
  crearUnidadApi,
  editarUnidadApi,
  listarIndustriasApi,
  crearIndustriaApi,
  editarIndustriaApi,
  listarDimensionesApi,
  actualizarPesosDimensionesApi
} from '../../servicios/servicioApi.js';

export default function ConfiguracionUnidadesIndustrias({ alRegistrarAuditoria }) {
  const [subPestana, setSubPestana] = useState('unidades');
  const [unidades, setUnidades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [pesosEdicion, setPesosEdicion] = useState({});
  const [cargando, setCargando] = useState(true);

  const [unidadEdicion, setUnidadEdicion] = useState(null);
  const [mostrarModalNuevaUnidad, setMostrarModalNuevaUnidad] = useState(false);
  const [nuevoCodigoUnidad, setNuevoCodigoUnidad] = useState('');
  const [nuevoNombreUnidad, setNuevoNombreUnidad] = useState('');
  const [nuevoGerenteUnidad, setNuevoGerenteUnidad] = useState('');

  const [mostrarModalNuevaIndustria, setMostrarModalNuevaIndustria] = useState(false);
  const [nuevoCodigoIndustria, setNuevoCodigoIndustria] = useState('');
  const [nuevoNombreIndustria, setNuevoNombreIndustria] = useState('');

  const [mensajeAviso, setMensajeAviso] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [unidadesRemotas, industriasRemotas, dimensionesRemotas] = await Promise.all([
        listarUnidadesApi(),
        listarIndustriasApi(),
        listarDimensionesApi()
      ]);
      setUnidades(unidadesRemotas);
      setIndustrias(industriasRemotas);
      setDimensiones(dimensionesRemotas);
      setPesosEdicion(Object.fromEntries(dimensionesRemotas.map((d) => [d.idDimension, Math.round(d.peso * 100)])));
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
    setMensajeAviso(texto);
    setTimeout(() => setMensajeAviso(''), 3000);
  };

  const guardarEdicionUnidad = async (e) => {
    e.preventDefault();
    try {
      await editarUnidadApi(unidadEdicion.idUnidad, { nombre: unidadEdicion.nombre, gerente: unidadEdicion.gerente });
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Actualización de unidad de negocio',
          modulo: 'Configuración Paramétrica',
          detalles: `Modificada unidad ${unidadEdicion.nombre} (Gerente: ${unidadEdicion.gerente})`
        });
      }
      setUnidadEdicion(null);
      mostrarAviso('Datos de la unidad de negocio actualizados.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const agregarNuevaUnidad = async (e) => {
    e.preventDefault();
    try {
      await crearUnidadApi({ codigo: nuevoCodigoUnidad, nombre: nuevoNombreUnidad, gerente: nuevoGerenteUnidad });
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Registro de nueva unidad de negocio',
          modulo: 'Configuración Paramétrica',
          detalles: `Incorporada unidad ${nuevoNombreUnidad} (${nuevoCodigoUnidad})`
        });
      }
      setMostrarModalNuevaUnidad(false);
      setNuevoCodigoUnidad('');
      setNuevoNombreUnidad('');
      setNuevoGerenteUnidad('');
      mostrarAviso('Nueva unidad de negocio incorporada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const agregarNuevaIndustria = async (e) => {
    e.preventDefault();
    try {
      await crearIndustriaApi({ codigo: nuevoCodigoIndustria, nombre: nuevoNombreIndustria });
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Registro de nueva industria',
          modulo: 'Configuración Paramétrica',
          detalles: `Incorporada industria ${nuevoNombreIndustria} (${nuevoCodigoIndustria})`
        });
      }
      setMostrarModalNuevaIndustria(false);
      setNuevoCodigoIndustria('');
      setNuevoNombreIndustria('');
      mostrarAviso('Nueva industria incorporada al catálogo corporativo.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const sumaPesosEdicion = Object.values(pesosEdicion).reduce((acc, v) => acc + Number(v || 0), 0);

  const guardarPesosDimensiones = async (e) => {
    e.preventDefault();
    try {
      const pesos = dimensiones.map((d) => ({ idDimension: d.idDimension, peso: Number(pesosEdicion[d.idDimension]) / 100 }));
      await actualizarPesosDimensionesApi(pesos);
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Actualización de pesos de dimensiones',
          modulo: 'Configuración Paramétrica',
          detalles: 'Se redistribuyeron los pesos de las dimensiones de sostenibilidad'
        });
      }
      mostrarAviso('Pesos de dimensiones actualizados.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {mensajeAviso && (
        <div className="toast-notificacion fixed top-20 right-6 z-50 px-5 py-3 rounded-full text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeAviso}</span>
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
            Configuración Paramétrica (RF04, RF05, RF08)
          </span>
          <h2 className="text-titulo-seccion">
            Unidades, Industrias y Dimensiones
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Mantenimiento del catálogo de unidades de negocio, sectores industriales y pesos de las dimensiones ESG.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/[0.06] mb-4">
        <nav className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setSubPestana('unidades')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              subPestana === 'unidades' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Unidades de Negocio ({unidades.length})
          </button>
          <button
            onClick={() => setSubPestana('industrias')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              subPestana === 'industrias' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Catálogo de Industrias ({industrias.length})
          </button>
          <button
            onClick={() => setSubPestana('dimensiones')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              subPestana === 'dimensiones' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Dimensiones y Pesos
          </button>
        </nav>

        {subPestana === 'unidades' && (
          <button onClick={() => setMostrarModalNuevaUnidad(true)} className="boton-primario h-9 px-4 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva unidad</span>
          </button>
        )}
        {subPestana === 'industrias' && (
          <button onClick={() => setMostrarModalNuevaIndustria(true)} className="boton-primario h-9 px-4 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva industria</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : subPestana === 'unidades' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unidades.map((u) => (
            <div key={u.idUnidad} className="superficie-tarjeta superficie-tarjeta-hover rounded-lg-token p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-sm-token bg-plataformaCorporativo text-white flex items-center justify-center font-bold text-xs">
                    {u.codigo}
                  </div>
                </div>
                <h4 className="text-titulo-tarjeta">{u.nombre}</h4>
                <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
                  Gerente responsable: <span className="font-medium text-plataformaTexto">{u.gerente || 'Sin asignar'}</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-end">
                <button
                  onClick={() => setUnidadEdicion(u)}
                  className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : subPestana === 'industrias' ? (
        <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tabla-premium w-full text-left">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Sector / Industria</th>
                </tr>
              </thead>
              <tbody>
                {industrias.map((ind) => (
                  <tr key={ind.idIndustria}>
                    <td className="py-3.5 px-4 font-mono font-medium text-plataformaAzul">{ind.codigo}</td>
                    <td className="py-3.5 px-4 font-medium text-plataformaTexto">{ind.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={guardarPesosDimensiones} className="superficie-tarjeta rounded-lg-token p-6 space-y-4">
          <p className="text-cuerpo-pequeno text-plataformaSecundario">
            Los pesos de todas las dimensiones deben sumar 100%. Se usan para calcular el puntaje general de cada evaluación (RF18).
          </p>
          {dimensiones.map((d) => (
            <div key={d.idDimension} className="flex items-center justify-between gap-4">
              <span className="text-cuerpo-pequeno font-medium text-plataformaTexto w-48">{d.nombre} ({d.codigo})</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pesosEdicion[d.idDimension] ?? 0}
                  onChange={(e) => setPesosEdicion({ ...pesosEdicion, [d.idDimension]: e.target.value })}
                  className="campo-entrada w-24 font-mono text-right"
                />
                <span className="text-cuerpo-pequeno text-plataformaSecundario">%</span>
              </div>
            </div>
          ))}
          <div className={`flex items-center justify-between pt-4 border-t border-black/[0.06] ${sumaPesosEdicion !== 100 ? 'text-red-600' : 'text-emerald-600'}`}>
            <span className="text-cuerpo-pequeno font-semibold">Suma total: {sumaPesosEdicion}%</span>
            <button type="submit" disabled={sumaPesosEdicion !== 100} className="boton-primario disabled:opacity-40 disabled:cursor-not-allowed">
              Guardar pesos
            </button>
          </div>
        </form>
      )}

      {unidadEdicion && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={guardarEdicionUnidad} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Configuración</span>
                <h3 className="text-titulo-seccion mt-1">Editar {unidadEdicion.nombre}</h3>
              </div>
              <button type="button" onClick={() => setUnidadEdicion(null)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={unidadEdicion.nombre}
                  onChange={(e) => setUnidadEdicion({ ...unidadEdicion, nombre: e.target.value })}
                  className="campo-entrada w-full"
                />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Gerente responsable</label>
                <input
                  type="text"
                  value={unidadEdicion.gerente || ''}
                  onChange={(e) => setUnidadEdicion({ ...unidadEdicion, gerente: e.target.value })}
                  className="campo-entrada w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setUnidadEdicion(null)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalNuevaUnidad && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={agregarNuevaUnidad} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Catálogo</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Unidad de Negocio</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevaUnidad(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Código</label>
                <input type="text" required placeholder="ej. NPV" value={nuevoCodigoUnidad} onChange={(e) => setNuevoCodigoUnidad(e.target.value)} className="campo-entrada w-full font-mono" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input type="text" required value={nuevoNombreUnidad} onChange={(e) => setNuevoNombreUnidad(e.target.value)} className="campo-entrada w-full" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Gerente responsable</label>
                <input type="text" value={nuevoGerenteUnidad} onChange={(e) => setNuevoGerenteUnidad(e.target.value)} className="campo-entrada w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevaUnidad(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Agregar unidad</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalNuevaIndustria && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={agregarNuevaIndustria} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Catálogo</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Industria</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevaIndustria(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Código de Sector</label>
                <input type="text" required placeholder="ej. ENE" value={nuevoCodigoIndustria} onChange={(e) => setNuevoCodigoIndustria(e.target.value)} className="campo-entrada w-full font-mono" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre de la Industria</label>
                <input type="text" required placeholder="ej. Energía, Petróleo y Minería" value={nuevoNombreIndustria} onChange={(e) => setNuevoNombreIndustria(e.target.value)} className="campo-entrada w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevaIndustria(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Agregar industria</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
