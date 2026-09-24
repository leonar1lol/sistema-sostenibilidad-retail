import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { iniciarSesionApi } from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

export default function InicioSesionCorporativo({ alIniciarSesion }) {
  const [correo, setCorreo] = useState('admin@intercorpretail.pe');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useMensajeTemporal();

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setMensajeError('');
    setCargando(true);
    try {
      const { token, usuario } = await iniciarSesionApi(correo, clave);
      localStorage.setItem('tokenSesionCorporativa', token);
      alIniciarSesion({ ...usuario, token });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className="max-w-[420px] w-full superficie-tarjeta rounded-lg-token p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-md-token bg-plataformaCorporativo text-white flex items-center justify-center mx-auto mb-5 text-lg font-bold">
            IR
          </div>
          <h2 className="text-titulo-seccion text-center">
            Inicio de sesión corporativo
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario text-center mt-2 mb-8">
            Acceso restringido para personal del Corporativo y de las unidades de negocio de Intercorp Retail.
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label className="text-etiqueta text-plataformaSecundario mb-2 block">
              Correo corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.7]" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@intercorpretail.pe"
                className="campo-entrada campo-entrada-icono w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-etiqueta text-plataformaSecundario mb-2 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.7]" />
              <input
                type="password"
                required
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="campo-entrada campo-entrada-icono w-full"
              />
            </div>
          </div>

          {mensajeError && (
            <div className="rounded-md-token bg-red-50 border border-red-200/60 p-3 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="boton-primario w-full flex items-center justify-center gap-2"
            >
              <span>{cargando ? 'Ingresando...' : 'Ingresar'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
