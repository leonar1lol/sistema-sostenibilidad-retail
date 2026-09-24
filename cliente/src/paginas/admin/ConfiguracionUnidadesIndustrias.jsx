import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  RotateCcw,
  Scale
} from 'lucide-react';
import {
  listarUnidadesApi,
  crearUnidadApi,
  editarUnidadApi,
  cambiarEstadoUnidadApi,
  listarIndustriasApi,
  crearIndustriaApi,
  editarIndustriaApi,
  cambiarEstadoIndustriaApi,
  listarDimensionesApi,
  crearDimensionApi,
  editarDimensionApi,
  cambiarEstadoDimensionApi,
  actualizarPesosDimensionesApi,
  obtenerConfiguracionCriticidadApi,
  actualizarConfiguracionPesosApi,
  actualizarConfiguracionCriticidadPorTipoApi
} from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

const TIPOS_INDUSTRIA = ['Productos (comerciales)', 'Activos, servicios y suministros'];

const obtenerIniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

export default function ConfiguracionUnidadesIndustrias({ alRegistrarAuditoria }) {
  const [subPestana, setSubPestana] = useState('unidades');
  const [unidades, setUnidades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [dimensiones, setDimensiones] = useState([]);
  const [pesosEdicion, setPesosEdicion] = useState({});
  const [configCriticidad, setConfigCriticidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  const [unidadEdicion, setUnidadEdicion] = useState(null);
  const [mostrarModalNuevaUnidad, setMostrarModalNuevaUnidad] = useState(false);
  const [nuevoNombreUnidad, setNuevoNombreUnidad] = useState('');
  const [nuevoGerenteUnidad, setNuevoGerenteUnidad] = useState('');
  const [nuevoRequiereDocumento, setNuevoRequiereDocumento] = useState(false);

  const [industriaEdicion, setIndustriaEdicion] = useState(null);
  const [mostrarModalNuevaIndustria, setMostrarModalNuevaIndustria] = useState(false);
  const [nuevoNombreIndustria, setNuevoNombreIndustria] = useState('');
  const [nuevoTipoIndustria, setNuevoTipoIndustria] = useState(TIPOS_INDUSTRIA[0]);

  const [dimensionEdicion, setDimensionEdicion] = useState(null);
  const [mostrarModalNuevaDimension, setMostrarModalNuevaDimension] = useState(false);
  const [nuevoNombreDimension, setNuevoNombreDimension] = useState('');

  const [mensajeAviso, setMensajeAviso] = useState('');
  const [mensajeError, setMensajeError] = useMensajeTemporal();

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [unidadesRemotas, industriasRemotas, dimensionesRemotas, criticidadRemota] = await Promise.all([
        listarUnidadesApi(incluirInactivos),
        listarIndustriasApi(incluirInactivos),
        listarDimensionesApi(incluirInactivos),
        obtenerConfiguracionCriticidadApi()
      ]);
      setUnidades(unidadesRemotas);
      setIndustrias(industriasRemotas);
      setDimensiones(dimensionesRemotas);
      setPesosEdicion(Object.fromEntries(dimensionesRemotas.map((d) => [d.idDimension, Math.round(d.peso * 100)])));
      setConfigCriticidad(criticidadRemota);
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
    setMensajeAviso(texto);
    setTimeout(() => setMensajeAviso(''), 3000);
  };

  const guardarEdicionUnidad = async (e) => {
    e.preventDefault();
    try {
      await editarUnidadApi(unidadEdicion.idUnidad, {
        nombre: unidadEdicion.nombre,
        gerente: unidadEdicion.gerente,
        requiereDocumento: unidadEdicion.requiereDocumento
      });
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
      await crearUnidadApi({ nombre: nuevoNombreUnidad, gerente: nuevoGerenteUnidad, requiereDocumento: nuevoRequiereDocumento });
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Registro de nueva unidad de negocio',
          modulo: 'Configuración Paramétrica',
          detalles: `Incorporada unidad ${nuevoNombreUnidad}`
        });
      }
      setMostrarModalNuevaUnidad(false);
      setNuevoNombreUnidad('');
      setNuevoGerenteUnidad('');
      setNuevoRequiereDocumento(false);
      mostrarAviso('Nueva unidad de negocio incorporada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstadoUnidad = async (unidad) => {
    try {
      await cambiarEstadoUnidadApi(unidad.idUnidad, unidad.activo === false);
      await cargarDatos();
      mostrarAviso(unidad.activo === false ? 'Unidad de negocio reactivada.' : 'Unidad de negocio eliminada (borrado lógico).');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const agregarNuevaIndustria = async (e) => {
    e.preventDefault();
    try {
      await crearIndustriaApi({ nombre: nuevoNombreIndustria, tipo: nuevoTipoIndustria });
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Registro de nueva industria',
          modulo: 'Configuración Paramétrica',
          detalles: `Incorporada industria ${nuevoNombreIndustria}`
        });
      }
      setMostrarModalNuevaIndustria(false);
      setNuevoNombreIndustria('');
      setNuevoTipoIndustria(TIPOS_INDUSTRIA[0]);
      mostrarAviso('Nueva industria incorporada al catálogo corporativo.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const guardarEdicionIndustria = async (e) => {
    e.preventDefault();
    try {
      await editarIndustriaApi(industriaEdicion.idIndustria, { nombre: industriaEdicion.nombre, tipo: industriaEdicion.tipo });
      await cargarDatos();
      setIndustriaEdicion(null);
      mostrarAviso('Industria actualizada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstadoIndustria = async (industria) => {
    try {
      await cambiarEstadoIndustriaApi(industria.idIndustria, industria.activo === false);
      await cargarDatos();
      mostrarAviso(industria.activo === false ? 'Industria reactivada.' : 'Industria eliminada (borrado lógico).');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const agregarNuevaDimension = async (e) => {
    e.preventDefault();
    try {
      await crearDimensionApi({ nombre: nuevoNombreDimension });
      await cargarDatos();
      setMostrarModalNuevaDimension(false);
      setNuevoNombreDimension('');
      mostrarAviso('Nueva dimensión creada con peso 0%. Ajuste los pesos para que sumen 100%.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const guardarEdicionDimension = async (e) => {
    e.preventDefault();
    try {
      await editarDimensionApi(dimensionEdicion.idDimension, { nombre: dimensionEdicion.nombre });
      await cargarDatos();
      setDimensionEdicion(null);
      mostrarAviso('Dimensión actualizada.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cambiarEstadoDimension = async (dimension) => {
    try {
      await cambiarEstadoDimensionApi(dimension.idDimension, dimension.activo === false);
      await cargarDatos();
      mostrarAviso(dimension.activo === false ? 'Dimensión reactivada.' : 'Dimensión eliminada (borrado lógico).');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const guardarPesosCriticidad = async (e) => {
    e.preventDefault();
    try {
      const nuevaConfig = await actualizarConfiguracionPesosApi({
        pesoAsg: Number(configCriticidad.pesos.pesoAsg),
        pesoNegocio: Number(configCriticidad.pesos.pesoNegocio),
        pesoOrigen: Number(configCriticidad.pesos.pesoOrigen),
        pesoParticipacion: Number(configCriticidad.pesos.pesoParticipacion),
        criticidadLocal: Number(configCriticidad.pesos.criticidadLocal),
        criticidadInternacional: Number(configCriticidad.pesos.criticidadInternacional)
      });
      setConfigCriticidad(nuevaConfig);
      mostrarAviso('Pesos del modelo de criticidad actualizados.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const guardarCriticidadPorTipo = async (fila) => {
    try {
      const nuevaConfig = await actualizarConfiguracionCriticidadPorTipoApi(fila.tipoIndustria, fila);
      setConfigCriticidad(nuevaConfig);
      mostrarAviso(`Configuración de criticidad para "${fila.tipoIndustria}" actualizada.`);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const actualizarCampoPesos = (campo, valor) => {
    setConfigCriticidad((actual) => ({ ...actual, pesos: { ...actual.pesos, [campo]: valor } }));
  };

  const actualizarCampoCriticidadPorTipo = (tipoIndustria, campo, valor) => {
    setConfigCriticidad((actual) => ({
      ...actual,
      criticidad: actual.criticidad.map((c) => (c.tipoIndustria === tipoIndustria ? { ...c, [campo]: valor } : c))
    }));
  };

  const sumaPesosCriticidad = configCriticidad
    ? Number(configCriticidad.pesos.pesoAsg) + Number(configCriticidad.pesos.pesoNegocio) +
      Number(configCriticidad.pesos.pesoOrigen) + Number(configCriticidad.pesos.pesoParticipacion)
    : 1;

  const dimensionesActivas = dimensiones.filter((d) => d.activo !== false);
  const sumaPesosEdicion = dimensionesActivas.reduce((acc, d) => acc + Number(pesosEdicion[d.idDimension] || 0), 0);

  const guardarPesosDimensiones = async (e) => {
    e.preventDefault();
    try {
      const pesos = dimensionesActivas.map((d) => ({ idDimension: d.idDimension, peso: Number(pesosEdicion[d.idDimension]) / 100 }));
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
          <button
            onClick={() => setSubPestana('criticidad')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              subPestana === 'criticidad' ? 'border-b-2 border-plataformaAzul text-plataformaTexto' : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Criticidad y Pesos</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {(subPestana === 'unidades' || subPestana === 'industrias' || subPestana === 'dimensiones') && (
            <label className="flex items-center gap-1.5 text-cuerpo-pequeno text-plataformaSecundario cursor-pointer">
              <input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />
              Incluir eliminados
            </label>
          )}
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
          {subPestana === 'dimensiones' && (
            <button onClick={() => setMostrarModalNuevaDimension(true)} className="boton-primario h-9 px-4 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva dimensión</span>
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : subPestana === 'unidades' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unidades.map((u) => (
            <div key={u.idUnidad} className={`superficie-tarjeta superficie-tarjeta-hover rounded-lg-token p-6 flex flex-col justify-between ${u.activo === false ? 'opacity-50' : ''}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-sm-token bg-plataformaCorporativo text-white flex items-center justify-center font-bold text-xs">
                    {obtenerIniciales(u.nombre)}
                  </div>
                  {u.requiereDocumento && (
                    <span className="insignia-advertencia uppercase">Requiere documento</span>
                  )}
                  {u.activo === false && (
                    <span className="insignia-neutra uppercase">Eliminada</span>
                  )}
                </div>
                <h4 className="text-titulo-tarjeta">{u.nombre}</h4>
                <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
                  Gerente responsable: <span className="font-medium text-plataformaTexto">{u.gerente || 'Sin asignar'}</span>
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-end gap-1">
                <button
                  onClick={() => setUnidadEdicion(u)}
                  className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => cambiarEstadoUnidad(u)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    u.activo === false ? 'hover:bg-emerald-50 text-plataformaSecundario hover:text-emerald-600' : 'hover:bg-red-50 text-plataformaSecundario hover:text-red-600'
                  }`}
                  title={u.activo === false ? 'Reactivar unidad' : 'Eliminar unidad (borrado lógico)'}
                >
                  {u.activo === false ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
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
                  <th>Sector / Industria</th>
                  <th>Tipo</th>
                  <th className="text-right">Administrar</th>
                </tr>
              </thead>
              <tbody>
                {industrias.map((ind) => (
                  <tr key={ind.idIndustria} className={ind.activo === false ? 'opacity-50' : ''}>
                    <td className="py-3.5 px-4 font-medium text-plataformaTexto">
                      {ind.nombre} {ind.activo === false && <span className="insignia-neutra uppercase ml-1.5">Eliminada</span>}
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">{ind.tipo}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button onClick={() => setIndustriaEdicion(ind)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cambiarEstadoIndustria(ind)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          ind.activo === false ? 'hover:bg-emerald-50 text-plataformaSecundario hover:text-emerald-600' : 'hover:bg-red-50 text-plataformaSecundario hover:text-red-600'
                        }`}
                        title={ind.activo === false ? 'Reactivar industria' : 'Eliminar industria (borrado lógico)'}
                      >
                        {ind.activo === false ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subPestana === 'dimensiones' ? (
        <div className="space-y-5">
          <form onSubmit={guardarPesosDimensiones} className="superficie-tarjeta rounded-lg-token p-6 space-y-4">
            <p className="text-cuerpo-pequeno text-plataformaSecundario">
              Los pesos de todas las dimensiones activas deben sumar 100%. Se usan para calcular el puntaje general de cada evaluación (RF18).
            </p>
            {dimensionesActivas.map((d) => (
              <div key={d.idDimension} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-64">
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">{d.nombre}</span>
                  <button type="button" onClick={() => setDimensionEdicion(d)} className="p-1.5 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarEstadoDimension(d)}
                    className="p-1.5 rounded-full hover:bg-red-50 text-plataformaSecundario hover:text-red-600 transition-colors cursor-pointer"
                    title="Eliminar dimensión (borrado lógico)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

          {incluirInactivos && dimensiones.some((d) => d.activo === false) && (
            <div className="superficie-tarjeta rounded-lg-token p-6 space-y-2">
              <span className="text-etiqueta text-plataformaSecundario block mb-2">Dimensiones eliminadas</span>
              {dimensiones.filter((d) => d.activo === false).map((d) => (
                <div key={d.idDimension} className="flex items-center justify-between gap-4 p-2.5 rounded-sm-token bg-black/[0.02] opacity-60">
                  <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">{d.nombre}</span>
                  <button
                    type="button"
                    onClick={() => cambiarEstadoDimension(d)}
                    className="p-1.5 rounded-full hover:bg-emerald-50 text-plataformaSecundario hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Reactivar dimensión"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {subPestana === 'criticidad' && configCriticidad && (
        <div className="space-y-5">
          <form onSubmit={guardarPesosCriticidad} className="superficie-tarjeta rounded-lg-token p-6 space-y-4">
            <div>
              <h3 className="text-titulo-tarjeta">Pesos del puntaje final</h3>
              <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
                Combina el puntaje ASG del cuestionario con factores de riesgo del proveedor. Deben sumar 100%.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['pesoAsg', 'Peso ASG'],
                ['pesoNegocio', 'Peso Negocio'],
                ['pesoOrigen', 'Peso Origen'],
                ['pesoParticipacion', 'Peso Participación']
              ].map(([campo, etiqueta]) => (
                <div key={campo}>
                  <label className="text-etiqueta text-plataformaSecundario block mb-1">{etiqueta}</label>
                  <input
                    type="number" step="0.01" min="0" max="1"
                    value={configCriticidad.pesos[campo]}
                    onChange={(e) => actualizarCampoPesos(campo, Number(e.target.value))}
                    className="campo-entrada w-full font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Criticidad local (proveedor peruano)</label>
                <input type="number" step="0.01" value={configCriticidad.pesos.criticidadLocal} onChange={(e) => actualizarCampoPesos('criticidadLocal', Number(e.target.value))} className="campo-entrada w-full font-mono" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Criticidad internacional</label>
                <input type="number" step="0.01" value={configCriticidad.pesos.criticidadInternacional} onChange={(e) => actualizarCampoPesos('criticidadInternacional', Number(e.target.value))} className="campo-entrada w-full font-mono" />
              </div>
            </div>
            <div className={`flex items-center justify-between pt-4 border-t border-black/[0.06] ${Math.abs(sumaPesosCriticidad - 1) > 0.001 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span className="text-cuerpo-pequeno font-semibold">Suma total: {Math.round(sumaPesosCriticidad * 100)}%</span>
              <button type="submit" disabled={Math.abs(sumaPesosCriticidad - 1) > 0.001} className="boton-primario disabled:opacity-40 disabled:cursor-not-allowed">
                Guardar pesos
              </button>
            </div>
          </form>

          {configCriticidad.criticidad.map((fila) => (
            <div key={fila.tipoIndustria} className="superficie-tarjeta rounded-lg-token p-6 space-y-4">
              <h3 className="text-titulo-tarjeta">{fila.tipoIndustria}</h3>
              <div>
                <span className="text-etiqueta text-plataformaSecundario block mb-2">Criticidad de negocio</span>
                <div className="grid grid-cols-3 gap-3">
                  {[['criticoAlto', 'Alto'], ['criticoMedio', 'Medio'], ['criticoBajo', 'Bajo']].map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <label className="text-subtexto text-plataformaSecundario block mb-1">{etiqueta}</label>
                      <input type="number" step="0.01" value={fila[campo]} onChange={(e) => actualizarCampoCriticidadPorTipo(fila.tipoIndustria, campo, Number(e.target.value))} className="campo-entrada w-full font-mono" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-etiqueta text-plataformaSecundario block mb-2">Criticidad de participación</span>
                <div className="grid grid-cols-3 gap-3">
                  {[['participacionAlta', 'Alta'], ['participacionMedia', 'Media'], ['participacionBaja', 'Baja']].map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <label className="text-subtexto text-plataformaSecundario block mb-1">{etiqueta}</label>
                      <input type="number" step="0.01" value={fila[campo]} onChange={(e) => actualizarCampoCriticidadPorTipo(fila.tipoIndustria, campo, Number(e.target.value))} className="campo-entrada w-full font-mono" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-etiqueta text-plataformaSecundario block mb-2">Umbrales de nivel de riesgo</span>
                <div className="grid grid-cols-2 gap-3">
                  {[['umbralBajo', 'Bajo (bajo esto = riesgo Alto)'], ['umbralMedio', 'Medio (bajo esto = riesgo Medio)']].map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <label className="text-subtexto text-plataformaSecundario block mb-1">{etiqueta}</label>
                      <input type="number" step="0.01" value={fila[campo]} onChange={(e) => actualizarCampoCriticidadPorTipo(fila.tipoIndustria, campo, Number(e.target.value))} className="campo-entrada w-full font-mono" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-black/[0.06]">
                <button type="button" onClick={() => guardarCriticidadPorTipo(fila)} className="boton-primario">
                  Guardar "{fila.tipoIndustria}"
                </button>
              </div>
            </div>
          ))}
        </div>
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
              <label className="flex items-center gap-2 text-cuerpo-pequeno text-plataformaTexto cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!unidadEdicion.requiereDocumento}
                  onChange={(e) => setUnidadEdicion({ ...unidadEdicion, requiereDocumento: e.target.checked })}
                />
                Exigir al menos un documento de sustento para finalizar evaluaciones de esta unidad
              </label>
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
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input type="text" required value={nuevoNombreUnidad} onChange={(e) => setNuevoNombreUnidad(e.target.value)} className="campo-entrada w-full" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Gerente responsable</label>
                <input type="text" value={nuevoGerenteUnidad} onChange={(e) => setNuevoGerenteUnidad(e.target.value)} className="campo-entrada w-full" />
              </div>
              <label className="flex items-center gap-2 text-cuerpo-pequeno text-plataformaTexto cursor-pointer">
                <input type="checkbox" checked={nuevoRequiereDocumento} onChange={(e) => setNuevoRequiereDocumento(e.target.checked)} />
                Exigir al menos un documento de sustento para finalizar evaluaciones de esta unidad
              </label>
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
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre de la Industria</label>
                <input type="text" required placeholder="ej. Energía, Petróleo y Minería" value={nuevoNombreIndustria} onChange={(e) => setNuevoNombreIndustria(e.target.value)} className="campo-entrada w-full" />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Tipo</label>
                <select value={nuevoTipoIndustria} onChange={(e) => setNuevoTipoIndustria(e.target.value)} className="campo-select w-full">
                  {TIPOS_INDUSTRIA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevaIndustria(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Agregar industria</button>
            </div>
          </form>
        </div>
      )}

      {industriaEdicion && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={guardarEdicionIndustria} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Catálogo</span>
                <h3 className="text-titulo-seccion mt-1">Editar {industriaEdicion.nombre}</h3>
              </div>
              <button type="button" onClick={() => setIndustriaEdicion(null)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={industriaEdicion.nombre}
                  onChange={(e) => setIndustriaEdicion({ ...industriaEdicion, nombre: e.target.value })}
                  className="campo-entrada w-full"
                />
              </div>
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Tipo</label>
                <select
                  value={industriaEdicion.tipo}
                  onChange={(e) => setIndustriaEdicion({ ...industriaEdicion, tipo: e.target.value })}
                  className="campo-select w-full"
                >
                  {TIPOS_INDUSTRIA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIndustriaEdicion(null)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalNuevaDimension && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={agregarNuevaDimension} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Catálogo</span>
                <h3 className="text-titulo-seccion mt-1">Nueva Dimensión</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevaDimension(false)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre de la dimensión</label>
                <input type="text" required placeholder="ej. Innovación" value={nuevoNombreDimension} onChange={(e) => setNuevoNombreDimension(e.target.value)} className="campo-entrada w-full" />
              </div>
              <p className="text-subtexto text-plataformaSecundario">
                La nueva dimensión se crea con peso 0%. Ajuste los pesos en la pestaña "Dimensiones y Pesos" para que sumen 100% entre todas.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarModalNuevaDimension(false)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Crear dimensión</button>
            </div>
          </form>
        </div>
      )}

      {dimensionEdicion && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={guardarEdicionDimension} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">Catálogo</span>
                <h3 className="text-titulo-seccion mt-1">Editar {dimensionEdicion.nombre}</h3>
              </div>
              <button type="button" onClick={() => setDimensionEdicion(null)} className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={dimensionEdicion.nombre}
                  onChange={(e) => setDimensionEdicion({ ...dimensionEdicion, nombre: e.target.value })}
                  className="campo-entrada w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDimensionEdicion(null)} className="boton-secundario">Cancelar</button>
              <button type="submit" className="boton-primario">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
