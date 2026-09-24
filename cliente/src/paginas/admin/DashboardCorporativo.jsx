import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Filter,
  FileSpreadsheet,
  ChevronRight,
  Database,
  Layers,
  BarChart3,
  Sliders,
  History,
  Shield,
  Megaphone,
  ChevronDown
} from 'lucide-react';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';
import GraficoAvancePorUnidad from '../../componentes/GraficoAvancePorUnidad.jsx';
import GraficoAvancePorTipo from '../../componentes/GraficoAvancePorTipo.jsx';
import GestionProveedores from './GestionProveedores.jsx';
import BancoPreguntas from './BancoPreguntas.jsx';
import GestionCampanias from './GestionCampanias.jsx';
import GestionUsuariosRoles from './GestionUsuariosRoles.jsx';
import ConfiguracionUnidadesIndustrias from './ConfiguracionUnidadesIndustrias.jsx';
import BitacoraAuditoria from './BitacoraAuditoria.jsx';
import { exportarProveedoresAExcel } from '../../utilidades/exportadorExcel.js';
import { listarProveedoresAdminApi, listarUnidadesApi } from '../../servicios/servicioApi.js';

export default function DashboardCorporativo({ sesionCorporativa }) {
  const permisos = sesionCorporativa?.permisos || [];
  const tienePermiso = (codigo) => !codigo || permisos.includes(codigo);
  const [pestanaActiva, setPestanaActiva] = useState('resumen');
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [soloCriticosActivo, setSoloCriticosActivo] = useState(false);
  const [unidadExpandida, setUnidadExpandida] = useState(null);

  const PESTANAS = [
    { id: 'resumen', etiqueta: 'Resumen', icono: BarChart3, permiso: null },
    { id: 'proveedores', etiqueta: `Directorio (${proveedores.length})`, icono: Users, permiso: null },
    { id: 'banco', etiqueta: 'Banco de Ítems', icono: Database, permiso: 'configurar_banco_items' },
    { id: 'campanias', etiqueta: 'Campañas', icono: Megaphone, permiso: 'crear_publicar_campanias' },
    { id: 'usuarios', etiqueta: 'Usuarios y Roles', icono: Shield, permiso: 'administrar_usuarios_roles' },
    { id: 'configuracion', etiqueta: 'Configuración', icono: Sliders, permiso: 'configurar_banco_items' },
    { id: 'auditoria', etiqueta: 'Auditoría', icono: History, permiso: 'ver_dashboard_corporativo' }
  ];
  const pestanasVisibles = PESTANAS.filter((p) => tienePermiso(p.permiso));

  useEffect(() => {
    if (!pestanasVisibles.some((p) => p.id === pestanaActiva)) {
      setPestanaActiva('resumen');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permisos.join(',')]);

  useEffect(() => {
    async function sincronizarConBaseDatos() {
      try {
        const [proveedoresRemotos, unidadesRemotas] = await Promise.all([
          listarProveedoresAdminApi(),
          listarUnidadesApi()
        ]);
        setProveedores(proveedoresRemotos);
        setUnidades(unidadesRemotas);
      } catch {
      }
    }
    sincronizarConBaseDatos();
  }, []);

  // Ojo: "sirve a la unidad X" (p.unidades) y "es crítico para la unidad X"
  // (p.unidadesCriticas) son cosas distintas — un proveedor puede atender
  // Promart y ser crítico solo para SPSA. Al filtrar por una unidad
  // específica, las métricas de criticidad/avance deben mirar
  // unidadesCriticas de ESA unidad puntual, no "es crítico para cualquiera".
  const esCriticoSegunFiltro = (p) =>
    unidadSeleccionada === 'todas'
      ? (p.unidadesCriticas || []).length > 0
      : (p.unidadesCriticas || []).includes(unidadSeleccionada);

  // Cuántas veces cuenta un proveedor crítico: con "todas" las unidades
  // seleccionadas, cuenta una vez por cada unidad para la que es crítico
  // (así se arma el total "incluyendo duplicados"); con una unidad puntual
  // seleccionada ya sabemos que es crítico para esa única unidad, así que
  // cuenta 1 — sumar sus otras unidades críticas aquí contaminaría el
  // número de una unidad con criticidad que pertenece a otra.
  const contarOcurrenciasCriticas = (p) =>
    unidadSeleccionada === 'todas' ? (p.unidadesCriticas || []).length : 1;

  const proveedoresParaMetricas = proveedores.filter((p) => {
    const coincideUnidad = unidadSeleccionada === 'todas' || (p.unidades || []).includes(unidadSeleccionada);
    const coincideCritico = !soloCriticosActivo || esCriticoSegunFiltro(p);
    return coincideUnidad && coincideCritico;
  });

  const totalProveedores = proveedoresParaMetricas.length;

  // Un proveedor que completa la evaluación sin haber sido evaluado como
  // crítico por el corporativo también cuenta — solo que aquí, no en el
  // avance de críticos: sirve para saber cuántos proveedores en general
  // completaron la evaluación, sean o no críticos.
  const completadosEnGeneral = proveedoresParaMetricas.filter((p) => p.estadoEvaluacion === 'Finalizado').length;

  // Un proveedor crítico para varias unidades cuenta una sola vez en el
  // padrón único, pero cuenta en cada unidad para la que es crítico: por
  // eso se llevan ambos totales (único vs. incluyendo duplicados), igual
  // que en avancesESG (https://github.com/carlos88ban-afk/avancesESG).
  const criticos = proveedoresParaMetricas.filter(esCriticoSegunFiltro);
  const criticosTotales = criticos.length;
  const criticosIncluyendoDuplicados = criticos.reduce((acc, p) => acc + contarOcurrenciasCriticas(p), 0);
  const evaluados = criticos.filter((p) => p.estadoEvaluacion === 'Finalizado');
  const encuestasCompletadas = evaluados.length;
  const completadosIncluyendoDuplicados = evaluados.reduce((acc, p) => acc + contarOcurrenciasCriticas(p), 0);
  const avanceGlobalUnico = criticosTotales > 0 ? Math.round((encuestasCompletadas / criticosTotales) * 100) : 0;
  const avanceGlobalGeneral = criticosIncluyendoDuplicados > 0 ? Math.round((completadosIncluyendoDuplicados / criticosIncluyendoDuplicados) * 100) : 0;
  const sumaPuntajes = evaluados.reduce((acc, p) => acc + Number(p.puntajeTotal || 0), 0);
  const promedioAvance = encuestasCompletadas > 0 ? Math.round(sumaPuntajes / encuestasCompletadas) : 0;
  const vistaPorUnidad = unidadSeleccionada !== 'todas';

  const PUBLICAS = ['spsa', 'supermercados peruanos', 'farmacias peruanas', 'real plaza'];
  const esPublica = (nombreUnidad) => PUBLICAS.some((k) => nombreUnidad?.toLowerCase().includes(k));

  const unidadesConMetricas = unidades.map((u) => {
    const criticosDeEstaUnidad = proveedores.filter((p) => (p.unidadesCriticas || []).includes(u.nombre));
    const evaluadosDeEstaUnidad = criticosDeEstaUnidad.filter((p) => p.estadoEvaluacion === 'Finalizado');
    const meta = criticosDeEstaUnidad.length;
    const porcentaje = meta > 0 ? Math.round((evaluadosDeEstaUnidad.length / meta) * 100) : 0;
    const retailTotal = criticosDeEstaUnidad.filter((p) => p.tipo === 'Retail').length;
    const retailCompletado = evaluadosDeEstaUnidad.filter((p) => p.tipo === 'Retail').length;
    const noRetailTotal = criticosDeEstaUnidad.filter((p) => p.tipo === 'No retail').length;
    const noRetailCompletado = evaluadosDeEstaUnidad.filter((p) => p.tipo === 'No retail').length;
    return {
      ...u,
      esPublica: esPublica(u.nombre),
      evaluados: evaluadosDeEstaUnidad.length,
      meta,
      porcentaje,
      retailTotal,
      retailCompletado,
      retailPorcentaje: retailTotal > 0 ? Math.round((retailCompletado / retailTotal) * 100) : 0,
      noRetailTotal,
      noRetailCompletado,
      noRetailPorcentaje: noRetailTotal > 0 ? Math.round((noRetailCompletado / noRetailTotal) * 100) : 0
    };
  });

  const datosGraficoUnidad = unidadesConMetricas
    .filter((u) => u.meta > 0)
    .map((u) => ({ unidad: u.nombre.length > 18 ? `${u.nombre.slice(0, 16)}…` : u.nombre, porcentaje: u.porcentaje }));

  const datosGraficoTipo = ['Retail', 'No retail']
    .map((tipoNombre) => {
      const criticosDeTipo = criticos.filter((p) => p.tipo === tipoNombre);
      const completadosDeTipo = criticosDeTipo.filter((p) => p.estadoEvaluacion === 'Finalizado').length;
      return {
        tipo: tipoNombre,
        completados: completadosDeTipo,
        total: criticosDeTipo.length,
        porcentaje: criticosDeTipo.length > 0 ? Math.round((completadosDeTipo / criticosDeTipo.length) * 100) : 0
      };
    })
    .filter((t) => t.total > 0);

  const descargarReporteExcel = () => {
    exportarProveedoresAExcel(proveedoresParaMetricas, {
      unidadSeleccionada,
      soloCriticosActivo,
      avanceGlobalUnico,
      avanceGlobalGeneral,
      criticosTotales,
      criticosIncluyendoDuplicados,
      encuestasCompletadas,
      completadosIncluyendoDuplicados,
      totalProveedores,
      promedioAvance
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:py-8 sm:px-6">
      <div className="mb-8">
        <span className="text-etiqueta text-plataformaSecundario block mb-1">
          Corporativo • Jefatura de Sostenibilidad Intercorp Retail
        </span>
        <h2 className="text-titulo-pagina">
          Gestión Integral de Sostenibilidad de Proveedores
        </h2>
        <p className="text-cuerpo-pequeno text-plataformaSecundario mt-2">
          Plataforma centralizada con cobertura completa de requerimientos funcionales (RF01 a RF16).
        </p>

        <nav className="flex items-center gap-1 overflow-x-auto pb-1 mt-6 mb-8 border-b border-black/[0.06]">
          {pestanasVisibles.map((p) => (
            <button
              key={p.id}
              onClick={() => setPestanaActiva(p.id)}
              className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                pestanaActiva === p.id
                  ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                  : 'text-plataformaSecundario hover:text-plataformaTexto'
              }`}
            >
              <p.icono className="w-4 h-4" />
              <span>{p.etiqueta}</span>
            </button>
          ))}
        </nav>
      </div>

      {pestanaActiva === 'resumen' && (
        <div className="space-y-7">
          <div className="flex items-center gap-3 py-3">
            <Filter className="w-4 h-4 text-plataformaSecundario" />
            <select
              value={unidadSeleccionada}
              onChange={(e) => setUnidadSeleccionada(e.target.value)}
              className="campo-select max-w-[240px]"
            >
              <option value="todas">Todas las 7 unidades</option>
              <option value="Supermercados Peruanos">Supermercados Peruanos</option>
              <option value="Promart">Promart</option>
              <option value="Oechsle">Oechsle</option>
              <option value="Real Plaza">Real Plaza</option>
              <option value="Farmacias Peruanas">Farmacias Peruanas</option>
              <option value="SIP">SIP</option>
              <option value="Intercorp Retail Sucursal China">Sucursal China</option>
            </select>

            <button
              onClick={() => setSoloCriticosActivo(!soloCriticosActivo)}
              className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                soloCriticosActivo
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 px-4 h-10 rounded-full text-cuerpo-pequeno font-medium'
                  : 'boton-secundario'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{soloCriticosActivo ? 'Solo Críticos Activado' : 'Ver solo críticos'}</span>
            </button>

            <button
              onClick={descargarReporteExcel}
              className="boton-secundario flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Avance Global
              </span>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-plataformaAzul">
                {avanceGlobalUnico}%
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-blue-500/10 text-plataformaAzul">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                {vistaPorUnidad ? `Solo ${unidadSeleccionada}` : `${avanceGlobalGeneral}% avance general`}
              </span>
            </div>

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Proveedores Críticos
              </span>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-amber-600">
                {criticosTotales}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-amber-500/10 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                {vistaPorUnidad ? `Críticos para ${unidadSeleccionada}` : `${criticosIncluyendoDuplicados} total general (crítico para varias unidades)`}
              </span>
            </div>

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Completados
              </span>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-emerald-600">
                {encuestasCompletadas}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                {vistaPorUnidad ? `Solo ${unidadSeleccionada}` : `${completadosIncluyendoDuplicados} total general`}
              </span>
            </div>

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Pendientes
              </span>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-plataformaTexto">
                {criticosTotales - encuestasCompletadas}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-black/[0.04] text-plataformaSecundario">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                {vistaPorUnidad ? `Solo ${unidadSeleccionada}` : `${criticosIncluyendoDuplicados - completadosIncluyendoDuplicados} total general`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="superficie-tarjeta rounded-lg-token p-4 relative col-span-2 lg:col-span-1">
              <span className="text-etiqueta text-plataformaSecundario block">Padrón Activo</span>
              <div className="text-[20px] font-semibold tracking-tight mt-1 text-plataformaTexto">{totalProveedores}</div>
              <span className="text-subtexto text-plataformaSecundario block">
                {unidadSeleccionada === 'todas' ? 'Consolidado corporativo' : unidadSeleccionada}
              </span>
            </div>
            <div className="superficie-tarjeta rounded-lg-token p-4 relative col-span-2 lg:col-span-1">
              <span className="text-etiqueta text-plataformaSecundario block">Evaluados (general)</span>
              <div className="text-[20px] font-semibold tracking-tight mt-1 text-plataformaTexto">{completadosEnGeneral}</div>
              <span className="text-subtexto text-plataformaSecundario block">
                Críticos y no críticos, de {totalProveedores} registrados
              </span>
            </div>
            <div className="superficie-tarjeta rounded-lg-token p-4 relative col-span-2 lg:col-span-1">
              <span className="text-etiqueta text-plataformaSecundario block">Promedio ESG</span>
              <div className="text-[20px] font-semibold tracking-tight mt-1 text-plataformaAzul">{promedioAvance}%</div>
              <BarraProgreso porcentaje={promedioAvance} altura="h-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GraficoAvancePorUnidad datos={datosGraficoUnidad} />
            <GraficoAvancePorTipo datos={datosGraficoTipo} />
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-etiqueta text-plataformaSecundario uppercase">Detalle por Unidad de Negocio</h3>
            {[
              { etiqueta: 'InRetail (Empresas Públicas)', items: unidadesConMetricas.filter((u) => u.esPublica) },
              { etiqueta: 'Empresas Privadas', items: unidadesConMetricas.filter((u) => !u.esPublica) }
            ].map(({ etiqueta, items }) => {
              if (items.length === 0) return null;
              const totalGrupo = items.reduce((acc, u) => acc + u.meta, 0);
              const evaluadosGrupo = items.reduce((acc, u) => acc + u.evaluados, 0);
              const porcentajeGrupo = totalGrupo > 0 ? Math.round((evaluadosGrupo / totalGrupo) * 100) : 0;
              return (
                <div key={etiqueta} className="superficie-tarjeta rounded-lg-token p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-titulo-tarjeta">{etiqueta}</h4>
                    <div className="text-right">
                      <span className="text-[22px] font-bold text-plataformaTexto">{porcentajeGrupo}%</span>
                      <p className="text-subtexto text-plataformaSecundario">{evaluadosGrupo} / {totalGrupo} críticos</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {items.map((unidad) => (
                      <div key={unidad.idUnidad} className="border-b border-black/[0.04] last:border-0 pb-3 last:pb-0">
                        <button
                          className="w-full text-left cursor-pointer"
                          onClick={() => setUnidadExpandida(unidadExpandida === unidad.idUnidad ? null : unidad.idUnidad)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm-token bg-plataformaCorporativo text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {unidad.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-cuerpo-pequeno font-medium text-plataformaTexto truncate">{unidad.nombre}</span>
                                <span className="text-etiqueta font-mono text-plataformaTexto shrink-0">{unidad.porcentaje}% ({unidad.evaluados}/{unidad.meta})</span>
                              </div>
                              <BarraProgreso
                                porcentaje={unidad.porcentaje}
                                color={unidad.porcentaje >= 70 ? 'bg-emerald-500' : unidad.porcentaje >= 50 ? 'bg-plataformaAzul' : 'bg-amber-500'}
                                altura="h-1.5"
                              />
                            </div>
                            <ChevronDown className={`w-4 h-4 text-plataformaSecundario shrink-0 transition-transform ${unidadExpandida === unidad.idUnidad ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {unidadExpandida === unidad.idUnidad && (
                          <div className="mt-3 ml-11 pl-3 border-l-2 border-black/[0.06] space-y-2">
                            <div className="flex items-center justify-between text-subtexto">
                              <span className="text-plataformaSecundario">Retail</span>
                              <span className="font-mono text-plataformaTexto">{unidad.retailPorcentaje}% ({unidad.retailCompletado}/{unidad.retailTotal})</span>
                            </div>
                            <div className="flex items-center justify-between text-subtexto">
                              <span className="text-plataformaSecundario">No Retail</span>
                              <span className="font-mono text-plataformaTexto">{unidad.noRetailPorcentaje}% ({unidad.noRetailCompletado}/{unidad.noRetailTotal})</span>
                            </div>
                            <button
                              onClick={() => { setUnidadSeleccionada(unidad.nombre); setPestanaActiva('proveedores'); }}
                              className="text-etiqueta text-plataformaAzul hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Ver proveedores</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pestanaActiva === 'proveedores' && <GestionProveedores />}

      {pestanaActiva === 'banco' && <BancoPreguntas />}

      {pestanaActiva === 'campanias' && <GestionCampanias />}

      {pestanaActiva === 'usuarios' && <GestionUsuariosRoles />}

      {pestanaActiva === 'configuracion' && <ConfiguracionUnidadesIndustrias />}

      {pestanaActiva === 'auditoria' && <BitacoraAuditoria />}
    </div>
  );
}
