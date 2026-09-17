import React from 'react';

const BarraProgreso = ({ porcentaje = 0, color = 'bg-plataformaAzul', altura = 'h-1' }) => {
  return (
    <div className={`w-full bg-black/[0.04] rounded-full overflow-hidden ${altura}`}>
      <div
        className={`${altura} ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
};

export default BarraProgreso;
