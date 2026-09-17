import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CabeceraNavegacion from './componentes/CabeceraNavegacion.jsx';
import AccesoOtp from './paginas/portal/AccesoOtp.jsx';
import RegistroProveedor from './paginas/portal/RegistroProveedor.jsx';
import CuestionarioDinamico from './paginas/portal/CuestionarioDinamico.jsx';
import ResultadoBento from './paginas/portal/ResultadoBento.jsx';
import DashboardCorporativo from './paginas/admin/DashboardCorporativo.jsx';
import InicioSesionCorporativo from './paginas/admin/InicioSesionCorporativo.jsx';
import { obtenerResultadoPortalApi } from './servicios/servicioApi.js';

const transicionPagina = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
};

const leerContextoEnlaceDesdeUrl = () => {
  const parametros = new URLSearchParams(window.location.search);
  return {
    idCampania: parametros.get('campania'),
    idUnidad: parametros.get('unidad'),
    tokenPersonal: parametros.get('token')
  };
};

const esRutaCorporativa = () => window.location.pathname.startsWith('/admin');

export default function AplicacionPrincipal() {
  const [entornoActual] = useState(esRutaCorporativa() ? 'corporativo' : 'proveedor');
  const [pasoPortal, setPasoPortal] = useState('acceso_otp');
  const [contextoEnlace] = useState(leerContextoEnlaceDesdeUrl);
  const [sesionCorporativa, setSesionCorporativa] = useState(() => {
    const sesionGuardada = localStorage.getItem('sesionCorporativa');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const iniciarSesionCorporativa = (sesion) => {
    localStorage.setItem('sesionCorporativa', JSON.stringify(sesion));
    setSesionCorporativa(sesion);
  };

  const [datosProveedor, setDatosProveedor] = useState({});
  const [resultadoEvaluacion, setResultadoEvaluacion] = useState(null);

  const alCompletarAccesoOtp = ({ correo, proveedorExistente }) => {
    setDatosProveedor((previo) => ({ ...previo, correo, ...proveedorExistente }));
    setPasoPortal('registro');
  };

  const alCompletarRegistro = async (datosNuevos) => {
    setDatosProveedor((previo) => ({ ...previo, ...datosNuevos }));
    if (datosNuevos.evaluacionFinalizada) {
      try {
        const resultado = await obtenerResultadoPortalApi();
        setResultadoEvaluacion(resultado);
      } catch {
      }
      setPasoPortal('resultado');
    } else {
      setPasoPortal('cuestionario');
    }
  };

  const alFinalizarCuestionario = (resultado) => {
    setResultadoEvaluacion(resultado);
    setPasoPortal('resultado');
  };

  const reiniciarFlujoProveedor = () => {
    localStorage.removeItem('tokenSesionProveedor');
    setDatosProveedor({});
    setResultadoEvaluacion(null);
    setPasoPortal('acceso_otp');
  };

  const cerrarSesionCorporativa = () => {
    localStorage.removeItem('sesionCorporativa');
    localStorage.removeItem('tokenSesionCorporativa');
    setSesionCorporativa(null);
  };

  return (
    <div className="min-h-screen bg-plataformaFondo flex flex-col font-sans">
      <CabeceraNavegacion
        entornoActual={entornoActual}
        sesionCorporativa={sesionCorporativa}
        alCerrarSesionCorporativa={cerrarSesionCorporativa}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {entornoActual === 'corporativo' ? (
            <motion.div
              key={sesionCorporativa ? 'dashboard' : 'login'}
              {...transicionPagina}
            >
              {sesionCorporativa ? (
                <DashboardCorporativo />
              ) : (
                <InicioSesionCorporativo alIniciarSesion={iniciarSesionCorporativa} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key={pasoPortal}
              {...transicionPagina}
            >
              {pasoPortal === 'acceso_otp' && (
                <AccesoOtp alCompletarAcceso={alCompletarAccesoOtp} />
              )}
              {pasoPortal === 'registro' && (
                <RegistroProveedor
                  proveedorExistente={datosProveedor}
                  contextoEnlace={contextoEnlace}
                  alCompletarRegistro={alCompletarRegistro}
                />
              )}
              {pasoPortal === 'cuestionario' && (
                <CuestionarioDinamico
                  datosProveedor={datosProveedor}
                  alFinalizarCuestionario={alFinalizarCuestionario}
                />
              )}
              {pasoPortal === 'resultado' && (
                <ResultadoBento
                  resultado={resultadoEvaluacion}
                  datosProveedor={datosProveedor}
                  alReiniciar={reiniciarFlujoProveedor}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 border-t border-black/[0.04] text-center">
        <p className="text-subtexto text-plataformaSecundario">
          Plataforma Centralizada de Evaluaciones de Sostenibilidad de Proveedores
        </p>
        <p className="text-subtexto text-plataformaSecundario mt-0.5">
          Intercorp Retail — 2026
        </p>
      </footer>
    </div>
  );
}
