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
  CheckCircle2,
  Check
} from 'lucide-react';
import TarjetaBento from '../../componentes/TarjetaBento.jsx';
import { obtenerDatosMaestrosPortalApi, registrarProveedorPortalApi } from '../../servicios/servicioApi.js';

export default function RegistroProveedor({ proveedorExistente, contextoEnlace, alCompletarRegistro }) {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [representante, setRepresentante] = useState('');
  const [cargoRepresentante, setCargoRepresentante] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [tamanoEmpresa, setTamanoEmpresa] = useState('');
  const [aniosOperacion, setAniosOperacion] = useState('');
  const [idIndustria, setIdIndustria] = useState('');
  const [tipo, setTipo] = useState('Retail');
  const [industrias, setIndustrias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [idUnidad, setIdUnidad] = useState(
    contextoEnlace?.idUnidad ? String(contextoEnlace.idUnidad) : ''
  );
  const [aceptaDatosPersonales, setAceptaDatosPersonales] = useState(false);
  const [errorConsentimiento, setErrorConsentimiento] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerDatosMaestrosPortalApi()
      .then((datos) => {
        setIndustrias(datos.industrias || []);
        setUnidades(datos.unidadesNegocio || []);
      })
      .catch((error) => setMensajeError(error.message));
  }, []);

  const manejarCambioRuc = (evento) => {
    const soloDigitos = evento.target.value.replace(/\D/g, '').slice(0, 11);
    setRuc(soloDigitos);
    setMensajeError('');
  };

  const manejarCambioTelefono = (evento) => {
    const soloDigitos = evento.target.value.replace(/\D/g, '').slice(0, 9);
    setTelefono(soloDigitos);
    setMensajeError('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setMensajeError('');
    setErrorConsentimiento('');

    if (ruc.length !== 11) {
      setMensajeError('El número de RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }

    if (telefono.length !== 9) {
      setMensajeError('El teléfono celular corporativo debe tener exactamente 9 dígitos numéricos.');
      return;
    }

    if (!departamento) {
      setMensajeError('Debe seleccionar el departamento o región fiscal.');
      return;
    }

    if (!cargoRepresentante.trim()) {
      setMensajeError('Debe ingresar el cargo del representante.');
      return;
    }

    if (!idIndustria) {
      setMensajeError('Debe seleccionar el sector económico o industria.');
      return;
    }

    if (!contextoEnlace?.idUnidad && !idUnidad) {
      setMensajeError('Debe seleccionar la unidad de negocio solicitante de Intercorp.');
      return;
    }

    if (!tamanoEmpresa) {
      setMensajeError('Debe seleccionar el tamaño de la empresa.');
      return;
    }

    if (!aniosOperacion) {
      setMensajeError('Debe seleccionar los años de operación de la empresa.');
      return;
    }

    if (!aceptaDatosPersonales) {
      setErrorConsentimiento('Debe autorizar el tratamiento de datos personales para continuar.');
      return;
    }

    const idUnidadFinal = contextoEnlace?.idUnidad ? Number(contextoEnlace.idUnidad) : Number(idUnidad || 1);

    setEnviando(true);
    try {
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
        idUnidad: idUnidadFinal,
        evaluacionFinalizada: datos.evaluacionFinalizada
      });
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const listaDepartamentos = [
    'Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cusco', 'Junín', 'Lambayeque', 'Ancash',
    'Callao', 'Ica', 'San Martín', 'Loreto', 'Cajamarca', 'Tacna', 'Huánuco', 'Ayacucho',
    'Ucayali', 'Puno', 'Moquegua', 'Tumbes', 'Otras Regiones / Exterior'
  ];

  const seccionFiscalCompleta = ruc.trim().length === 11 && razonSocial.trim().length > 0 && departamento !== '';
  const seccionContactoCompleta = representante.trim().length > 0 && cargoRepresentante.trim().length > 0 && telefono.trim().length === 9;
  const seccionOperativaCompleta = idIndustria !== '' && (Boolean(contextoEnlace?.idUnidad) || idUnidad !== '') && tamanoEmpresa !== '' && aniosOperacion !== '';

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-220px)] px-4 py-8">
      <TarjetaBento clasePersonalizada="max-w-3xl w-full p-8 md:p-10 shadow-sm-token relative">
        <span className="absolute top-4 right-4 bg-black/[0.05] text-plataformaSecundario text-[10px] font-bold px-2 py-1 rounded-sm-token uppercase tracking-widest">
          Paso 2 de 4
        </span>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 pb-4 border-b border-black/[0.06] mt-2">
          <div>
            <span className="insignia-info mb-2">Identificación y Homologación</span>
            <h2 className="text-titulo-seccion text-plataformaTexto mt-1">
              Ficha corporativa del proveedor
            </h2>
            <p className="text-cuerpo-pequeno text-plataformaSecundario mt-1 max-w-xl">
              Complete los datos fiscales, operativos y de contacto requeridos para el proceso de homologación ESG.
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
          <div className="relative border border-black/[0.05] p-5 rounded-lg-token bg-white">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-plataformaAzul" />
                <span className="text-sm font-semibold text-plataformaTexto uppercase tracking-wider">
                  Información Fiscal y de la Entidad
                </span>
              </div>
              {seccionFiscalCompleta && <Check className="w-5 h-5 text-emerald-500 stroke-[2.5]" />}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={11}
                    required
                    placeholder="20100130204"
                    value={ruc}
                    onChange={manejarCambioRuc}
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
                    placeholder="Distribuidora de Alimentos del Norte S.A.C."
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
                    placeholder="AlNorte Express"
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
                    placeholder="Av. La Marina 2500, San Miguel"
                    value={direccionFiscal}
                    onChange={(e) => setDireccionFiscal(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Departamento / Región *
                </label>
                <select
                  value={departamento}
                  required
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="">Seleccione su departamento</option>
                  {listaDepartamentos.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="relative border border-black/[0.05] p-5 rounded-lg-token bg-white">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-plataformaAzul" />
                <span className="text-sm font-semibold text-plataformaTexto uppercase tracking-wider">
                  Contacto y Representación Legal
                </span>
              </div>
              {seccionContactoCompleta && <Check className="w-5 h-5 text-emerald-500 stroke-[2.5]" />}
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
                    placeholder="Carlos Eduardo Mendoza Rivera"
                    value={representante}
                    onChange={(e) => setRepresentante(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Cargo del Representante *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    required
                    placeholder="Director de Operaciones"
                    value={cargoRepresentante}
                    onChange={(e) => setCargoRepresentante(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Teléfono / Celular corporativo (9 dígitos) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-plataformaSecundario absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.8]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    required
                    placeholder="987654321"
                    value={telefono}
                    onChange={manejarCambioTelefono}
                    className="campo-entrada campo-entrada-icono w-full text-xs font-mono"
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
                    placeholder="https://www.alnorteexpress.com.pe"
                    value={sitioWeb}
                    onChange={(e) => setSitioWeb(e.target.value)}
                    className="campo-entrada campo-entrada-icono w-full text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative border border-black/[0.05] p-5 rounded-lg-token bg-white">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-plataformaAzul" />
                <span className="text-sm font-semibold text-plataformaTexto uppercase tracking-wider">
                  Perfil Operativo y Cadena de Suministro
                </span>
              </div>
              {seccionOperativaCompleta && <Check className="w-5 h-5 text-emerald-500 stroke-[2.5]" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Industria o Sector *
                </label>
                <select
                  value={idIndustria}
                  required
                  onChange={(e) => setIdIndustria(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="">Seleccione su sector económico</option>
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
                  required
                  onChange={(e) => setIdUnidad(e.target.value)}
                  disabled={Boolean(contextoEnlace?.idUnidad)}
                  className="campo-select w-full text-xs"
                >
                  <option value="">Seleccione la unidad de Intercorp</option>
                  {unidades.map((uni) => (
                    <option key={uni.id_unidad} value={uni.id_unidad}>{uni.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Tamaño de la Empresa *
                </label>
                <select
                  value={tamanoEmpresa}
                  required
                  onChange={(e) => setTamanoEmpresa(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="">Seleccione tamaño de empresa</option>
                  <option value="Microempresa (1 - 10 colaboradores)">Microempresa (1 - 10 colaboradores)</option>
                  <option value="Pequeña empresa (11 - 50 colaboradores)">Pequeña empresa (11 - 50 colaboradores)</option>
                  <option value="Mediana empresa (51 - 250 colaboradores)">Mediana empresa (51 - 250 colaboradores)</option>
                  <option value="Gran empresa (Más de 250 colaboradores)">Gran empresa (Más de 250 colaboradores)</option>
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario mb-1.5 block">
                  Años de Operación en el Mercado *
                </label>
                <select
                  value={aniosOperacion}
                  required
                  onChange={(e) => setAniosOperacion(e.target.value)}
                  className="campo-select w-full text-xs"
                >
                  <option value="">Seleccione años de trayectoria</option>
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
