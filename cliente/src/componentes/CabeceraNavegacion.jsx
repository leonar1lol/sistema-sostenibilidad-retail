import React from 'react';
import { LogOut, Leaf, Building2 } from 'lucide-react';

export default function CabeceraNavegacion({
  entornoActual,
  alCambiarEntorno,
  sesionCorporativa,
  alCerrarSesionCorporativa
}) {
  return (
    <header className="superficie-cristal sticky top-0 z-30 shadow-xs-token">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md-token bg-plataformaCorporativo flex items-center justify-center text-white text-xs font-bold tracking-tight">
            IR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-cuerpo font-semibold text-plataformaTexto">
                Retail Connect
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] text-plataformaSecundario">
                Intercorp Retail
              </span>
            </div>
            <p className="text-[11px] text-plataformaSecundario leading-none mt-0.5 hidden sm:block">
              Homologación y Sostenibilidad ESG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex p-1 bg-black/[0.04] rounded-full border border-black/[0.06]">
            <button
              type="button"
              onClick={() => alCambiarEntorno('proveedor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                entornoActual === 'proveedor'
                  ? 'bg-white text-plataformaTexto shadow-xs-token'
                  : 'text-plataformaSecundario hover:text-plataformaTexto'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portal Proveedor</span>
            </button>

            <button
              type="button"
              onClick={() => alCambiarEntorno('corporativo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                entornoActual === 'corporativo'
                  ? 'bg-white text-plataformaTexto shadow-xs-token'
                  : 'text-plataformaSecundario hover:text-plataformaTexto'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-plataformaAzul" />
              <span>Panel Corporativo</span>
            </button>
          </div>

          {entornoActual === 'corporativo' && sesionCorporativa && (
            <div className="flex items-center gap-3 pl-2 border-l border-black/[0.08]">
              <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-etiqueta font-medium text-plataformaTexto">
                  {sesionCorporativa.nombre}
                </span>
                <span className="text-subtexto text-plataformaSecundario">
                  {sesionCorporativa.rol}
                </span>
              </div>
              <button
                type="button"
                onClick={alCerrarSesionCorporativa}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer"
                title="Cerrar sesión corporativa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
