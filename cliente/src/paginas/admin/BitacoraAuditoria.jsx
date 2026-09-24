import React, { useState, useEffect } from 'react';
import { History, AlertCircle } from 'lucide-react';
import { listarAuditoriaApi } from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

export default function BitacoraAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useMensajeTemporal();

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

  return (
    <div className="space-y-6">
      {mensajeError && (
        <div className="rounded-md-token bg-red-50 border border-red-200/60 p-3 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div>
        <span className="text-etiqueta text-plataformaSecundario block mb-1">
          Traza transversal (RF24)
        </span>
        <h2 className="text-titulo-seccion">
          Bitácora de Auditoría
        </h2>
        <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
          Usuario, acción y marca temporal de cada operación relevante registrada por el sistema.
        </p>
      </div>

      <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla-premium w-full text-left">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-plataformaSecundario">
                    Cargando registros reales desde el servidor…
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="estado-vacio py-12 text-center text-plataformaSecundario flex flex-col items-center">
                      <History className="w-8 h-8 mb-3 opacity-50" />
                      <span>Todavía no hay operaciones registradas.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro.idAuditoria}>
                    <td className="py-3.5 px-4 font-mono text-cuerpo-pequeno text-plataformaSecundario whitespace-nowrap">
                      {new Date(registro.fecha).toLocaleString('es-PE')}
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaTexto">
                      {registro.usuario}
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaSecundario">
                      {registro.accion}
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
