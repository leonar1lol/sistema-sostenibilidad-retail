import React from 'react';
import { LogOut } from 'lucide-react';

const CabeceraNavegacion = ({ entornoActual, sesionCorporativa, alCerrarSesionCorporativa }) => {
  return (
    <header className="superficie-cristal sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md-token bg-plataformaCorporativo flex items-center justify-center text-white text-xs font-semibold">
            RC
          </div>
          <span className="text-cuerpo font-semibold text-plataformaTexto">
            Retail Connect
          </span>
          {entornoActual === 'corporativo' && (
            <span className="text-etiqueta text-plataformaSecundario border-l border-black/[0.08] pl-3 ml-1">
              Panel Corporativo
            </span>
          )}
        </div>

        <div className="flex items-center">
          {entornoActual === 'corporativo' && sesionCorporativa ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-etiqueta font-medium text-plataformaTexto">{sesionCorporativa.nombre}</span>
                <span className="text-subtexto text-plataformaSecundario">{sesionCorporativa.rol}</span>
              </div>
              <button
                onClick={alCerrarSesionCorporativa}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-8"></div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CabeceraNavegacion;
