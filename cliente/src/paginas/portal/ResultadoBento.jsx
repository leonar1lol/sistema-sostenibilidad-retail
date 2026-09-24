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
  Sparkles,
  Trophy
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
  Avanzado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Intermedio: 'bg-blue-100 text-blue-800 border-blue-200',
  Inicial: 'bg-amber-100 text-amber-800 border-amber-200'
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
    clase: CLASE_POR_NIVEL[resultado?.nivel] || CLASE_POR_NIVEL['Inicial']
  };

  const manejarReinicio = alReiniciar || volverAlInicio;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 mb-8 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">¡Evaluación completada con éxito!</h1>
            <p className="text-emerald-50 mt-1">Sus respuestas han sido procesadas correctamente por el sistema de homologación.</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="insignia-neutra mb-1">Resultados Oficiales • Paso 4 de 4</span>
          <h2 className="text-titulo-pagina text-plataformaTexto mt-1">
            Desempeño y recomendaciones
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
            {datosProveedor?.razonSocial
              ? `${datosProveedor.razonSocial}${datosProveedor.ruc ? ` • RUC ${datosProveedor.ruc}` : ''}`
              : (datosProveedor?.correo || 'Proveedor Registrado')}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <TarjetaBento clasePersonalizada="md:col-span-1 flex flex-col justify-between p-8 shadow-sm-token">
          <div>
            <span className="text-etiqueta text-plataformaSecundario block mb-2">
              Puntaje Global ESG
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[72px] font-bold tracking-[-0.04em] text-plataformaTexto leading-none font-sans">
                {puntajeGlobal}
              </span>
              <span className="text-titulo-seccion text-plataformaSecundario font-medium">
                / 100
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-black/[0.05]">
              <div className="text-xs text-plataformaSecundario mb-2 flex justify-between">
                <span>0</span>
                <span>60</span>
                <span>75</span>
                <span>100</span>
              </div>
              <div className="h-3 w-full rounded-full flex overflow-hidden">
                <div className={`h-full bg-amber-400 ${puntajeGlobal < 60 ? 'opacity-100' : 'opacity-40'}`} style={{ width: '60%' }}></div>
                <div className={`h-full bg-blue-500 ${puntajeGlobal >= 60 && puntajeGlobal < 75 ? 'opacity-100' : 'opacity-40'}`} style={{ width: '15%' }}></div>
                <div className={`h-full bg-emerald-500 ${puntajeGlobal >= 75 ? 'opacity-100' : 'opacity-40'}`} style={{ width: '25%' }}></div>
              </div>
              <div className="mt-2 text-[10px] text-plataformaSecundario flex justify-between">
                <span className="text-amber-700 font-medium">Inicial</span>
                <span className="text-blue-700 font-medium">Intermedio</span>
                <span className="text-emerald-700 font-medium">Avanzado</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center border border-black/[0.08] rounded-xl p-4 bg-black/[0.02]">
            <span className="text-xs text-plataformaSecundario uppercase tracking-wider font-semibold mb-2 block text-center">Nivel Obtenido</span>
            <div className={`px-4 py-2 border rounded-full flex items-center gap-2 font-bold text-lg ${nivelDesempeno.clase}`}>
              <CheckCircle2 className="w-5 h-5" />
              {resultado?.nivel || 'Inicial'}
            </div>
            <p className="text-[11px] text-center text-plataformaSecundario mt-3 leading-relaxed">
              El certificado formal ha sido remitido al correo corporativo del representante registrado.
            </p>
          </div>
        </TarjetaBento>

        <TarjetaBento clasePersonalizada="md:col-span-2 p-8 shadow-sm-token">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-plataformaTexto">
                Desglose por Dimensiones de Sostenibilidad
              </h3>
              <p className="text-sm text-plataformaSecundario mt-1">
                Análisis detallado en las 5 áreas clave. Ponderación equitativa (20% c/u).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dimensiones.map((item, indice) => {
              const Icono = item.icono || TrendingUp;
              const colorTexto = item.color || 'text-plataformaAzul';
              const colorBarra = item.barra || 'bg-plataformaAzul';

              return (
                <div
                  key={indice}
                  className="p-4 rounded-lg bg-superficie-secundaria border border-black/[0.06] flex flex-col justify-between hover:border-black/[0.1] transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-white shadow-sm ${colorTexto}`}>
                        <Icono className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <span className="text-sm font-semibold text-plataformaTexto">
                        {item.dimension}
                      </span>
                    </div>
                    <span className={`text-sm font-bold font-mono px-2 py-1 rounded bg-white border border-black/[0.05] ${colorTexto}`}>
                      {item.puntaje} pts
                    </span>
                  </div>
                  <BarraProgreso porcentaje={item.puntaje} color={colorBarra} altura="h-2" />
                </div>
              );
            })}
          </div>
        </TarjetaBento>
      </div>

      <TarjetaBento clasePersonalizada="p-8 shadow-sm-token">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-md-token bg-plataformaAzul/[0.08] text-plataformaAzul">
            <Sparkles className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-titulo-tarjeta text-plataformaTexto">
              Planes de acción recomendados
            </h3>
            <p className="text-subtexto text-plataformaSecundario">
              Acciones prioritarias identificadas por el motor de inteligencia para el cierre de brechas y mejora continua.
            </p>
          </div>
        </div>

        {recomendaciones.length === 0 ? (
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-800">
              ¡Excelente desempeño! No se generaron recomendaciones prioritarias ya que su puntaje superó los umbrales definidos en todas las dimensiones evaluadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recomendaciones.map((texto, indice) => (
              <div
                key={indice}
                className="p-4 bg-white border border-black/[0.06] rounded-lg flex items-start gap-3 hover:shadow-sm transition-shadow"
              >
                <span className="w-6 h-6 rounded-full bg-plataformaAzul/[0.08] text-plataformaAzul text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {indice + 1}
                </span>
                <p className="text-sm text-plataformaTexto leading-relaxed font-medium">
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
