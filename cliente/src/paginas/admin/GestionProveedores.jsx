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
  Download
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
          <span className="truncate flex-1">{ev.codigoItem} — {ev.nombreArchivo}</span>
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
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
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

  const proveedoresFiltrados = proveedores.filter((item) => {
    const coincideTexto =
      item.razonSocial.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      item.ruc.includes(terminoBusqueda);
    const coincideUnidad = filtroUnidad === 'todas' || item.unidad === filtroUnidad;
    const coincideCritico = !filtroSoloCriticos || item.esCritico;
    return coincideTexto && coincideUnidad && coincideCritico;
  });

  const mostrarAviso = (texto) => {
    setMensajeNotificacion(texto);
    setTimeout(() => setMensajeNotificacion(''), 3000);
  };

  const alternarCritico = async (prov) => {
    try {
      await alternarProveedorCriticoApi(prov.idProveedor, !prov.esCritico);
      await cargarDatos();
      mostrarAviso('Estado de criticidad actualizado.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const registrarNuevoProveedor = async (e) => {
    e.preventDefault();
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

          <div className="flex items-center gap-2">
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
                <th className="text-center">Crítico</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-plataformaSecundario">
                    Cargando datos reales desde el servidor…
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="estado-vacio py-12 text-center text-plataformaSecundario flex flex-col items-center">
                      <Search className="w-8 h-8 mb-3 opacity-50" />
                      <span>No se encontraron proveedores que coincidan con los criterios de búsqueda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((prov) => (
                  <tr key={prov.idProveedor} onClick={() => setProveedorSeleccionado(prov)} className="cursor-pointer">
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
                      {prov.industria}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); alternarCritico(prov); }}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {proveedorSeleccionado && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <div className="contenido-modal max-w-lg w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Ficha de Sostenibilidad
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  {proveedorSeleccionado.razonSocial}
                </h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario">
                  RUC {proveedorSeleccionado.ruc} • {proveedorSeleccionado.unidad}
                </p>
              </div>
              <button
                onClick={() => setProveedorSeleccionado(null)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 my-6">
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

              {proveedorSeleccionado.dimensiones ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(proveedorSeleccionado.dimensiones).map(([codigo, valor]) => (
                    <div key={codigo} className="p-3 rounded-md-token bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                      <span className="text-subtexto text-plataformaSecundario">{codigo}</span>
                      <span className="font-mono font-semibold text-plataformaTexto">{Math.round(Number(valor))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-subtexto text-plataformaSecundario">
                  Este proveedor todavía no completó su evaluación en el portal. El puntaje y las recomendaciones aparecerán aquí en cuanto finalice el cuestionario.
                </p>
              )}

              <div className="pt-2">
                <span className="text-etiqueta text-plataformaSecundario block mb-2">Evidencia documental (RF25)</span>
                <EvidenciaFicha idProveedor={proveedorSeleccionado.idProveedor} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
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
          <form onSubmit={registrarNuevoProveedor} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
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
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
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
            </div>

            <div className="flex justify-end gap-3">
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
