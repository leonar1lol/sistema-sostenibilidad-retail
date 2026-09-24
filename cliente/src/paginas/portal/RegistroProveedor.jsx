import React, { useState, useEffect } from 'react';
import { Building2, User, FileText, ChevronRight, AlertCircle, CreditCard, Phone, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import { obtenerDatosMaestrosPortalApi, registrarProveedorPortalApi, buscarProveedorPorRucApi } from '../../servicios/servicioApi.js';
import { useMensajeTemporal } from '../../utilidades/useMensajeTemporal.js';

const TAMANOS_EMPRESA = ['MYPE', 'PYME', 'Gran empresa'];

export default function RegistroProveedor({ proveedorExistente, contextoEnlace, alCompletarRegistro }) {
  const [ruc, setRuc] = useState(proveedorExistente?.ruc || '');
  const [razonSocial, setRazonSocial] = useState(proveedorExistente?.razonSocial || '');
  const [pais, setPais] = useState('Perú');
  const [representante, setRepresentante] = useState(proveedorExistente?.representante || '');
  const [idIndustria, setIdIndustria] = useState(proveedorExistente?.idIndustria ? String(proveedorExistente.idIndustria) : '');
  const [tipo, setTipo] = useState(proveedorExistente?.tipo || 'Retail');
  const [tamanoEmpresa, setTamanoEmpresa] = useState('');
  const [industrias, setIndustrias] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [idsUnidadSeleccionadas, setIdsUnidadSeleccionadas] = useState([]);
  const [errorUnidades, setErrorUnidades] = useState('');

  const [nombreContacto, setNombreContacto] = useState('');
  const [celularContacto, setCelularContacto] = useState('');
  const [dniContacto, setDniContacto] = useState('');
  const [cargoContacto, setCargoContacto] = useState('');

  const [aceptaDatosPersonales, setAceptaDatosPersonales] = useState(true);
  const [errorConsentimiento, setErrorConsentimiento] = useState('');
  const [mensajeError, setMensajeError] = useMensajeTemporal();
  const [enviando, setEnviando] = useState(false);
  const [buscandoRuc, setBuscandoRuc] = useState(false);
  const [proveedorEncontrado, setProveedorEncontrado] = useState(false);

  useEffect(() => {
    obtenerDatosMaestrosPortalApi()
      .then((datos) => {
        setIndustrias(datos.industrias);
        setIdIndustria((actual) => actual || String(datos.industrias[0]?.id_industria ?? ''));
        setUnidadesNegocio(datos.unidadesNegocio);
      })
      .catch((error) => setMensajeError(error.message));
  }, []);

  // El corporativo ya mantiene una base de proveedores (críticos y no
  // críticos) con RUC, industria, tipo y unidades. Al completar el RUC se
  // autocompletan esos datos para no duplicar el registro; el evaluado puede
  // corregir cualquier campo si algo cambió antes de enviar el formulario.
  useEffect(() => {
    const rucLimpio = ruc.trim();
    if (rucLimpio.length !== 11) {
      setProveedorEncontrado(false);
      return;
    }
    let cancelado = false;
    setBuscandoRuc(true);
    const temporizador = setTimeout(async () => {
      try {
        const encontrado = await buscarProveedorPorRucApi(rucLimpio);
        if (cancelado) return;
        if (encontrado) {
          setRazonSocial(encontrado.razonSocial || '');
          setRepresentante(encontrado.representante || '');
          if (encontrado.idIndustria) setIdIndustria(String(encontrado.idIndustria));
          if (encontrado.tipo) setTipo(encontrado.tipo);
          if (encontrado.pais) setPais(encontrado.pais);
          setTamanoEmpresa(encontrado.tamanoEmpresa || '');
          if (Array.isArray(encontrado.idsUnidad) && encontrado.idsUnidad.length > 0) {
            setIdsUnidadSeleccionadas(encontrado.idsUnidad);
          }
          setProveedorEncontrado(true);
        } else {
          setProveedorEncontrado(false);
        }
      } catch {
        setProveedorEncontrado(false);
      } finally {
        if (!cancelado) setBuscandoRuc(false);
      }
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [ruc]);

  const alternarUnidad = (idUnidad) => {
    setIdsUnidadSeleccionadas((actual) =>
      actual.includes(idUnidad) ? actual.filter((id) => id !== idUnidad) : [...actual, idUnidad]
    );
    setErrorUnidades('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!aceptaDatosPersonales) {
      setErrorConsentimiento('Debe autorizar el tratamiento de datos personales para continuar.');
      return;
    }
    if (idsUnidadSeleccionadas.length === 0) {
      setErrorUnidades('Seleccione al menos una unidad de negocio a la que brinda servicios.');
      return;
    }

    setEnviando(true);
    setMensajeError('');
    try {
      const datos = await registrarProveedorPortalApi({
        ruc,
        razonSocial,
        pais,
        representante,
        idIndustria: Number(idIndustria),
        tipo,
        tamanoEmpresa: tamanoEmpresa || null,
        nombreContacto,
        celularContacto,
        dniContacto,
        cargoContacto,
        idsUnidad: idsUnidadSeleccionadas,
        idCampania: contextoEnlace?.idCampania ? Number(contextoEnlace.idCampania) : undefined
      });
      alCompletarRegistro({ ruc, razonSocial, representante, idIndustria, evaluacionFinalizada: datos.evaluacionFinalizada });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-start sm:items-center justify-center min-h-[calc(100vh-140px)] px-3 py-4 sm:px-4 sm:py-8">
      <TarjetaBento clasePersonalizada="max-w-xl lg:max-w-4xl w-full p-4 sm:p-8 shadow-sm-token">
        <div className="mb-6">
          <span className="insignia-info mb-2">Paso 1 de 2 • Identificación</span>
          <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
            Registro corporativo del proveedor
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
            Valide los datos fiscales de su entidad antes de iniciar el cuestionario de evaluación.
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-6">
          <div className="space-y-4">
            <span className="text-etiqueta text-plataformaAzul block uppercase">Información de la empresa</span>

            {proveedorEncontrado && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-md-token flex items-center gap-2.5 text-cuerpo-pequeno text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Encontramos este RUC en nuestros registros: completamos sus datos automáticamente. Puede corregir cualquier campo si algo cambió.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  RUC (11 dígitos)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    maxLength={11}
                    required
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                    className="campo-entrada campo-entrada-icono w-full font-mono text-xs"
                  />
                  {buscandoRuc && (
                    <Loader2 className="w-4 h-4 text-plataformaSecundario absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  País
                </label>
                <input
                  type="text"
                  required
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="campo-entrada w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  Nombre del representante legal
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Tipo de proveedor
                </label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo-select w-full text-xs">
                  <option value="Retail">Retail</option>
                  <option value="No retail">No retail</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Tamaño de la empresa
                </label>
                <select value={tamanoEmpresa} onChange={(e) => setTamanoEmpresa(e.target.value)} className="campo-select w-full text-xs">
                  <option value="">Prefiero no indicarlo</option>
                  {TAMANOS_EMPRESA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                ¿A qué unidad(es) de negocio de Intercorp Retail le brinda servicios? (puede marcar más de una)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {unidadesNegocio.map((u) => (
                  <label
                    key={u.id_unidad}
                    className="flex items-center gap-2 p-2.5 rounded-sm-token bg-black/[0.02] border border-black/[0.04] text-cuerpo-pequeno text-plataformaTexto cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={idsUnidadSeleccionadas.includes(u.id_unidad)}
                      onChange={() => alternarUnidad(u.id_unidad)}
                    />
                    {u.nombre}
                  </label>
                ))}
              </div>
              {errorUnidades && (
                <span className="text-subtexto text-red-600 block pt-1.5">{errorUnidades}</span>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-black/[0.06]">
            <span className="text-etiqueta text-plataformaAzul block uppercase">Datos de la persona que realiza la evaluación</span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Nombre y apellido
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    required
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Cargo en la empresa
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    required
                    value={cargoContacto}
                    onChange={(e) => setCargoContacto(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    value={celularContacto}
                    onChange={(e) => setCelularContacto(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  DNI
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    value={dniContacto}
                    onChange={(e) => setDniContacto(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

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

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={enviando}
              className="boton-primario w-full lg:w-auto lg:px-10 flex items-center justify-center gap-2 cursor-pointer"
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
