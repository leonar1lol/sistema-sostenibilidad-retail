import React from 'react';
import {
  BookOpen,
  X,
  Mail,
  FileText,
  ClipboardCheck,
  Trophy,
  BarChart3,
  Users,
  Database,
  History,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function GuiaRecorridoDemo({
  abierto,
  alCerrar,
  alNavegarPaso
}) {
  if (!abierto) return null;

  const pasosRecorrido = [
    {
      numero: '1',
      titulo: 'Acceso Seguro sin Contraseña (OTP)',
      modulo: 'Portal Proveedor',
      entorno: 'proveedor',
      pasoPortal: 'acceso_otp',
      icono: Mail,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      puntosClave: [
        'Código de un solo uso con caducidad de 10 minutos.',
        'Elimina almacenamiento de contraseñas de terceros externos.',
        'Generación y envío del código seguro al correo corporativo.'
      ]
    },
    {
      numero: '2',
      titulo: 'Ficha Corporativa y Homologación (14 Campos)',
      modulo: 'Portal Proveedor',
      entorno: 'proveedor',
      pasoPortal: 'registro',
      icono: FileText,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      puntosClave: [
        'Información fiscal (RUC 11 dígitos, Razón Social, Marca, Dirección, Región).',
        'Contacto y representación legal (Nombre, Cargo, Teléfono, Sitio Web).',
        'Cadena de suministro (Sector industrial, Unidad de Intercorp, Tamaño, Trayectoria).',
        'Consulta y validación directa al padrón de contribuyentes SUNAT.'
      ]
    },
    {
      numero: '3',
      titulo: 'Cuestionario ESG y Reglas Condicionales',
      modulo: 'Portal Proveedor',
      entorno: 'proveedor',
      pasoPortal: 'cuestionario',
      icono: ClipboardCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      puntosClave: [
        '4 Dimensiones: Ambiental, Social, Ética y Gobierno, y Laboral.',
        'Motor de visibilidad dinámica y ramificación condicional.',
        'Carga de evidencias documentales (PDF e imágenes hasta 5 MB).',
        'Guardado automático en tiempo real en PostgreSQL.'
      ]
    },
    {
      numero: '4',
      titulo: 'Calificación Ponderada y Recomendaciones',
      modulo: 'Portal Proveedor',
      entorno: 'proveedor',
      pasoPortal: 'resultado',
      icono: Trophy,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      puntosClave: [
        'Puntaje global consolidado de 0 a 100.',
        'Escala gráfica visual: Inicial (0-59), Intermedio (60-74), Avanzado (75-100).',
        'Desglose por dimensión con ponderación equitativa (25% cada una).',
        'Generación automatizada de planes de acción correctivos.'
      ]
    },
    {
      numero: '5',
      titulo: 'Panel de Control Corporativo y Métricas ESG',
      modulo: 'Panel Corporativo',
      entorno: 'corporativo',
      pestanaAdmin: 'resumen',
      icono: BarChart3,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      puntosClave: [
        'RF10: Métricas consolidadas del grupo Intercorp Retail.',
        'Padrón activo, proveedores críticos, porcentaje de avance y promedio ESG.',
        'Monitoreo del cumplimiento en las 7 unidades de negocio de Intercorp.',
        'Exportación instantánea de padrón a archivo Excel.'
      ]
    },
    {
      numero: '6',
      titulo: 'Directorio de Proveedores y Criticidad',
      modulo: 'Panel Corporativo',
      entorno: 'corporativo',
      pestanaAdmin: 'proveedores',
      icono: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      puntosClave: [
        'RF06 y RF07: Padrón unificado con búsqueda y filtros por unidad.',
        'Identificación y marcado de criticidad para debida diligencia reforzada.',
        'Ficha detallada con datos fiscales, operativos y descarga de evidencias (RF25).'
      ]
    },
    {
      numero: '7',
      titulo: 'Banco de Preguntas y Reglas Lógicas',
      modulo: 'Panel Corporativo',
      entorno: 'corporativo',
      pestanaAdmin: 'banco',
      icono: Database,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      puntosClave: [
        'RF04 y RF05: Parametrización dinámica sin modificar código fuente.',
        'Ponderación de preguntas y asignación específica por tipo de industria.',
        'Configurador visual de reglas condicionales (disparador y destino).'
      ]
    },
    {
      numero: '8',
      titulo: 'Campañas, Roles (RBAC) y Bitácora de Auditoría',
      modulo: 'Panel Corporativo',
      entorno: 'corporativo',
      pestanaAdmin: 'auditoria',
      icono: History,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      puntosClave: [
        'RF12: Gestión de campañas periódicas y enlaces personalizados.',
        'RF08: Control de acceso basado en roles con matriz de permisos.',
        'RF16: Bitácora de auditoría con trazabilidad de cada acción relevante.'
      ]
    }
  ];

  return (
    <div className="overlay-modal flex items-center justify-center p-4">
      <div className="contenido-modal max-w-3xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md-token bg-plataformaAzul/[0.1] text-plataformaAzul flex items-center justify-center">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="insignia-info text-[11px] font-semibold">
                  Protocolo de Homologación • Intercorp Retail
                </span>
                <span className="text-subtexto text-plataformaSecundario">
                  Manual Operativo
                </span>
              </div>
              <h2 className="text-titulo-seccion text-plataformaTexto mt-0.5">
                Flujo Integral de Homologación y Evaluación ESG
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="p-2 rounded-full hover:bg-black/[0.05] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg-token flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong className="block mb-1 text-sm font-semibold">
                Guía de Procesos de Inicio a Fin
              </strong>
              Este protocolo documenta los 8 procesos clave del sistema de homologación y evaluación de sostenibilidad. Puede navegar a cada módulo utilizando los accesos directos.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pasosRecorrido.map((paso) => {
              const Icono = paso.icono;
              return (
                <div
                  key={paso.numero}
                  className="p-4 rounded-lg-token border border-black/[0.08] bg-white hover:border-plataformaAzul/40 transition-all shadow-xs-token flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`w-9 h-9 rounded-md-token flex items-center justify-center font-bold text-sm shrink-0 border ${paso.color}`}>
                      <Icono className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-plataformaSecundario uppercase tracking-wider">
                          Paso {paso.numero} • {paso.modulo}
                        </span>
                      </div>
                      <h3 className="text-cuerpo font-semibold text-plataformaTexto mt-0.5">
                        {paso.titulo}
                      </h3>
                      <ul className="mt-2 space-y-1">
                        {paso.puntosClave.map((punto, idx) => (
                          <li key={idx} className="text-subtexto text-plataformaSecundario flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-plataformaAzul shrink-0"></span>
                            <span>{punto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      alNavegarPaso(paso);
                      alCerrar();
                    }}
                    className="boton-secundario text-xs shrink-0 self-end sm:self-center flex items-center gap-1.5 cursor-pointer hover:bg-plataformaAzul hover:text-white transition-colors"
                  >
                    <span>Ver este proceso</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-black/[0.02] border border-black/[0.06] rounded-lg-token">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-etiqueta font-semibold text-plataformaTexto">
                Resumen de Arquitectura y Base de Datos (Neon Cloud PostgreSQL)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-plataformaSecundario">
              <div className="p-2.5 bg-white rounded-md-token border border-black/[0.04]">
                <strong className="text-plataformaTexto block mb-0.5">19 Tablas Relacionales</strong>
                Modelado en 3FN con claves foráneas, restricciones de unicidad e índices.
              </div>
              <div className="p-2.5 bg-white rounded-md-token border border-black/[0.04]">
                <strong className="text-plataformaTexto block mb-0.5">Seguridad y Cifrado</strong>
                Contraseñas en bcrypt, tokens JWT con caducidad e integridad con OTP.
              </div>
              <div className="p-2.5 bg-white rounded-md-token border border-black/[0.04]">
                <strong className="text-plataformaTexto block mb-0.5">7 Unidades de Negocio</strong>
                Supermercados Peruanos, Promart, Oechsle, Real Plaza, Farmacias, SIP, Sucursal China.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
          <span className="text-subtexto text-plataformaSecundario">
            Retail Connect — Sistema Corporativo de Sostenibilidad Intercorp Retail
          </span>
          <button
            type="button"
            onClick={alCerrar}
            className="boton-primario text-xs cursor-pointer"
          >
            Cerrar protocolo
          </button>
        </div>
      </div>
    </div>
  );
}
