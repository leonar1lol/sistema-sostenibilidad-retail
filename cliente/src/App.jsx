import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, FileText, ClipboardCheck, Trophy, Check } from 'lucide-react';
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

const PASOS_PROVEEDOR = [
  { id: 'acceso_otp', titulo: '1. Acceso', icono: Mail },
  { id: 'registro', titulo: '2. Registro', icono: FileText },
  { id: 'cuestionario', titulo: '3. Cuestionario', icono: ClipboardCheck },
  { id: 'resultado', titulo: '4. Resultado', icono: Trophy }
];

const IndicadorPasos = ({ pasoActual, alSeleccionarPaso }) => {
  const indiceActual = PASOS_PROVEEDOR.findIndex((p) => p.id === pasoActual);

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 sm:px-8 w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-6 right-6 top-5 h-[2px] bg-black/[0.08] -z-10"></div>
        <div
          className="absolute left-6 h-[2px] bg-emerald-500 transition-all duration-500 -z-10"
          style={{ width: `${(Math.max(0, indiceActual) / (PASOS_PROVEEDOR.length - 1)) * 90}%` }}
        ></div>

        {PASOS_PROVEEDOR.map((paso, index) => {
          const completado = index < indiceActual;
          const actual = index === indiceActual;
          const Icono = paso.icono;

          let claseCirculo = 'bg-superficie-secundaria border-black/[0.1] text-plataformaSecundario hover:border-black/[0.2]';
          if (completado) {
            claseCirculo = 'bg-emerald-500 border-emerald-500 text-white';
          } else if (actual) {
            claseCirculo = 'bg-plataformaAzul border-plataformaAzul text-white shadow-[0_0_0_4px_rgba(0,113,227,0.15)]';
          }

          const puedeNavegar = index <= indiceActual;

          return (
            <button
              key={paso.id}
              type="button"
              disabled={!puedeNavegar}
              onClick={() => {
                if (puedeNavegar) {
                  alSeleccionarPaso(paso.id);
                }
              }}
              className={`flex flex-col items-center gap-1.5 bg-plataformaFondo px-2 sm:px-4 transition-all ${
                puedeNavegar ? 'cursor-pointer group' : 'cursor-default opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${claseCirculo}`}
              >
                {completado ? <Check className="w-5 h-5 stroke-[2.2]" /> : <Icono className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] sm:text-etiqueta font-semibold transition-colors ${
                  actual
                    ? 'text-plataformaAzul font-bold'
                    : completado
                    ? 'text-emerald-600'
                    : 'text-plataformaSecundario'
                }`}
              >
                {paso.titulo}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function AplicacionPrincipal() {
  const [entornoActual, setEntornoActual] = useState(esRutaCorporativa() ? 'corporativo' : 'proveedor');
  const [pasoPortal, setPasoPortal] = useState('acceso_otp');
  const [contextoEnlace] = useState(leerContextoEnlaceDesdeUrl);
  const [pestanaAdminActiva, setPestanaAdminActiva] = useState('resumen');

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

  const alCompletarAccesoOtp = ({ correo }) => {
    setDatosProveedor({ correo });
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
        alCambiarEntorno={setEntornoActual}
        sesionCorporativa={sesionCorporativa}
        alCerrarSesionCorporativa={cerrarSesionCorporativa}
      />

      <main className="flex-1">
        {entornoActual === 'proveedor' && (
          <IndicadorPasos
            pasoActual={pasoPortal}
            alSeleccionarPaso={(nuevoPaso) => setPasoPortal(nuevoPaso)}
          />
        )}

        <AnimatePresence mode="wait">
          {entornoActual === 'corporativo' ? (
            <motion.div
              key={sesionCorporativa ? 'dashboard' : 'login'}
              {...transicionPagina}
            >
              {sesionCorporativa ? (
                <DashboardCorporativo
                  pestanaInicial={pestanaAdminActiva}
                  alCambiarPestana={setPestanaAdminActiva}
                />
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

      <footer className="py-6 border-t border-black/[0.04] text-center bg-white/40 backdrop-blur-sm">
        <p className="text-subtexto text-plataformaSecundario">
          Plataforma Integral de Homologación y Evaluación de Sostenibilidad de Proveedores
        </p>
        <p className="text-subtexto text-plataformaSecundario mt-0.5">
          Intercorp Retail • Curso Integrador II — 2026
        </p>
      </footer>
    </div>
  );
}
