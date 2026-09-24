import React, { useState, useEffect } from 'react';
import {
  History,
  AlertCircle,
  Search,
  ShieldCheck,
  Filter,
  RotateCcw,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { listarAuditoriaApi } from '../../servicios/servicioApi.js';

export default function BitacoraAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('todos');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        setRegistros(await listarAuditoriaApi());
      } catch (error) {
        setMensajeError(error.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const modulosDisponibles = Array.from(
    new Set(registros.map((r) => r.modulo).filter(Boolean))
  );

  const registrosFiltrados = registros.filter((r) => {
    const coincideModulo = filtroModulo === 'todos' || r.modulo === filtroModulo;
    const texto = `${r.usuario || ''} ${r.accion || ''} ${r.modulo || ''} ${r.detalles || ''}`.toLowerCase();
    const coincideTexto = terminoBusqueda.trim() === '' || texto.includes(terminoBusqueda.toLowerCase());
    return coincideModulo && coincideTexto;
  });

  const hayFiltros = terminoBusqueda.trim() !== '' || filtroModulo !== 'todos';

  const limpiarFiltros = () => {
    setTerminoBusqueda('');
    setFiltroModulo('todos');
  };

  return (
    <div className="space-y-6">
      {mensajeError && (
        <div className="rounded-md-token bg-red-50 border border-red-200/60 p-3 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-etiqueta text-plataformaSecundario block mb-1">
            Trazabilidad y Control Forense (RF16, RF24)
          </span>
          <h2 className="text-titulo-seccion text-plataformaTexto">
            Bitácora de Auditoría
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Registro cronológico inmutable de operaciones sensibles realizadas por usuarios internos y proveedores.
          </p>
        </div>
      </div>

      <div className="superficie-tarjeta rounded-lg-token p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-8">
            <Search className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario responsable, acción u observación..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="campo-entrada campo-entrada-icono w-full text-xs"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="campo-select w-full"
            >
              <option value="todos">Todos los módulos auditados</option>
              {modulosDisponibles.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
        </div>

        {hayFiltros && (
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] text-xs">
            <span className="text-plataformaSecundario">
              Mostrando <strong className="text-plataformaTexto">{registrosFiltrados.length}</strong> de <strong className="text-plataformaTexto">{registros.length}</strong> eventos registrados
            </span>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 text-plataformaAzul hover:underline cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla-premium w-full text-left">
            <thead>
              <tr>
                <th className="min-w-[170px]">Fecha y Hora</th>
                <th>Usuario Responsable</th>
                <th>Módulo</th>
                <th>Operación Realizada</th>
                <th>Detalles de la Acción</th>
                <th className="text-center">Integridad</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-plataformaSecundario">
                    Cargando eventos de auditoría desde Neon PostgreSQL…
                  </td>
                </tr>
              ) : registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="estado-vacio py-12 text-center text-plataformaSecundario flex flex-col items-center">
                      <History className="w-8 h-8 mb-3 opacity-50" />
                      <span>No se encontraron eventos registrados en la bitácora con los filtros seleccionados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((registro) => (
                  <tr key={registro.idAuditoria} className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-plataformaSecundario whitespace-nowrap">
                      {new Date(registro.fecha).toLocaleString('es-PE')}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-plataformaTexto">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-plataformaSecundario" />
                        <span>{registro.usuario}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="insignia-neutra text-[11px]">
                        {registro.modulo || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-plataformaTexto">
                      {registro.accion}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-plataformaSecundario max-w-xs truncate" title={registro.detalles}>
                      {registro.detalles || 'Sin detalles adicionales'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 insignia-exito text-[11px]">
                        <ShieldCheck className="w-3 h-3" />
                        Conforme
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
