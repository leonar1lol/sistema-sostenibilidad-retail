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
  Megaphone
} from 'lucide-react';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';
import GestionProveedores from './GestionProveedores.jsx';
import BancoPreguntas from './BancoPreguntas.jsx';
import GestionCampanias from './GestionCampanias.jsx';
import GestionUsuariosRoles from './GestionUsuariosRoles.jsx';
import ConfiguracionUnidadesIndustrias from './ConfiguracionUnidadesIndustrias.jsx';
import BitacoraAuditoria from './BitacoraAuditoria.jsx';
import { exportarProveedoresAExcel } from '../../utilidades/exportadorExcel.js';
import { listarProveedoresAdminApi, listarUnidadesApi } from '../../servicios/servicioApi.js';

export default function DashboardCorporativo() {
  const [pestanaActiva, setPestanaActiva] = useState('resumen');
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [soloCriticosActivo, setSoloCriticosActivo] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
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
          <button
            onClick={() => setPestanaActiva('resumen')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'resumen'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => setPestanaActiva('proveedores')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'proveedores'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio ({proveedores.length})</span>
          </button>
          <button
            onClick={() => setPestanaActiva('banco')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'banco'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Banco de Ítems</span>
          </button>
          <button
            onClick={() => setPestanaActiva('campanias')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'campanias'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Campañas</span>
          </button>
          <button
            onClick={() => setPestanaActiva('usuarios')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'usuarios'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Usuarios y Roles</span>
          </button>
          <button
            onClick={() => setPestanaActiva('configuracion')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'configuracion'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => setPestanaActiva('auditoria')}
            className={`px-4 py-2.5 text-cuerpo-pequeno font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              pestanaActiva === 'auditoria'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoría</span>
          </button>
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
                Padrón Activo
              </span>
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

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Críticos
              </span>
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

            <div className="superficie-tarjeta rounded-lg-token p-6 relative">
              <span className="text-etiqueta text-plataformaSecundario block">
                Evaluados
              </span>
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
                      onClick={() => {
                        setUnidadSeleccionada(unidad.nombre);
                        setPestanaActiva('proveedores');
                      }}
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

      {pestanaActiva === 'proveedores' && <GestionProveedores />}

      {pestanaActiva === 'banco' && <BancoPreguntas />}

      {pestanaActiva === 'campanias' && <GestionCampanias />}

      {pestanaActiva === 'usuarios' && <GestionUsuariosRoles />}

      {pestanaActiva === 'configuracion' && <ConfiguracionUnidadesIndustrias />}

      {pestanaActiva === 'auditoria' && <BitacoraAuditoria />}
    </div>
  );
}
