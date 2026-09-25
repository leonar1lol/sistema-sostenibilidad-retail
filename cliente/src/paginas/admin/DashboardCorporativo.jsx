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
  BarChart3,
  Sliders,
  History,
  Shield,
  Megaphone,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';
import GestionProveedores from './GestionProveedores.jsx';
import BancoPreguntas from './BancoPreguntas.jsx';
import GestionCampanias from './GestionCampanias.jsx';
import GestionUsuariosRoles from './GestionUsuariosRoles.jsx';
import ConfiguracionUnidadesIndustrias from './ConfiguracionUnidadesIndustrias.jsx';
import BitacoraAuditoria from './BitacoraAuditoria.jsx';
import CentroReportes from './CentroReportes.jsx';
import { exportarProveedoresAExcel } from '../../utilidades/exportadorExcel.js';
import { listarProveedoresAdminApi, listarUnidadesApi } from '../../servicios/servicioApi.js';

export default function DashboardCorporativo({ pestanaInicial = 'resumen', alCambiarPestana }) {
  const [pestanaActiva, setPestanaActiva] = useState(pestanaInicial);
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [soloCriticosActivo, setSoloCriticosActivo] = useState(false);

  const [filtroDirectorioUnidad, setFiltroDirectorioUnidad] = useState('todas');
  const [filtroDirectorioCriticos, setFiltroDirectorioCriticos] = useState(false);
  const [filtroDirectorioEstado, setFiltroDirectorioEstado] = useState('todos');

  useEffect(() => {
    if (pestanaInicial) {
      setPestanaActiva(pestanaInicial);
    }
  }, [pestanaInicial]);

  const seleccionarPestana = (nuevaPestana) => {
    setPestanaActiva(nuevaPestana);
    if (alCambiarPestana) {
      alCambiarPestana(nuevaPestana);
    }
  };

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

  const proveedoresParaMetricas = proveedores.filter((p) => {
    const coincideUnidad = unidadSeleccionada === 'todas' || p.unidad === unidadSeleccionada;
    const coincideCritico = !soloCriticosActivo || p.esCritico;
    return coincideUnidad && coincideCritico;
  });

  const totalProveedores = proveedoresParaMetricas.length;
  const criticosTotales = proveedoresParaMetricas.filter((p) => p.esCritico).length;
  const evaluados = proveedoresParaMetricas.filter((p) => p.estadoEvaluacion === 'Finalizado');
  const encuestasCompletadas = evaluados.length;
  const sumaPuntajes = evaluados.reduce((acc, p) => acc + Number(p.puntajeTotal || 0), 0);
  const promedioAvance = encuestasCompletadas > 0 ? Math.round(sumaPuntajes / encuestasCompletadas) : 0;

  const unidadesConMetricas = unidades.map((u) => {
    const proveedoresDeEstaUnidad = proveedores.filter((p) => p.idUnidad === u.idUnidad);
    const criticosDeEstaUnidad = proveedoresDeEstaUnidad.filter((p) => p.esCritico);
    const evaluadosDeEstaUnidad = criticosDeEstaUnidad.filter((p) => p.estadoEvaluacion === 'Finalizado').length;
    const meta = criticosDeEstaUnidad.length;
    const porcentaje = meta > 0 ? Math.round((evaluadosDeEstaUnidad / meta) * 100) : 0;
    return {
      ...u,
      evaluados: evaluadosDeEstaUnidad,
      meta,
      porcentaje
    };
  });

  const descargarReporteExcel = () => {
    exportarProveedoresAExcel(proveedoresParaMetricas);
  };

  const irADirectorioConFiltro = ({ unidad = 'todas', criticos = false, estado = 'todos' }) => {
    setFiltroDirectorioUnidad(unidad);
    setFiltroDirectorioCriticos(criticos);
    setFiltroDirectorioEstado(estado);
    seleccionarPestana('proveedores');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="p-4 sm:p-5 rounded-lg-token bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-md-token bg-white/10 text-white backdrop-blur-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">
              Panel Centralizado Corporativo — Grupo Intercorp Retail
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Supervisión consolidada de sostenibilidad para las 7 unidades: Supermercados Peruanos, Promart, Oechsle, Real Plaza, Farmacias Peruanas, SIP y Sucursal China.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Servicio Operativo
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-etiqueta text-plataformaSecundario block mb-1">
              Corporativo • Jefatura de Sostenibilidad Intercorp Retail
            </span>
            <h2 className="text-titulo-pagina text-plataformaTexto">
              Gestión Integral de Sostenibilidad de Proveedores
            </h2>
          </div>
          <span className="text-subtexto text-plataformaSecundario">
            Cobertura completa: Requerimientos Funcionales RF01 a RF16
          </span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-1 mt-6 mb-8 border-b border-black/[0.06]">
          <button
            type="button"
            onClick={() => seleccionarPestana('resumen')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'resumen'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Resumen</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              RF10
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroDirectorioUnidad('todas');
              setFiltroDirectorioCriticos(false);
              setFiltroDirectorioEstado('todos');
              seleccionarPestana('proveedores');
            }}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'proveedores'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio ({proveedores.length})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              RF06/07
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('banco')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'banco'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Banco de Ítems</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
              RF04/05
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('campanias')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'campanias'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Campañas</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              RF12/21
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('usuarios')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'usuarios'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Usuarios y Roles</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
              RF02/03
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('configuracion')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'configuracion'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
              RF09/11
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('auditoria')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'auditoria'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoría</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              RF16/24
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarPestana('reportes')}
            className={`px-3.5 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              pestanaActiva === 'reportes'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto font-semibold'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Reportes y Auditoría</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              RF13 / 6 Informes
            </span>
          </button>
        </nav>
      </div>

      {pestanaActiva === 'resumen' && (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-3 py-3">
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
              type="button"
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
              type="button"
              onClick={descargarReporteExcel}
              className="boton-secundario flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Descargar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => seleccionarPestana('reportes')}
              className="boton-secundario flex items-center gap-1.5 cursor-pointer border-plataformaAzul/40 text-plataformaAzul hover:bg-plataformaAzul/[0.05]"
            >
              <FileText className="w-4 h-4" />
              <span>Centro de Reportes (6)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div
              onClick={() => irADirectorioConFiltro({ unidad: unidadSeleccionada, criticos: soloCriticosActivo, estado: 'todos' })}
              className="superficie-tarjeta rounded-lg-token p-6 relative cursor-pointer hover:border-plataformaAzul/40 hover:shadow-xs-token transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-etiqueta text-plataformaSecundario block group-hover:text-plataformaAzul transition-colors">
                  Padrón Activo
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-plataformaSecundario opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-plataformaTexto">
                {totalProveedores}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-blue-500/10 text-plataformaAzul">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                {unidadSeleccionada === 'todas' ? 'Consolidado corporativo' : unidadSeleccionada}
              </span>
            </div>

            <div
              onClick={() => irADirectorioConFiltro({ unidad: unidadSeleccionada, criticos: true, estado: 'todos' })}
              className="superficie-tarjeta rounded-lg-token p-6 relative cursor-pointer hover:border-amber-500/40 hover:shadow-xs-token transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-etiqueta text-plataformaSecundario block group-hover:text-amber-600 transition-colors">
                  Críticos
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-plataformaSecundario opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-amber-600">
                {criticosTotales}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-amber-500/10 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                Sujetos a debida diligencia
              </span>
            </div>

            <div
              onClick={() => irADirectorioConFiltro({ unidad: unidadSeleccionada, criticos: soloCriticosActivo, estado: 'Finalizado' })}
              className="superficie-tarjeta rounded-lg-token p-6 relative cursor-pointer hover:border-emerald-500/40 hover:shadow-xs-token transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-etiqueta text-plataformaSecundario block group-hover:text-emerald-600 transition-colors">
                  Evaluados
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-plataformaSecundario opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-emerald-600">
                {encuestasCompletadas}
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-subtexto text-plataformaSecundario mt-2 block">
                Con reporte y cálculo cerrado
              </span>
            </div>

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Promedio ESG
              </span>
              <div className="text-[32px] font-semibold tracking-tight mt-2 text-plataformaAzul">
                {promedioAvance}%
              </div>
              <div className="absolute top-6 right-6 p-2 rounded-md-token bg-blue-500/10 text-plataformaAzul">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <BarraProgreso porcentaje={promedioAvance} altura="h-1.5" />
              </div>
            </div>
          </div>

          <div className="superficie-tarjeta rounded-lg-token p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-titulo-tarjeta">
                  Cumplimiento por Unidad de Negocio
                </h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario">
                  Haga clic en "Ver proveedores" para auditar la cartera de cada gerencia
                </p>
              </div>
              <span className="text-etiqueta font-mono text-plataformaSecundario">
                7 Gerencias
              </span>
            </div>

            <div className="space-y-0">
              {unidadesConMetricas.map((unidad) => (
                <div
                  key={unidad.idUnidad}
                  className="py-4 border-b border-black/[0.04] last:border-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 md:w-1/3">
                    <div className="w-8 h-8 rounded-sm-token bg-plataformaCorporativo text-white flex items-center justify-center font-bold text-xs">
                      {unidad.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-cuerpo-pequeno font-medium text-plataformaTexto block">
                        {unidad.nombre}
                      </span>
                      <span className="text-subtexto text-plataformaSecundario">
                        Gerente: {unidad.gerente} • {unidad.evaluados} de {unidad.meta}
                      </span>
                    </div>
                  </div>

                  <div className="md:w-1/2 flex items-center gap-3">
                    <div className="flex-1">
                      <BarraProgreso
                        porcentaje={unidad.porcentaje}
                        color={
                          unidad.porcentaje >= 70
                            ? 'bg-emerald-500'
                            : unidad.porcentaje >= 50
                            ? 'bg-plataformaAzul'
                            : 'bg-amber-500'
                        }
                        altura="h-1.5"
                      />
                    </div>
                    <span className="text-etiqueta font-mono text-plataformaTexto w-10 text-right">
                      {unidad.porcentaje}%
                    </span>
                  </div>

                  <div className="md:w-28 text-right">
                    <button
                      type="button"
                      onClick={() => irADirectorioConFiltro({ unidad: unidad.nombre, criticos: false, estado: 'todos' })}
                      className="text-etiqueta text-plataformaAzul hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Ver proveedores</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pestanaActiva === 'proveedores' && (
        <GestionProveedores
          filtroUnidadInicial={filtroDirectorioUnidad}
          filtroSoloCriticosInicial={filtroDirectorioCriticos}
          filtroEstadoInicial={filtroDirectorioEstado}
        />
      )}

      {pestanaActiva === 'banco' && <BancoPreguntas />}

      {pestanaActiva === 'campanias' && <GestionCampanias />}

      {pestanaActiva === 'usuarios' && <GestionUsuariosRoles />}

      {pestanaActiva === 'configuracion' && <ConfiguracionUnidadesIndustrias />}

      {pestanaActiva === 'auditoria' && <BitacoraAuditoria />}

      {pestanaActiva === 'reportes' && (
        <CentroReportes
          proveedores={proveedores}
          unidades={unidades}
        />
      )}
    </div>
  );
}
