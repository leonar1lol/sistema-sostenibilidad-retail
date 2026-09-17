import React, { useState, useEffect } from 'react';
import { Building2, User, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import { obtenerDatosMaestrosPortalApi, registrarProveedorPortalApi } from '../../servicios/servicioApi.js';

export default function RegistroProveedor({ proveedorExistente, contextoEnlace, alCompletarRegistro }) {
  const [ruc, setRuc] = useState(proveedorExistente?.ruc || '');
  const [razonSocial, setRazonSocial] = useState(proveedorExistente?.razonSocial || '');
  const [representante, setRepresentante] = useState(proveedorExistente?.representante || '');
  const [idIndustria, setIdIndustria] = useState(proveedorExistente?.idIndustria ? String(proveedorExistente.idIndustria) : '');
  const [tipo, setTipo] = useState(proveedorExistente?.tipo || 'Retail');
  const [industrias, setIndustrias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [idUnidad, setIdUnidad] = useState(
    contextoEnlace?.idUnidad ? String(contextoEnlace.idUnidad) : (proveedorExistente?.idUnidad ? String(proveedorExistente.idUnidad) : '1')
  );
  const [aceptaDatosPersonales, setAceptaDatosPersonales] = useState(true);
  const [errorConsentimiento, setErrorConsentimiento] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerDatosMaestrosPortalApi()
      .then((datos) => {
        setIndustrias(datos.industrias || []);
        setIdIndustria((actual) => actual || String(datos.industrias?.[0]?.id_industria ?? ''));
        setUnidades(datos.unidadesNegocio || []);
        if (!contextoEnlace?.idUnidad && datos.unidadesNegocio?.length > 0) {
          setIdUnidad((actual) => actual || String(datos.unidadesNegocio[0]?.id_unidad ?? '1'));
        }
      })
      .catch((error) => setMensajeError(error.message));
  }, []);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!aceptaDatosPersonales) {
      setErrorConsentimiento('Debe autorizar el tratamiento de datos personales para continuar.');
      return;
    }

    setEnviando(true);
    setMensajeError('');
    try {
      const idUnidadFinal = contextoEnlace?.idUnidad ? Number(contextoEnlace.idUnidad) : Number(idUnidad || 1);
      const datos = await registrarProveedorPortalApi({
        ruc,
        razonSocial,
        representante,
        idIndustria: Number(idIndustria),
        tipo,
        idCampania: contextoEnlace?.idCampania ? Number(contextoEnlace.idCampania) : undefined,
        idUnidad: idUnidadFinal
      });
      alCompletarRegistro({ ruc, razonSocial, representante, idIndustria, evaluacionFinalizada: datos.evaluacionFinalizada });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8">
      <TarjetaBento clasePersonalizada="max-w-xl w-full p-8 shadow-sm-token">
        <div className="mb-6">
          <span className="insignia-info mb-2">Paso 1 de 2 • Identificación</span>
          <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
            Registro corporativo del proveedor
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
            Valide los datos fiscales de su entidad antes de iniciar el cuestionario de evaluación.
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                Número de RUC (11 dígitos)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                <input
                  type="text"
                  maxLength={11}
                  required
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  className="campo-entrada campo-entrada-icono w-full font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                Tipo de proveedor
              </label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo-select w-full text-xs">
                <option value="Retail">Retail</option>
                <option value="No retail">No retail</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
              Razón Social
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
              <input
                type="text"
                required
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="campo-entrada campo-entrada-icono w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
              Representante de contacto
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
              <input
                type="text"
                required
                value={representante}
                onChange={(e) => setRepresentante(e.target.value)}
                className="campo-entrada campo-entrada-icono w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
              Industria o Sector
            </label>
            <select
              value={idIndustria}
              onChange={(e) => setIdIndustria(e.target.value)}
              className="campo-select w-full text-xs"
            >
              {industrias.map((ind) => (
                <option key={ind.id_industria} value={ind.id_industria}>{ind.nombre}</option>
              ))}
            </select>
          </div>

          {!contextoEnlace?.idUnidad && unidades.length > 0 && (
            <div>
              <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                Unidad de Negocio solicitante
              </label>
              <select
                value={idUnidad}
                onChange={(e) => setIdUnidad(e.target.value)}
                className="campo-select w-full text-xs"
              >
                {unidades.map((uni) => (
                  <option key={uni.id_unidad} value={uni.id_unidad}>{uni.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-l-2 border-plataformaAzul pl-4 py-3 bg-black/[0.015] rounded-r-md-token">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="chkConsentimiento"
                checked={aceptaDatosPersonales}
                onChange={(e) => {
                  setAceptaDatosPersonales(e.target.checked);
                  setErrorConsentimiento('');
                }}
                className="mt-0.5 rounded text-plataformaAzul cursor-pointer"
              />
              <label htmlFor="chkConsentimiento" className="text-cuerpo-pequeno text-plataformaTexto leading-relaxed cursor-pointer">
                Autorizo el tratamiento de mis datos personales de contacto conforme a la <strong>Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú)</strong> con el fin exclusivo de registrar la evaluación de sostenibilidad de Intercorp Retail (RNF03).
              </label>
            </div>
            {errorConsentimiento && (
              <span className="text-subtexto text-red-600 block pt-1.5 pl-6">
                {errorConsentimiento}
              </span>
            )}
          </div>

          {mensajeError && (
            <div className="p-3 bg-red-50 border border-red-200/60 rounded-md-token flex items-center gap-2.5 text-cuerpo-pequeno text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="boton-primario w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{enviando ? 'Guardando...' : 'Confirmar y comenzar evaluación'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </form>
      </TarjetaBento>
    </div>
  );
}
