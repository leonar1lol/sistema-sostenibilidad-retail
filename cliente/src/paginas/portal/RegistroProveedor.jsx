import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  FileText,
  ChevronRight,
  AlertCircle,
  MapPin,
  Briefcase,
  Phone,
  Globe,
  Store,
  Layers,
  CheckCircle2
} from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import { obtenerDatosMaestrosPortalApi, registrarProveedorPortalApi } from '../../servicios/servicioApi.js';

export default function RegistroProveedor({ proveedorExistente, contextoEnlace, alCompletarRegistro }) {
  const [ruc, setRuc] = useState(proveedorExistente?.ruc || '');
  const [razonSocial, setRazonSocial] = useState(proveedorExistente?.razonSocial || '');
  const [nombreComercial, setNombreComercial] = useState(proveedorExistente?.nombreComercial || '');
  const [direccionFiscal, setDireccionFiscal] = useState(proveedorExistente?.direccionFiscal || '');
  const [departamento, setDepartamento] = useState(proveedorExistente?.departamento || 'Lima');
  const [representante, setRepresentante] = useState(proveedorExistente?.representante || '');
  const [cargoRepresentante, setCargoRepresentante] = useState(proveedorExistente?.cargoRepresentante || 'Gerente General');
  const [telefono, setTelefono] = useState(proveedorExistente?.telefono || '');
  const [sitioWeb, setSitioWeb] = useState(proveedorExistente?.sitioWeb || '');
  const [tamanoEmpresa, setTamanoEmpresa] = useState(proveedorExistente?.tamanoEmpresa || 'Pequeña empresa (11 - 50 colaboradores)');
  const [aniosOperacion, setAniosOperacion] = useState(proveedorExistente?.aniosOperacion || 'De 2 a 5 años');
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
        nombreComercial,
        direccionFiscal,
        departamento,
        representante,
        cargoRepresentante,
        telefono,
        sitioWeb,
        tamanoEmpresa,
        aniosOperacion,
        idIndustria: Number(idIndustria),
        tipo,
        idCampania: contextoEnlace?.idCampania ? Number(contextoEnlace.idCampania) : undefined,
        idUnidad: idUnidadFinal
      });
      alCompletarRegistro({
        ruc,
        razonSocial,
        nombreComercial,
        direccionFiscal,
        departamento,
        representante,
        cargoRepresentante,
        telefono,
        sitioWeb,
        tamanoEmpresa,
        aniosOperacion,
        idIndustria,
        evaluacionFinalizada: datos.evaluacionFinalizada
      });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const listaDepartamentos = [
    'Lima',
    'Arequipa',
    'La Libertad',
    'Piura',
    'Cusco',
    'Junín',
    'Lambayeque',
    'Ancash',
    'Callao',
    'Ica',
    'San Martín',
    'Loreto',
    'Cajamarca',
    'Tacna',
    'Huánuco',
    'Ayacucho',
    'Ucayali',
    'Puno',
    'Moquegua',
    'Tumbes',
    'Otras Regiones / Exterior'
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8">
      <TarjetaBento clasePersonalizada="max-w-3xl w-full p-8 md:p-10 shadow-sm-token">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-black/[0.06]">
          <div>
            <span className="insignia-info mb-2">Paso 1 de 2 • Identificación y Homologación</span>
            <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
              Ficha corporativa del proveedor
            </h2>
            <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1">
              Complete los datos fiscales, operativos y de contacto requeridos para la homologación ESG.
            </p>
          </div>
          {proveedorExistente?.correo && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full self-start sm:self-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-subtexto text-emerald-700 font-medium">{proveedorExistente.correo}</span>
            </div>
          )}
        </div>

        <form onSubmit={manejarEnvio} className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-plataformaAzul" />
              <span className="text-etiqueta font-semibold text-plataformaTexto uppercase tracking-wider text-[11px]">
                Información Fiscal y de la Entidad
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Número de RUC (11 dígitos) *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    maxLength={11}
                    required
                    placeholder="20100055237"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Tipo de proveedor *
                </label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo-select w-full text-xs">
                  <option value="Retail">Retail (Mercadería y Comercialización)</option>
                  <option value="No retail">No retail (Servicios y Suministros)</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Razón Social *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    required
                    placeholder="Distribuidora Logística del Perú S.A.C."
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Nombre Comercial / Marca
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    placeholder="Logística Perú Express"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Dirección Fiscal / Sede Principal
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    placeholder="Av. República de Panamá 3505, San Isidro"
                    value={direccionFiscal}
                    onChange={(e) => setDireccionFiscal(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Departamento / Región
                </label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  {listaDepartamentos.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 pt-2">
              <User className="w-4 h-4 text-plataformaAzul" />
              <span className="text-etiqueta font-semibold text-plataformaTexto uppercase tracking-wider text-[11px]">
                Contacto y Representación Legal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Representante de contacto *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    required
                    placeholder="Miguel Ángel Torres"
                    value={representante}
                    onChange={(e) => setRepresentante(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Cargo del Representante
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    placeholder="Gerente General / Director de Operaciones"
                    value={cargoRepresentante}
                    onChange={(e) => setCargoRepresentante(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Teléfono / Celular corporativo
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    placeholder="987654321"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Sitio Web Corporativo
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    placeholder="https://www.distribuidoraperu.com"
                    value={sitioWeb}
                    onChange={(e) => setSitioWeb(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 pt-2">
              <Layers className="w-4 h-4 text-plataformaAzul" />
              <span className="text-etiqueta font-semibold text-plataformaTexto uppercase tracking-wider text-[11px]">
                Perfil Operativo y Cadena de Suministro
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Industria o Sector *
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
                  Unidad de Negocio solicitante *
                </label>
                <select
                  value={idUnidad}
                  onChange={(e) => setIdUnidad(e.target.value)}
                  disabled={Boolean(contextoEnlace?.idUnidad)}
                  className="campo-select w-full text-xs"
                >
                  {unidades.map((uni) => (
                    <option key={uni.id_unidad} value={uni.id_unidad}>{uni.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Tamaño de la Empresa
                </label>
                <select
                  value={tamanoEmpresa}
                  onChange={(e) => setTamanoEmpresa(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="Microempresa (1 - 10 colaboradores)">Microempresa (1 - 10 colaboradores)</option>
                  <option value="Pequeña empresa (11 - 50 colaboradores)">Pequeña empresa (11 - 50 colaboradores)</option>
                  <option value="Mediana empresa (51 - 250 colaboradores)">Mediana empresa (51 - 250 colaboradores)</option>
                  <option value="Gran empresa (Más de 250 colaboradores)">Gran empresa (Más de 250 colaboradores)</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Años de Operación en el Mercado
                </label>
                <select
                  value={aniosOperacion}
                  onChange={(e) => setAniosOperacion(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="Menos de 2 años">Menos de 2 años</option>
                  <option value="De 2 a 5 años">De 2 a 5 años</option>
                  <option value="De 6 a 10 años">De 6 a 10 años</option>
                  <option value="Más de 10 años">Más de 10 años</option>
                </select>
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
                Declaro bajo juramento que los datos corporativos, fiscales y operativos consignados son verídicos y autorizo su tratamiento conforme a la <strong>Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú)</strong> con el fin exclusivo del proceso de homologación y evaluación de sostenibilidad de Intercorp Retail.
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
              className="boton-primario w-full flex items-center justify-center gap-2 py-3 cursor-pointer text-sm font-semibold"
            >
              <span>{enviando ? 'Guardando expediente...' : 'Confirmar y comenzar evaluación'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </form>
      </TarjetaBento>
    </div>
  );
}
