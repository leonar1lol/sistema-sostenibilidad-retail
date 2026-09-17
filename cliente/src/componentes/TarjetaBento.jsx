import React from 'react';

const TarjetaBento = ({ children, clasePersonalizada = '', alHacerClic }) => {
  const claseBase = 'superficie-tarjeta rounded-lg-token p-6 transition-all duration-200 ease-out';
  const claseInteractiva = alHacerClic ? 'superficie-tarjeta-hover cursor-pointer' : '';

  return (
    <div
      className={`${claseBase} ${claseInteractiva} ${clasePersonalizada}`}
      onClick={alHacerClic}
    >
      {children}
    </div>
  );
};

export default TarjetaBento;
