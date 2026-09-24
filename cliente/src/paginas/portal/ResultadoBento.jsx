import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Leaf,
  Users,
  Shield,
  Briefcase,
  FileDown,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import BarraProgreso from '../../componentes/BarraProgreso.jsx';

const ICONOS_POR_CODIGO_DIMENSION = {
  AMB: { icono: Leaf, color: 'text-emerald-600', barra: 'bg-emerald-500' },
  SOC: { icono: Users, color: 'text-blue-600', barra: 'bg-blue-500' },
  ETI: { icono: Shield, color: 'text-indigo-600', barra: 'bg-indigo-500' },
  LAB: { icono: Briefcase, color: 'text-amber-600', barra: 'bg-amber-500' },
  CAD: { icono: TrendingUp, color: 'text-purple-600', barra: 'bg-purple-500' }
};

const CLASE_POR_NIVEL = {
  Avanzado: 'insignia-exito',
  Intermedio: 'insignia-info',
  Inicial: 'insignia-advertencia'
};

export default function ResultadoBento({ resultado, datosProveedor, alReiniciar, volverAlInicio }) {
  const puntajeGlobal = resultado?.puntajeTotal ?? 0;
  const dimensiones = (resultado?.dimensiones ?? []).map((d) => ({
    dimension: d.nombre,
    puntaje: d.puntaje,
    ...(ICONOS_POR_CODIGO_DIMENSION[d.codigo] || { icono: TrendingUp, color: 'text-plataformaAzul', barra: 'bg-plataformaAzul' })
  }));

  const recomendaciones = resultado?.recomendaciones ?? [];

  const nivelDesempeno = {
    etiqueta: `Nivel ${resultado?.nivel || 'Inicial'}`,
    clase: CLASE_POR_NIVEL[resultado?.nivel] || 'insignia-advertencia'
  };

  const manejarReinicio = alReiniciar || volverAlInicio;

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:py-10 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="insignia-neutra mb-1">Resultados Oficiales</span>
          <h2 className="text-titulo-pagina text-plataformaTexto mt-1">
            Desempeño y recomendaciones
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
            {datosProveedor?.razonSocial || 'Distribuidora Alimentos del Norte S.A.C.'} • RUC {datosProveedor?.ruc || '20512345678'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="boton-secundario text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4 stroke-[1.8]" />
            <span>Descargar informe</span>
          </button>
          {manejarReinicio && (
            <button
              onClick={manejarReinicio}
              className="boton-fantasma text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[1.8]" />
              <span>Nuevo intento</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
        <TarjetaBento clasePersonalizada="md:col-span-1 flex flex-col justify-between p-6 sm:p-8 shadow-sm-token">
          <div>
            <span className="text-etiqueta text-plataformaSecundario block">
              Puntaje Global
            </span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[48px] sm:text-[64px] font-semibold tracking-[-0.04em] text-plataformaTexto leading-none font-sans">
                {puntajeGlobal}
              </span>
              <span className="text-titulo-seccion text-plataformaSecundario">
                / 100
              </span>
            </div>
          </div>

          <div className="mt-6">
            <span className={nivelDesempeno.clase}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {nivelDesempeno.etiqueta}
            </span>
            <p className="text-subtexto text-plataformaSecundario mt-3 leading-relaxed">
              El certificado formal ha sido remitido al correo corporativo del representante registrado.
            </p>
          </div>
        </TarjetaBento>

        <TarjetaBento clasePersonalizada="md:col-span-2 p-6 sm:p-8 shadow-sm-token">
          <div className="flex items-center justify-between mb-5">
            <span className="text-etiqueta text-plataformaSecundario">
              Dimensiones de Sostenibilidad
            </span>
            <span className="text-subtexto text-plataformaSecundario">
              Ponderación equitativa (25% c/u)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {dimensiones.map((item, indice) => {
              const Icono = item.icono || TrendingUp;
              const colorTexto = item.color || 'text-plataformaAzul';
              const colorBarra = item.barra || 'bg-plataformaAzul';

              return (
                <div
                  key={indice}
                  className="p-4 rounded-md-token bg-superficie-secundaria border border-black/[0.04] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-sm-token bg-white shadow-xs-token ${colorTexto}`}>
                        <Icono className="w-4 h-4 stroke-[1.8]" />
                      </div>
                      <span className="text-cuerpo-pequeno font-medium text-plataformaTexto">
                        {item.dimension}
                      </span>
                    </div>
                    <span className="text-etiqueta font-semibold font-mono text-plataformaTexto">
                      {item.puntaje}%
                    </span>
                  </div>
                  <BarraProgreso porcentaje={item.puntaje} color={colorBarra} altura="h-1" />
                </div>
              );
            })}
          </div>
        </TarjetaBento>
      </div>

      <TarjetaBento clasePersonalizada="p-6 sm:p-8 shadow-sm-token">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-md-token bg-plataformaAzul/[0.08] text-plataformaAzul">
            <Sparkles className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-titulo-tarjeta text-plataformaTexto">
              Planes de acción recomendados
            </h3>
            <p className="text-subtexto text-plataformaSecundario">
              Acciones prioritarias identificadas por el motor de evaluación para el cierre de brechas.
            </p>
          </div>
        </div>

        {recomendaciones.length === 0 ? (
          <p className="text-cuerpo-pequeno text-plataformaSecundario leading-relaxed">
            No se generaron recomendaciones: su puntaje superó los umbrales definidos en todas las dimensiones evaluadas.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {recomendaciones.map((texto, indice) => (
              <div
                key={indice}
                className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0"
              >
                <span className="w-5 h-5 rounded-full bg-plataformaAzul/[0.08] text-plataformaAzul text-subtexto font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {indice + 1}
                </span>
                <p className="text-cuerpo-pequeno text-plataformaTexto leading-relaxed">
                  {typeof texto === 'string' ? texto : texto.texto}
                </p>
              </div>
            ))}
          </div>
        )}
      </TarjetaBento>
    </div>
  );
}
