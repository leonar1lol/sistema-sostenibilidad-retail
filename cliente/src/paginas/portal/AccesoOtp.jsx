import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import { solicitarAccesoPortalApi, verificarAccesoPortalApi } from '../../servicios/servicioApi.js';

export default function AccesoOtp({ alCompletarAcceso }) {
  const [fase, setFase] = useState('correo');
  const [correo, setCorreo] = useState('');
  const [casillasOtp, setCasillasOtp] = useState(['', '', '', '', '', '']);
  const [segundosRestantes, setSegundosRestantes] = useState(600);
  const [codigoDemostracion, setCodigoDemostracion] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);
  const referenciasCasillas = useRef([]);

  useEffect(() => {
    if (fase !== 'otp' || segundosRestantes <= 0) return;
    const temporizador = setInterval(() => {
      setSegundosRestantes((previo) => (previo > 0 ? previo - 1 : 0));
    }, 1000);
    return () => clearInterval(temporizador);
  }, [fase, segundosRestantes]);

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosResto = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosResto.toString().padStart(2, '0')}`;
  };

  const solicitarCodigo = async (evento) => {
    evento?.preventDefault();
    setMensajeError('');
    setCargando(true);
    try {
      const datos = await solicitarAccesoPortalApi(correo);
      setCodigoDemostracion(datos.codigoDemostracion || '');
      setFase('otp');
      setSegundosRestantes(600);
      setCasillasOtp(['', '', '', '', '', '']);
      setTimeout(() => referenciasCasillas.current[0]?.focus(), 50);
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  };

  const alCambiarCasilla = (indice, valor) => {
    if (!/^\d*$/.test(valor)) return;

    const nuevasCasillas = [...casillasOtp];
    nuevasCasillas[indice] = valor.slice(-1);
    setCasillasOtp(nuevasCasillas);
    setMensajeError('');

    if (valor && indice < 5) {
      referenciasCasillas.current[indice + 1]?.focus();
    }
  };

  const alPresionarTecla = (indice, evento) => {
    if (evento.key === 'Backspace' && !casillasOtp[indice] && indice > 0) {
      referenciasCasillas.current[indice - 1]?.focus();
    }
  };

  const alPegarTexto = (evento) => {
    evento.preventDefault();
    const datosPegados = evento.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(datosPegados)) {
      setCasillasOtp(datosPegados.split(''));
      referenciasCasillas.current[5]?.focus();
    }
  };

  const validarAcceso = async (evento) => {
    evento?.preventDefault();
    const codigoIngresado = casillasOtp.join('');

    if (codigoIngresado.length < 6) {
      setMensajeError('Por favor ingrese los 6 dígitos del código de seguridad.');
      return;
    }
    if (segundosRestantes === 0) {
      setMensajeError('El código ha caducado. Solicite un nuevo código.');
      return;
    }

    setCargando(true);
    setMensajeError('');
    try {
      const datos = await verificarAccesoPortalApi(correo, codigoIngresado);
      alCompletarAcceso({ correo, proveedorExistente: datos.proveedorExistente });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  };

  if (fase === 'correo') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-220px)] px-4 py-8">
        <TarjetaBento clasePersonalizada="max-w-[440px] w-full p-8 shadow-sm-token relative">
          <span className="absolute top-4 right-4 bg-black/[0.05] text-plataformaSecundario text-[10px] font-bold px-2 py-1 rounded-sm-token uppercase tracking-widest">
            Paso 1 de 4
          </span>
          <div className="text-center mb-8 mt-2">
            <div className="w-12 h-12 rounded-md-token bg-plataformaAzul/[0.08] text-plataformaAzul flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="insignia-info mb-2">Portal del Proveedor</span>
            <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
              Ingrese su correo institucional
            </h2>
            <p className="text-cuerpo-pequeno text-plataformaSecundario mt-2">
              Le enviaremos un código de acceso de un solo uso, válido por 10 minutos.
            </p>
          </div>

          <form onSubmit={solicitarCodigo} className="space-y-5">
            <div>
              <label className="text-etiqueta text-plataformaSecundario mb-2 block">
                Correo corporativo del representante
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className="campo-entrada campo-entrada-icono w-full"
                  placeholder="representante@proveedor.com.pe"
                />
              </div>
            </div>

            {mensajeError && (
              <div className="p-3 bg-red-50 border border-red-200/60 rounded-md-token flex items-center gap-2.5 text-cuerpo-pequeno text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mensajeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="boton-primario w-full flex items-center justify-center gap-2 py-3"
            >
              <span>{cargando ? 'Enviando código...' : 'Solicitar código de verificación'}</span>
              {!cargando && <ArrowRight className="w-4 h-4 stroke-[2]" />}
            </button>

            <p className="text-[11px] text-center text-plataformaSecundario pt-2 leading-relaxed">
              El código OTP será emitido conforme a la directiva de seguridad de accesos externos de Intercorp Retail.
            </p>
          </form>
        </TarjetaBento>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-220px)] px-4 py-8">
      <TarjetaBento clasePersonalizada="max-w-[440px] w-full p-8 shadow-sm-token relative">
        <span className="absolute top-4 right-4 bg-black/[0.05] text-plataformaSecundario text-[10px] font-bold px-2 py-1 rounded-sm-token uppercase tracking-widest">
          Paso 1 de 4
        </span>
        <div className="text-center mb-8 mt-2">
          <div className="w-12 h-12 rounded-md-token bg-plataformaAzul/[0.08] text-plataformaAzul flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="insignia-info mb-2">Acceso Seguro</span>
          <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
            Validación de identidad
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-2">
            Ingrese el código de verificación remitido a {correo}.
          </p>
        </div>

        <form onSubmit={validarAcceso} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-etiqueta text-plataformaSecundario">
                Código de seguridad (6 dígitos)
              </label>
              <span className={`font-mono text-subtexto font-medium px-2 py-0.5 rounded-full ${
                segundosRestantes < 60 ? 'insignia-peligro' : 'insignia-neutra'
              }`}>
                {formatearTiempo(segundosRestantes)}
              </span>
            </div>

            <div className="flex justify-between gap-2 mb-2" onPaste={alPegarTexto}>
              {casillasOtp.map((digito, indice) => (
                <input
                  key={indice}
                  ref={(elemento) => (referenciasCasillas.current[indice] = elemento)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digito}
                  onChange={(e) => alCambiarCasilla(indice, e.target.value)}
                  onKeyDown={(e) => alPresionarTecla(indice, e)}
                  className="w-12 h-14 text-center text-xl font-semibold bg-black/[0.025] border border-black/[0.08] rounded-md-token focus:bg-white focus:border-plataformaAzul focus:shadow-[0_0_0_3px_rgba(0,113,227,0.12)] transition-all duration-180"
                />
              ))}
            </div>

            {codigoDemostracion && (
              <div className="mt-3 p-3 bg-black/[0.02] border border-black/[0.06] rounded-md-token flex items-center justify-between gap-2">
                <span className="text-subtexto text-plataformaSecundario">
                  Código remitido a su casilla: <strong className="font-mono text-plataformaTexto font-semibold">{codigoDemostracion}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCasillasOtp(codigoDemostracion.split(''));
                    referenciasCasillas.current[5]?.focus();
                  }}
                  className="text-xs text-plataformaAzul hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Pegar código
                </button>
              </div>
            )}
          </div>

          {mensajeError && (
            <div className="p-3 bg-red-50 border border-red-200/60 rounded-md-token flex items-center gap-2.5 text-cuerpo-pequeno text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="boton-primario w-full flex items-center justify-center gap-2 py-3"
            >
              <span>{cargando ? 'Verificando credenciales...' : 'Verificar e Ingresar'}</span>
              {!cargando && <ArrowRight className="w-4 h-4 stroke-[2]" />}
            </button>

            <button
              type="button"
              onClick={solicitarCodigo}
              className="boton-secundario w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[1.8]" />
              <span>Solicitar nuevo código</span>
            </button>
          </div>

          <p className="text-subtexto text-center text-plataformaSecundario leading-normal pt-1">
            El código tiene vigencia estricta de diez minutos y queda invalidado tras su uso.
          </p>
        </form>
      </TarjetaBento>
    </div>
  );
}
