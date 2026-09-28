import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const { Client } = pkg;
const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const CLAVE_DEMO = 'Admin2026';

const unidades = [
  { codigo: 'SPSA', nombre: 'Supermercados Peruanos', gerente: 'Mariella Prado' },
  { codigo: 'PRO', nombre: 'Promart', gerente: 'Juan Carlos Vallejo' },
  { codigo: 'OEC', nombre: 'Oechsle', gerente: 'Edurne Benito' },
  { codigo: 'RPZ', nombre: 'Real Plaza', gerente: 'Misael Shimizu' },
  { codigo: 'FAR', nombre: 'Farmacias Peruanas', gerente: 'Marcelo Ramos' },
  { codigo: 'SIP', nombre: 'SIP', gerente: 'Trinidad Camarasa' },
  { codigo: 'IRC', nombre: 'Intercorp Retail Sucursal China', gerente: 'Directorio Asia' }
];

const industrias = [
  { codigo: 'AGR', nombre: 'Productos agrícolas', tipo: 'Productos (comerciales)' },
  { codigo: 'ALE', nombre: 'Alimentos envasados', tipo: 'Productos (comerciales)' },
  { codigo: 'TEX', nombre: 'Textil y confecciones', tipo: 'Productos (comerciales)' },
  { codigo: 'LOG', nombre: 'Transporte y almacén', tipo: 'Activos, servicios y suministros' },
  { codigo: 'SGE', nombre: 'Servicios generales', tipo: 'Activos, servicios y suministros' },
  { codigo: 'FAR', nombre: 'Farmacéutico', tipo: 'Productos (comerciales)' },
  { codigo: 'EE', nombre: 'Equipos y electrónica', tipo: 'Productos (comerciales)' },
  { codigo: 'ESS', nombre: 'Envases y suministros', tipo: 'Activos, servicios y suministros' }
];

const dimensiones = [
  { codigo: 'AMB', nombre: 'Ambiental', peso: 0.25 },
  { codigo: 'SOC', nombre: 'Social', peso: 0.20 },
  { codigo: 'ETI', nombre: 'Ética y Gobernanza', peso: 0.25 },
  { codigo: 'LAB', nombre: 'Laboral', peso: 0.20 },
  { codigo: 'CAD', nombre: 'Cadena de Suministro', peso: 0.10 }
];

const preguntas = [
  {
    codigo: 'AMB-01',
    enunciado: '¿La empresa cuenta con una política formalizada y documentada de gestión de residuos y reciclaje?',
    peso: 25.00,
    codigoDimension: 'AMB',
    alternativas: [
      { texto: 'Sí, formalizada, documentada y auditada anualmente por entidad externa', puntaje: 100.00 },
      { texto: 'Sí, formalizada e implementada pero sin auditoría externa', puntaje: 70.00 },
      { texto: 'En proceso de elaboración e implementación interna', puntaje: 40.00 },
      { texto: 'No cuenta con política formal de residuos', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'AMB-02',
    enunciado: '¿La empresa mide y reporta anualmente sus emisiones de gases de efecto invernadero (huella de carbono)?',
    peso: 25.00,
    codigoDimension: 'AMB',
    alternativas: [
      { texto: 'Sí, medición y certificación de Alcance 1, 2 y 3 bajo norma ISO 14064', puntaje: 100.00 },
      { texto: 'Sí, medición anual de Alcance 1 y 2 sin certificación externa', puntaje: 70.00 },
      { texto: 'En proceso de cálculo y línea base inicial', puntaje: 30.00 },
      { texto: 'No realiza medición ni reporte de emisiones de carbono', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'AMB-03',
    enunciado: '¿Cuenta con un programa formal de eficiencia energética o uso de energías renovables en sus instalaciones?',
    peso: 20.00,
    codigoDimension: 'AMB',
    alternativas: [
      { texto: 'Sí, con metas cuantitativas anuales e incorporación de paneles solares o fuentes limpias', puntaje: 100.00 },
      { texto: 'Sí, con plan de ahorro energético e iluminación LED integral', puntaje: 75.00 },
      { texto: 'Prácticas operativas aisladas sin medición de indicadores', puntaje: 40.00 },
      { texto: 'No cuenta con programa de eficiencia energética', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'SOC-01',
    enunciado: '¿Cuenta con un programa anual estructurado de desarrollo comunitario y apoyo a poblaciones vulnerables?',
    peso: 25.00,
    codigoDimension: 'SOC',
    alternativas: [
      { texto: 'Sí, con presupuesto asignado, convenios formales e indicadores de impacto social', puntaje: 100.00 },
      { texto: 'Sí, con actividades periódicas documentadas sin indicadores formales', puntaje: 65.00 },
      { texto: 'Participaciones y donaciones esporádicas no planificadas', puntaje: 35.00 },
      { texto: 'No cuenta con programas de vinculación comunitaria', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'SOC-02',
    enunciado: '¿Dispone de políticas y canales efectivos para la atención oportuna y resolución de reclamos de consumidores?',
    peso: 20.00,
    codigoDimension: 'SOC',
    alternativas: [
      { texto: 'Sí, libro de reclamaciones digital, protocolo estandarizado y SLA menor a 72 horas', puntaje: 100.00 },
      { texto: 'Sí, canal formal conforme al plazo legal establecido por Indecopi', puntaje: 75.00 },
      { texto: 'Canal básico de atención al cliente sin trazabilidad', puntaje: 40.00 },
      { texto: 'No cuenta con procedimiento estructurado de atención de quejas', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'ETI-15',
    enunciado: '¿La empresa cuenta con un canal formalizado de denuncias anónimas para faltas éticas, soborno o fraude?',
    peso: 25.00,
    codigoDimension: 'ETI',
    alternativas: [
      { texto: 'Sí, canal gestionado por un tercero independiente con garantía de confidencialidad absoluta', puntaje: 100.00 },
      { texto: 'Sí, canal interno formalizado y publicado ante todos los colaboradores', puntaje: 75.00 },
      { texto: 'Buzón físico o correo electrónico corporativo sin garantía de anonimato', puntaje: 30.00 },
      { texto: 'No dispone de canal de denuncias ni comité de ética', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'ETI-16',
    enunciado: '¿El canal de denuncias es administrado por una firma independiente que garantiza confidencialidad y no represalias?',
    peso: 15.00,
    codigoDimension: 'ETI',
    alternativas: [
      { texto: 'Sí, firma internacional especializada con certificación y protocolo de protección al informante', puntaje: 100.00 },
      { texto: 'Sí, estudio jurídico externo nacional', puntaje: 70.00 },
      { texto: 'Comité interno de cumplimiento corporativo', puntaje: 40.00 },
      { texto: 'No cuenta con administración externa especializada', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'ETI-17',
    enunciado: '¿Dispone de un Código de Conducta Ética y política anticorrupción difundidos y firmados por el personal?',
    peso: 20.00,
    codigoDimension: 'ETI',
    alternativas: [
      { texto: 'Sí, código formalizado, capacitaciones anuales obligatorias y adhesión firmada al 100%', puntaje: 100.00 },
      { texto: 'Sí, código entregado en la inducción de personal sin evaluaciones periódicas', puntaje: 70.00 },
      { texto: 'Manual de funciones básico con lineamientos generales de conducta', puntaje: 35.00 },
      { texto: 'No cuenta con código formal de ética', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'LAB-01',
    enunciado: '¿Todos los colaboradores se encuentran registrados en planilla electrónica conforme a la legislación laboral peruana?',
    peso: 25.00,
    codigoDimension: 'LAB',
    alternativas: [
      { texto: '100% formalizados en planilla electrónica con auditorías laborales periódicas sin contingencias', puntaje: 100.00 },
      { texto: '100% formalizados en planilla sin auditorías periódicas de cumplimiento', puntaje: 80.00 },
      { texto: 'Mayoría en planilla con personal bajo esquemas de regularización', puntaje: 40.00 },
      { texto: 'No se tiene registro formal unificado de la nómina laboral', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'LAB-02',
    enunciado: '¿Cuenta con un Comité de Seguridad y Salud en el Trabajo (CSST) activo y plan anual de capacitaciones preventivas?',
    peso: 20.00,
    codigoDimension: 'LAB',
    alternativas: [
      { texto: 'Sí, comité paritario formalmente instalado, plan anual de SST auditado y matriz IPERC actualizada', puntaje: 100.00 },
      { texto: 'Sí, supervisor o comité activo con cumplimiento normativo básico de capacitaciones', puntaje: 75.00 },
      { texto: 'Medidas de seguridad física sin comité formalizado ni capacitaciones periódicas', puntaje: 35.00 },
      { texto: 'No dispone de sistema de gestión de seguridad y salud laboral', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'CAD-01',
    enunciado: '¿La empresa evalúa periódicamente criterios de sostenibilidad y cumplimiento legal en sus propios proveedores?',
    peso: 25.00,
    codigoDimension: 'CAD',
    alternativas: [
      { texto: 'Sí, programa formal de homologación y auditoría a proveedores críticos con cláusulas contractuales ESG', puntaje: 100.00 },
      { texto: 'Sí, declaración jurada de cumplimiento legal y laboral previa a la contratación', puntaje: 70.00 },
      { texto: 'Evaluaciones exclusivamente basadas en costo y tiempo de entrega', puntaje: 35.00 },
      { texto: 'No realiza seguimiento a las prácticas de su cadena de proveedores', puntaje: 0.00 }
    ]
  },
  {
    codigo: 'CAD-02',
    enunciado: '¿Mantiene un sistema de trazabilidad sobre el origen de materias primas o insumos estratégicos para prevenir deforestación o trabajo infantil?',
    peso: 20.00,
    codigoDimension: 'CAD',
    alternativas: [
      { texto: 'Sí, trazabilidad completa con certificaciones de origen sostenible (FSC, Rainforest, Fair Trade u homólogos)', puntaje: 100.00 },
      { texto: 'Sí, registros de procedencia y fichas técnicas validadas de los fabricantes', puntaje: 75.00 },
      { texto: 'Trazabilidad limitada únicamente a órdenes de compra y facturación', puntaje: 40.00 },
      { texto: 'No cuenta con trazabilidad sobre la cadena de abastecimiento', puntaje: 0.00 }
    ]
  }
];

const usuariosEquipo = [
  { correo: 'admin@intercorpretail.pe', nombre: 'Leonardo Raul Solano Pio Huaman', rol: 'Administrador Corporativo', codigoUnidad: null },
  { correo: 'lsolano@intercorpretail.pe', nombre: 'Leonardo Raul Solano Pio Huaman', rol: 'Administrador Corporativo', codigoUnidad: null },
  { correo: 'ccoronel@intercorpretail.pe', nombre: 'Carloman Coronel Cruz', rol: 'Gerente de Unidad de Negocio', codigoUnidad: 'SPSA' },
  { correo: 'cchiroque@intercorpretail.pe', nombre: 'Carlos Juniors Chiroque Silva', rol: 'Analista de Unidad de Negocio', codigoUnidad: 'PRO' },
  { correo: 'fbeltran@intercorpretail.pe', nombre: 'Frank Alex Beltran Ponce', rol: 'Gerente de Unidad de Negocio', codigoUnidad: 'OEC' },
  { correo: 'gnavarro@intercorpretail.pe', nombre: 'Gianfranco Daniel Navarro Flores', rol: 'Consulta', codigoUnidad: 'RPZ' },
  { correo: 'mprado@intercorpretail.pe', nombre: 'Mariella Prado', rol: 'Administrador Corporativo', codigoUnidad: 'SPSA' }
];

const campaniasMaestras = [
  { nombre: 'Evaluación de Sostenibilidad 2026-I', periodo: '2026-I', estado: 'Publicada' },
  { nombre: 'Homologación de Proveedores Críticos 2026', periodo: '2026-II', estado: 'Publicada' },
  { nombre: 'Campaña Anual de Sostenibilidad 2025', periodo: '2025-II', estado: 'Cerrada' }
];

const padronProveedores = [
  {
    ruc: '20999888771',
    razonSocial: 'Prueba Movil QA SAC',
    nombreComercial: 'Móvil QA Soluciones Perú',
    direccionFiscal: 'Av. Paseo de la República 3220, San Isidro',
    departamento: 'Lima',
    representante: 'Representante QA',
    cargoRepresentante: 'Gerente de Aseguramiento de Calidad',
    telefono: '+51 1 4229000',
    correo: 'qa-mobile-view@test.com',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '8 años',
    sitioWeb: 'https://www.movilqa.pe',
    esCritico: true,
    codigoIndustria: 'AGR',
    unidades: [
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 85, social: 80, etica: 88, laboral: 84, cadena: 78 }
  },
  {
    ruc: '20111222331',
    razonSocial: 'Fase5B Test SAC',
    nombreComercial: 'Fase 5B Logística y Almacenes',
    direccionFiscal: 'Av. Elmer Faucett 2880, Callao',
    departamento: 'Callao',
    representante: 'Carlos Espinoza Hurtado',
    cargoRepresentante: 'Gerente Comercial',
    telefono: '+51 1 5751200',
    correo: 'contacto@fase5b.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'MYPE',
    aniosOperacion: '6 años',
    sitioWeb: 'https://www.fase5b.pe',
    esCritico: false,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 78, social: 75, etica: 82, laboral: 80, cadena: 74 }
  },
  {
    ruc: '20111222332',
    razonSocial: 'Fase5C Test SAC',
    nombreComercial: 'Fase 5C Servicios Especializados',
    direccionFiscal: 'Jr. Carabaya 550, Cercado de Lima',
    departamento: 'Lima',
    representante: 'Lucía Benavides Prado',
    cargoRepresentante: 'Directora de Cumplimiento',
    telefono: '+51 1 4283400',
    correo: 'contacto@fase5c.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '9 años',
    sitioWeb: 'https://www.fase5c.pe',
    esCritico: false,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 80, social: 82, etica: 85, laboral: 81, cadena: 76 }
  },
  {
    ruc: '20111222333',
    razonSocial: 'Fase5D Test SAC',
    nombreComercial: 'Fase 5D Distribución Integral',
    direccionFiscal: 'Av. Nicolás Arriola 1420, La Victoria',
    departamento: 'Lima',
    representante: 'Martín Barrenechea Soto',
    cargoRepresentante: 'Gerente de Abastecimiento',
    telefono: '+51 1 3248890',
    correo: 'contacto@fase5d.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '14 años',
    sitioWeb: 'https://www.fase5d.pe',
    esCritico: false,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 84, social: 86, etica: 88, laboral: 85, cadena: 80 }
  },
  {
    ruc: '20111222334',
    razonSocial: 'Fase5E Test SAC',
    nombreComercial: 'Fase 5E Operaciones y Empaques',
    direccionFiscal: 'Av. Separadora Industrial 2100, Ate',
    departamento: 'Lima',
    representante: 'Patricia Zevallos Ramos',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 3495500',
    correo: 'contacto@fase5e.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '11 años',
    sitioWeb: 'https://www.fase5e.pe',
    esCritico: false,
    codigoIndustria: 'ESS',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 82, social: 84, etica: 86, laboral: 83, cadena: 79 }
  },
  {
    ruc: '20999888990',
    razonSocial: 'Prueba QA Duplicados S.A.C.',
    nombreComercial: 'Duplicados QA Consultores',
    direccionFiscal: 'Av. Los Próceres 650, Surco',
    departamento: 'Lima',
    representante: 'Fernando Alarcón Tello',
    cargoRepresentante: 'Jefe de Operaciones',
    telefono: '+51 1 2714455',
    correo: 'qa-duplicados@test.com',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '7 años',
    sitioWeb: 'https://www.qaduplicados.pe',
    esCritico: false,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 79, social: 81, etica: 84, laboral: 80, cadena: 77 }
  },
  {
    ruc: '20999888772',
    razonSocial: 'Prueba Desktop QA SAC',
    nombreComercial: 'Desktop QA Soluciones Tecnológicas',
    direccionFiscal: 'Calle Las Camelias 790, San Isidro',
    departamento: 'Lima',
    representante: 'Claudia Mendoza Pollarolo',
    cargoRepresentante: 'Directora de TI y Calidad',
    telefono: '+51 1 4402233',
    correo: 'qa-desktop@test.com',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '12 años',
    sitioWeb: 'https://www.desktopqa.pe',
    esCritico: false,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 87, social: 89, etica: 92, laboral: 88, cadena: 83 }
  },
  {
    ruc: '20999888773',
    razonSocial: 'Prueba Reglas QA SAC',
    nombreComercial: 'Reglas QA Consultoría Integral',
    direccionFiscal: 'Av. Rivera Navarrete 501, San Isidro',
    departamento: 'Lima',
    representante: 'Gonzalo Silva Valdivia',
    cargoRepresentante: 'Gerente de Auditoría Corporativa',
    telefono: '+51 1 4428899',
    correo: 'qa-reglas@test.com',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '10 años',
    sitioWeb: 'https://www.reglasqa.pe',
    esCritico: false,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 83, social: 85, etica: 89, laboral: 84, cadena: 81 }
  },
  {
    ruc: '20100070970',
    razonSocial: 'Alicorp S.A.A.',
    nombreComercial: 'Alicorp',
    direccionFiscal: 'Av. Argentina 4793, Carmen de la Legua Reynoso',
    departamento: 'Callao',
    representante: 'Manuel Romero Caro',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 3150800',
    correo: 'sostenibilidad@alicorp.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '68 años',
    sitioWeb: 'https://www.alicorp.com.pe',
    esCritico: true,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: true },
      { codigo: 'SIP', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 88, social: 92, etica: 95, laboral: 90, cadena: 85 }
  },
  {
    ruc: '20100119227',
    razonSocial: 'Gloria S.A.',
    nombreComercial: 'Leche Gloria',
    direccionFiscal: 'Av. República de Panamá 2461, Santa Catalina',
    departamento: 'Lima',
    representante: 'Claudio Rodríguez Huaco',
    cargoRepresentante: 'Director Ejecutivo',
    telefono: '+51 1 4707170',
    correo: 'proveedores@gloria.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '82 años',
    sitioWeb: 'https://www.gloria.com.pe',
    esCritico: true,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: true },
      { codigo: 'SIP', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 84, social: 86, etica: 90, laboral: 85, cadena: 80 }
  },
  {
    ruc: '20100154308',
    razonSocial: 'San Fernando S.A.',
    nombreComercial: 'San Fernando',
    direccionFiscal: 'Av. República de Panamá 4295, Surquillo',
    departamento: 'Lima',
    representante: 'Alberto Ikeda Matsukawa',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 2135300',
    correo: 'contacto@san-fernando.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '76 años',
    sitioWeb: 'https://www.san-fernando.com.pe',
    esCritico: true,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 82, social: 88, etica: 86, laboral: 88, cadena: 82 }
  },
  {
    ruc: '20512345678',
    razonSocial: 'Distribuidora Alimentos del Norte S.A.C.',
    nombreComercial: 'Alimentos del Norte',
    direccionFiscal: 'Av. Túpac Amaru 1420, Comas',
    departamento: 'Lima',
    representante: 'Carlos Mendoza Alva',
    cargoRepresentante: 'Gerente Comercial',
    telefono: '+51 984512345',
    correo: 'contacto@proveedor.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '11 años',
    sitioWeb: 'https://www.alimentosdelnorte.pe',
    esCritico: false,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 62, social: 68, etica: 70, laboral: 65, cadena: 60 }
  },
  {
    ruc: '20100035126',
    razonSocial: 'Molitalia S.A.',
    nombreComercial: 'Molitalia',
    direccionFiscal: 'Av. Venezuela 2850, Cercado de Lima',
    departamento: 'Lima',
    representante: 'Luca Balbo',
    cargoRepresentante: 'Director General',
    telefono: '+51 1 5133600',
    correo: 'atencionproveedores@molitalia.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '62 años',
    sitioWeb: 'https://www.molitalia.com.pe',
    esCritico: true,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 86, social: 84, etica: 92, laboral: 88, cadena: 80 }
  },
  {
    ruc: '20382918231',
    razonSocial: 'Braedt S.A.',
    nombreComercial: 'Otto Kunz',
    direccionFiscal: 'Av. Los Frutales 419, Ate',
    departamento: 'Lima',
    representante: 'Walter Kunz Braedt',
    cargoRepresentante: 'Gerente de Operaciones',
    telefono: '+51 1 3480808',
    correo: 'calidad@braedt.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '70 años',
    sitioWeb: 'https://www.ottokunz.pe',
    esCritico: true,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 80, social: 82, etica: 85, laboral: 82, cadena: 78 }
  },
  {
    ruc: '20293847561',
    razonSocial: 'Agrícola Don Ricardo S.A.C.',
    nombreComercial: 'Don Ricardo',
    direccionFiscal: 'Fundo El Pedregal Km 298 Panamericana Sur',
    departamento: 'Ica',
    representante: 'Ricardo Briceño Villena',
    cargoRepresentante: 'Presidente de Directorio',
    telefono: '+51 56 402010',
    correo: 'exportaciones@donricardo.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '28 años',
    sitioWeb: 'https://www.donricardo.com.pe',
    esCritico: false,
    codigoIndustria: 'AGR',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 90, social: 85, etica: 88, laboral: 92, cadena: 84 }
  },
  {
    ruc: '20601928374',
    razonSocial: 'Lácteos y Derivados Andinos E.I.R.L.',
    nombreComercial: 'Lácteos Cajamarca',
    direccionFiscal: 'Jr. Comercio 340, Baños del Inca',
    departamento: 'Cajamarca',
    representante: 'Segundo Huamán Quispe',
    cargoRepresentante: 'Gerente Propietario',
    telefono: '+51 976543210',
    correo: 'lacteosandinos@cajamarca.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'MYPE',
    aniosOperacion: '7 años',
    sitioWeb: 'https://www.lacteosandinos.pe',
    esCritico: false,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 55, social: 60, etica: 58, laboral: 62, cadena: 50 }
  },
  {
    ruc: '20492817462',
    razonSocial: 'Procesadora Agroindustrial del Norte S.A.C.',
    nombreComercial: 'AgroNorte',
    direccionFiscal: 'Av. Industrial 890, Zona Industrial',
    departamento: 'Piura',
    representante: 'Luis Farfán Seminario',
    cargoRepresentante: 'Gerente de Planta',
    telefono: '+51 73 345678',
    correo: 'contacto@agronorte.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '14 años',
    sitioWeb: 'https://www.agronorte.com.pe',
    esCritico: false,
    codigoIndustria: 'AGR',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 72, social: 70, etica: 75, laboral: 70, cadena: 65 }
  },
  {
    ruc: '20100183928',
    razonSocial: 'Compañía Panificadora San Jorge S.A.',
    nombreComercial: 'Galletas San Jorge',
    direccionFiscal: 'Av. Los Ciruelos 450, San Juan de Lurigancho',
    departamento: 'Lima',
    representante: 'Jorge Alva Rodríguez',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 3871200',
    correo: 'comercial@sanjorge.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '75 años',
    sitioWeb: 'https://www.sanjorge.com.pe',
    esCritico: false,
    codigoIndustria: 'ALE',
    unidades: [
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 76, social: 78, etica: 82, laboral: 80, cadena: 74 }
  },
  {
    ruc: '20254053822',
    razonSocial: 'Corporación Aceros Arequipa S.A.',
    nombreComercial: 'Aceros Arequipa',
    direccionFiscal: 'Av. Enrique Meiggs 297, Parque Industrial',
    departamento: 'Arequipa',
    representante: 'Ricardo Cillóniz Champin',
    cargoRepresentante: 'Presidente Ejecutivo',
    telefono: '+51 54 232434',
    correo: 'sostenibilidad@acerosarequipa.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '60 años',
    sitioWeb: 'https://www.acerosarequipa.com',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 92, social: 90, etica: 96, laboral: 94, cadena: 88 }
  },
  {
    ruc: '20452398411',
    razonSocial: 'Cementos Pacasmayo S.A.A.',
    nombreComercial: 'Pacasmayo',
    direccionFiscal: 'Calle La Colonia 180, El Vivero',
    departamento: 'Lima',
    representante: 'Humberto Nadal del Carpio',
    cargoRepresentante: 'CEO y Gerente General',
    telefono: '+51 1 3176000',
    correo: 'proveedor@pacasmayo.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '67 años',
    sitioWeb: 'https://www.cementospacasmayo.com.pe',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 94, social: 92, etica: 94, laboral: 92, cadena: 89 }
  },
  {
    ruc: '20100057014',
    razonSocial: 'Unión Andina de Cementos S.A.A. (UNACEM)',
    nombreComercial: 'UNACEM',
    direccionFiscal: 'Carretera Atocongo Km 11, Villa María del Triunfo',
    departamento: 'Lima',
    representante: 'Pedro Lerner Rizo Patrón',
    cargoRepresentante: 'Director Corporativo',
    telefono: '+51 1 2170200',
    correo: 'sostenibilidad@unacem.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '108 años',
    sitioWeb: 'https://www.unacem.com.pe',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 91, social: 89, etica: 93, laboral: 91, cadena: 86 }
  },
  {
    ruc: '20100021338',
    razonSocial: 'Fábrica Peruana Eternit S.A.',
    nombreComercial: 'Eternit',
    direccionFiscal: 'Av. República de Panamá 3591, San Isidro',
    departamento: 'Lima',
    representante: 'Álvaro Echeverría Gómez',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 6196200',
    correo: 'proveedores@eternit.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '84 años',
    sitioWeb: 'https://www.eternit.com.pe',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 85, social: 84, etica: 88, laboral: 86, cadena: 81 }
  },
  {
    ruc: '20268291024',
    razonSocial: 'Pinturas Anypsa S.A.',
    nombreComercial: 'Anypsa',
    direccionFiscal: 'Autopista Trapiche Chillón Mz A Lote 3, Carabayllo',
    departamento: 'Lima',
    representante: 'Nemesio Torvisco Medina',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 6139090',
    correo: 'atencioncliente@anypsa.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '33 años',
    sitioWeb: 'https://www.anypsa.com.pe',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 78, social: 80, etica: 84, laboral: 82, cadena: 75 }
  },
  {
    ruc: '20549281723',
    razonSocial: 'Maderera y Carpintería Los Robles del Oriente S.A.C.',
    nombreComercial: 'Maderas Los Robles',
    direccionFiscal: 'Av. Centenario Km 5.5, Coronel Portillo',
    departamento: 'Ucayali',
    representante: 'Víctor Panduro Rengifo',
    cargoRepresentante: 'Gerente de Operaciones',
    telefono: '+51 61 571234',
    correo: 'roblesoriente@ucayali.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '16 años',
    sitioWeb: 'https://www.losroblesmadera.pe',
    esCritico: false,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 68, social: 70, etica: 65, laboral: 72, cadena: 64 }
  },
  {
    ruc: '20334455661',
    razonSocial: 'Cerámica San Lorenzo S.A.C.',
    nombreComercial: 'San Lorenzo',
    direccionFiscal: 'Av. Manuel Valle Mz C Lote 3, Lurín',
    departamento: 'Lima',
    representante: 'Javier Martinelli Silva',
    cargoRepresentante: 'Director Comercial',
    telefono: '+51 1 6140400',
    correo: 'sanlorenzo@ceramica.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '28 años',
    sitioWeb: 'https://www.sanlorenzo.com.pe',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 83, social: 81, etica: 87, laboral: 85, cadena: 79 }
  },
  {
    ruc: '20603847291',
    razonSocial: 'Importadora Técnica de Herramientas Eléctricas E.I.R.L.',
    nombreComercial: 'TecnoHerramientas',
    direccionFiscal: 'Av. Guillermo Dansey 420, Cercado de Lima',
    departamento: 'Lima',
    representante: 'Raúl Huamani Pérez',
    cargoRepresentante: 'Gerente Titular',
    telefono: '+51 998765432',
    correo: 'ventas@tecnoherramientas.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'MYPE',
    aniosOperacion: '6 años',
    sitioWeb: 'https://www.tecnoherramientas.pe',
    esCritico: false,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'PRO', esCritico: false }
    ],
    evaluacion2026: { estado: 'Pendiente', ambiental: null, social: null, etica: null, laboral: null, cadena: null }
  },
  {
    ruc: '20338574921',
    razonSocial: 'Textiles Camones S.A.',
    nombreComercial: 'Camones',
    direccionFiscal: 'Av. Santa Josefina 527, Puente Piedra',
    departamento: 'Lima',
    representante: 'Carlos Camones Sánchez',
    cargoRepresentante: 'Presidente Ejecutivo',
    telefono: '+51 1 6146400',
    correo: 'ventas@camones.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '31 años',
    sitioWeb: 'https://www.textilescamones.com',
    esCritico: true,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 89, social: 87, etica: 92, laboral: 93, cadena: 84 }
  },
  {
    ruc: '20100928371',
    razonSocial: 'Confecciones Textimax S.A.',
    nombreComercial: 'Textimax',
    direccionFiscal: 'Av. Separadora Industrial 2073, Ate',
    departamento: 'Lima',
    representante: 'John Carty Silva',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 3260020',
    correo: 'contacto@textimax.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '36 años',
    sitioWeb: 'https://www.textimax.com.pe',
    esCritico: true,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 86, social: 85, etica: 89, laboral: 90, cadena: 82 }
  },
  {
    ruc: '20601248593',
    razonSocial: 'Confecciones Andinas del Sur E.I.R.L.',
    nombreComercial: 'Andina Sur',
    direccionFiscal: 'Calle San Agustín 124, Cercado',
    departamento: 'Arequipa',
    representante: 'María Luisa Quispe',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 54 283910',
    correo: 'informes@andinasur.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'MYPE',
    aniosOperacion: '8 años',
    sitioWeb: 'https://www.andinasur.pe',
    esCritico: false,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 58, social: 62, etica: 65, laboral: 68, cadena: 52 }
  },
  {
    ruc: '20581928374',
    razonSocial: 'Calzados y Cueros El Sol del Perú S.A.C.',
    nombreComercial: 'Calzados El Sol',
    direccionFiscal: 'Av. Mansiche 1560, Trujillo',
    departamento: 'La Libertad',
    representante: 'Fernando Trujillo Salcedo',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 44 293847',
    correo: 'gerencia@calzadoselsol.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '19 años',
    sitioWeb: 'https://www.calzadoselsol.pe',
    esCritico: true,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 74, social: 75, etica: 78, laboral: 80, cadena: 70 }
  },
  {
    ruc: '20491827361',
    razonSocial: 'Hilanderías de Exportación del Valle S.A.C.',
    nombreComercial: 'Hilados del Valle',
    direccionFiscal: 'Parque Industrial Mz G Lote 4, Lurín',
    departamento: 'Lima',
    representante: 'Guillermo Paz Soldán',
    cargoRepresentante: 'Gerente de Planta',
    telefono: '+51 1 2958473',
    correo: 'hiladosvalle@export.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '15 años',
    sitioWeb: 'https://www.hiladosdelvalle.pe',
    esCritico: false,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: false }
    ],
    evaluacion2026: { estado: 'Pendiente', ambiental: null, social: null, etica: null, laboral: null, cadena: null }
  },
  {
    ruc: '20602938471',
    razonSocial: 'Diseño y Confecciones Moda Urbana S.A.',
    nombreComercial: 'Moda Urbana',
    direccionFiscal: 'Jr. Gamarra 820 Oficina 502, La Victoria',
    departamento: 'Lima',
    representante: 'Patricia Benavides Wong',
    cargoRepresentante: 'Directora Creativa',
    telefono: '+51 1 4749281',
    correo: 'corporativo@modaurbana.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '10 años',
    sitioWeb: 'https://www.modaurbana.pe',
    esCritico: false,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'OEC', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 65, social: 70, etica: 72, laboral: 74, cadena: 61 }
  },
  {
    ruc: '20556677889',
    razonSocial: 'Soluciones Integrales de Mantenimiento y Propiedades S.A. (SIMSA)',
    nombreComercial: 'SIMSA Facility Management',
    direccionFiscal: 'Av. Las Begonias 441 Piso 12, San Isidro',
    departamento: 'Lima',
    representante: 'Fernando Carrillo Otero',
    cargoRepresentante: 'Gerente de Operaciones',
    telefono: '+51 1 6118800',
    correo: 'operaciones@simsacorp.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '22 años',
    sitioWeb: 'https://www.simsacorp.pe',
    esCritico: true,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'RPZ', esCritico: true },
      { codigo: 'SIP', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 84, social: 86, etica: 91, laboral: 89, cadena: 80 }
  },
  {
    ruc: '20392817462',
    razonSocial: 'Seguridad y Vigilancia Huascarán S.A.C.',
    nombreComercial: 'Seguridad Huascarán',
    direccionFiscal: 'Av. Primavera 1280, Surco',
    departamento: 'Lima',
    representante: 'Carlos Bazán Alarcón',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 3721020',
    correo: 'institucional@seguridadhuascaran.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '24 años',
    sitioWeb: 'https://www.seguridadhuascaran.pe',
    esCritico: true,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'RPZ', esCritico: true },
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 76, social: 82, etica: 88, laboral: 91, cadena: 75 }
  },
  {
    ruc: '20481927364',
    razonSocial: 'Limpieza y Saneamiento Ambiental Ecolimpio S.A.C.',
    nombreComercial: 'Ecolimpio Perú',
    direccionFiscal: 'Av. Elmer Faucett 1890, Callao',
    departamento: 'Callao',
    representante: 'Rosa Elvira Salazar',
    cargoRepresentante: 'Gerente de Servicios',
    telefono: '+51 1 5748392',
    correo: 'ecolimpio@servicios.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '13 años',
    sitioWeb: 'https://www.ecolimpioperu.pe',
    esCritico: true,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'RPZ', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 88, social: 80, etica: 84, laboral: 86, cadena: 78 }
  },
  {
    ruc: '20501928371',
    razonSocial: 'Climatización y Refrigeración Central S.A.C.',
    nombreComercial: 'ClimaCentral',
    direccionFiscal: 'Av. Maquinarias 2140, Lima',
    departamento: 'Lima',
    representante: 'Jorge Portocarrero Ramos',
    cargoRepresentante: 'Director Técnico',
    telefono: '+51 1 5612345',
    correo: 'proyectos@climacentral.com.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '17 años',
    sitioWeb: 'https://www.climacentral.pe',
    esCritico: false,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'RPZ', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 75, social: 72, etica: 76, laboral: 78, cadena: 70 }
  },
  {
    ruc: '20604819283',
    razonSocial: 'Servicios Eléctricos y Redes Estructuradas E.I.R.L.',
    nombreComercial: 'ElectroRedes',
    direccionFiscal: 'Jr. Carabaya 650 Oficina 301, Lima',
    departamento: 'Lima',
    representante: 'Manuel Chumpitaz Lara',
    cargoRepresentante: 'Gerente Técnico',
    telefono: '+51 981234567',
    correo: 'contacto@electroredes.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'MYPE',
    aniosOperacion: '5 años',
    sitioWeb: 'https://www.electroredes.pe',
    esCritico: false,
    codigoIndustria: 'SGE',
    unidades: [
      { codigo: 'RPZ', esCritico: false }
    ],
    evaluacion2026: { estado: 'Pendiente', ambiental: null, social: null, etica: null, laboral: null, cadena: null }
  },
  {
    ruc: '20100142806',
    razonSocial: 'Laboratorios Farmindustria S.A.',
    nombreComercial: 'Farmindustria',
    direccionFiscal: 'Calle Manuel Arispe 835, Callao',
    departamento: 'Callao',
    representante: 'Jorge Arévalo Silva',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 6140500',
    correo: 'corporativo@farmindustria.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '54 años',
    sitioWeb: 'https://www.farmindustria.com.pe',
    esCritico: true,
    codigoIndustria: 'FAR',
    unidades: [
      { codigo: 'FAR', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 93, social: 91, etica: 95, laboral: 92, cadena: 87 }
  },
  {
    ruc: '20100067168',
    razonSocial: 'Laboratorios Medifarma S.A.',
    nombreComercial: 'Medifarma',
    direccionFiscal: 'Jr. Ecuador 787, Lima',
    departamento: 'Lima',
    representante: 'Carlos Tamayo Morales',
    cargoRepresentante: 'Director Corporativo',
    telefono: '+51 1 3303400',
    correo: 'contacto@medifarma.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '58 años',
    sitioWeb: 'https://www.medifarma.com.pe',
    esCritico: true,
    codigoIndustria: 'FAR',
    unidades: [
      { codigo: 'FAR', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 91, social: 89, etica: 94, laboral: 93, cadena: 85 }
  },
  {
    ruc: '20100174920',
    razonSocial: 'Laboratorios Bagó del Perú S.A.',
    nombreComercial: 'Bagó',
    direccionFiscal: 'Av. Jorge Chávez 154 Piso 4, Miraflores',
    departamento: 'Lima',
    representante: 'Armando Rodríguez Moreno',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 6112222',
    correo: 'sostenibilidad@bago.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '45 años',
    sitioWeb: 'https://www.bago.com.pe',
    esCritico: true,
    codigoIndustria: 'FAR',
    unidades: [
      { codigo: 'FAR', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 90, social: 93, etica: 96, laboral: 91, cadena: 89 }
  },
  {
    ruc: '20491823741',
    razonSocial: 'Droguería Médica del Pacífico S.A.C.',
    nombreComercial: 'MedPacc',
    direccionFiscal: 'Av. Los Próceres 340, Surco',
    departamento: 'Lima',
    representante: 'Elena Villacorta Peña',
    cargoRepresentante: 'Directora Comercial',
    telefono: '+51 1 4482910',
    correo: 'contacto@medpacc.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '12 años',
    sitioWeb: 'https://www.medpacc.pe',
    esCritico: false,
    codigoIndustria: 'FAR',
    unidades: [
      { codigo: 'FAR', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 68, social: 72, etica: 75, laboral: 76, cadena: 66 }
  },
  {
    ruc: '20252899881',
    razonSocial: 'Kimberly-Clark Perú S.R.L.',
    nombreComercial: 'Kimberly-Clark',
    direccionFiscal: 'Av. Canaval y Moreyra 480 Piso 9, San Isidro',
    departamento: 'Lima',
    representante: 'Ana María Orozco Castro',
    cargoRepresentante: 'Country Manager',
    telefono: '+51 1 6158000',
    correo: 'proveedores@kcc.com',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '30 años',
    sitioWeb: 'https://www.kimberly-clark.com/es-pe',
    esCritico: true,
    codigoIndustria: 'ESS',
    unidades: [
      { codigo: 'FAR', esCritico: true },
      { codigo: 'SPSA', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 96, social: 94, etica: 98, laboral: 95, cadena: 92 }
  },
  {
    ruc: '20592817463',
    razonSocial: 'Cosmética y Cuidado Personal del Perú S.A.C.',
    nombreComercial: 'BioCosmética',
    direccionFiscal: 'Av. Aviación 3210, San Borja',
    departamento: 'Lima',
    representante: 'Marcela Thorne Bellido',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 2259102',
    correo: 'informes@biocosmetica.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '9 años',
    sitioWeb: 'https://www.biocosmetica.pe',
    esCritico: false,
    codigoIndustria: 'FAR',
    unidades: [
      { codigo: 'FAR', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 74, social: 70, etica: 72, laboral: 75, cadena: 68 }
  },
  {
    ruc: '20509823417',
    razonSocial: 'Operador Logístico Ransa Comercial S.A.',
    nombreComercial: 'Ransa',
    direccionFiscal: 'Av. Ferrocarril 389, Callao',
    departamento: 'Callao',
    representante: 'Tomás Moro Belmont',
    cargoRepresentante: 'Gerente Central de Operaciones',
    telefono: '+51 1 3136000',
    correo: 'atencion@ransa.net',
    tipo: 'No retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '85 años',
    sitioWeb: 'https://www.ransa.net',
    esCritico: true,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'SIP', esCritico: true },
      { codigo: 'SPSA', esCritico: true },
      { codigo: 'PRO', esCritico: true },
      { codigo: 'OEC', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 95, social: 94, etica: 96, laboral: 95, cadena: 91 }
  },
  {
    ruc: '20391827461',
    razonSocial: 'Transportes y Logística Cruz del Altiplano S.A.C.',
    nombreComercial: 'TransAltiplano',
    direccionFiscal: 'Av. Néstor Gambetta Km 7.5, Callao',
    departamento: 'Callao',
    representante: 'Eduardo Cruz Pari',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 5772819',
    correo: 'operaciones@transaltiplano.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '20 años',
    sitioWeb: 'https://www.transaltiplano.pe',
    esCritico: true,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'SIP', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 79, social: 83, etica: 85, laboral: 88, cadena: 76 }
  },
  {
    ruc: '20100089212',
    razonSocial: 'Trupal S.A.',
    nombreComercial: 'Trupal Embalajes',
    direccionFiscal: 'Av. Libertadores 155, Trujillo',
    departamento: 'La Libertad',
    representante: 'Manuel Rodríguez Huaco',
    cargoRepresentante: 'Gerente Corporativo',
    telefono: '+51 44 484800',
    correo: 'ventas@trupal.com.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '55 años',
    sitioWeb: 'https://www.trupal.com.pe',
    esCritico: true,
    codigoIndustria: 'ESS',
    unidades: [
      { codigo: 'SIP', esCritico: true },
      { codigo: 'SPSA', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 91, social: 88, etica: 92, laboral: 89, cadena: 84 }
  },
  {
    ruc: '20482910293',
    razonSocial: 'Plásticos y Embalajes Industriales del Perú S.A.',
    nombreComercial: 'PlastiPerú',
    direccionFiscal: 'Calle Los Hornos 240, Urbanización Vulcano, Ate',
    departamento: 'Lima',
    representante: 'Guillermo Chang Lau',
    cargoRepresentante: 'Gerente de Planta',
    telefono: '+51 1 3492810',
    correo: 'comercial@plastiperu.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '18 años',
    sitioWeb: 'https://www.plastiperu.pe',
    esCritico: false,
    codigoIndustria: 'ESS',
    unidades: [
      { codigo: 'SIP', esCritico: false }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 69, social: 74, etica: 76, laboral: 78, cadena: 65 }
  },
  {
    ruc: '20606918273',
    razonSocial: 'Pallets y Soluciones Logísticas de Madera S.A.C.',
    nombreComercial: 'LogistiPallets',
    direccionFiscal: 'Antigua Panamericana Sur Km 38.5, Lurín',
    departamento: 'Lima',
    representante: 'Oscar Medina Bravo',
    cargoRepresentante: 'Gerente General',
    telefono: '+51 1 2948192',
    correo: 'ventas@logistipallets.pe',
    tipo: 'No retail',
    tamanoEmpresa: 'PYME',
    aniosOperacion: '7 años',
    sitioWeb: 'https://www.logistipallets.pe',
    esCritico: false,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'SIP', esCritico: false }
    ],
    evaluacion2026: { estado: 'Pendiente', ambiental: null, social: null, etica: null, laboral: null, cadena: null }
  },
  {
    ruc: '20609988771',
    razonSocial: 'Shanghai Global Sourcing Retail Ltd.',
    nombreComercial: 'Shanghai Sourcing',
    direccionFiscal: 'Pudong New Area Century Avenue 100, Shanghai',
    departamento: 'Shanghai',
    representante: 'Wei Zhang Lin',
    cargoRepresentante: 'Managing Director',
    telefono: '+86 21 6888 1234',
    correo: 'asia-support@intercorpretail.pe',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '14 años',
    sitioWeb: 'https://www.shanghaiglobalsourcing.com',
    esCritico: true,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'IRC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 88, social: 86, etica: 92, laboral: 89, cadena: 94 }
  },
  {
    ruc: '20609988772',
    razonSocial: 'Ningbo Dragon Pacific Supply Chain Co. Ltd.',
    nombreComercial: 'Dragon Pacific Logistics',
    direccionFiscal: 'Baoguan Building 888 Baoguan Road, Ningbo Port',
    departamento: 'Zhejiang',
    representante: 'Chen Xiao Ming',
    cargoRepresentante: 'VP International Trade',
    telefono: '+86 574 8765 4321',
    correo: 'ningbo.trade@dragonpacific.cn',
    tipo: 'No retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '18 años',
    sitioWeb: 'https://www.dragonpacific.cn',
    esCritico: true,
    codigoIndustria: 'LOG',
    unidades: [
      { codigo: 'IRC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 85, social: 84, etica: 90, laboral: 87, cadena: 90 }
  },
  {
    ruc: '20609988773',
    razonSocial: 'Shenzhen Digital Display Components Ltd.',
    nombreComercial: 'Shenzhen Electronics',
    direccionFiscal: 'Futian District Shennan Road 6009, Shenzhen',
    departamento: 'Guangdong',
    representante: 'Li Jun Hua',
    cargoRepresentante: 'Export Director',
    telefono: '+86 755 8321 9876',
    correo: 'export@shenzhendigital.com',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '12 años',
    sitioWeb: 'https://www.shenzhendigital.com',
    esCritico: false,
    codigoIndustria: 'EE',
    unidades: [
      { codigo: 'IRC', esCritico: false }
    ],
    evaluacion2026: { estado: 'En proceso', ambiental: 78, social: 75, etica: 80, laboral: 82, cadena: 85 }
  },
  {
    ruc: '20609988774',
    razonSocial: 'Guangzhou Apparel & Textile Manufacturing Co.',
    nombreComercial: 'Guangzhou Textiles',
    direccionFiscal: 'Haizhu District Xingang East Road 1000, Guangzhou',
    departamento: 'Guangdong',
    representante: 'Huang Mei Ling',
    cargoRepresentante: 'Commercial Director',
    telefono: '+86 20 8912 3456',
    correo: 'orders@guangzhouapparel.cn',
    tipo: 'Retail',
    tamanoEmpresa: 'Gran empresa',
    aniosOperacion: '16 años',
    sitioWeb: 'https://www.guangzhouapparel.cn',
    esCritico: true,
    codigoIndustria: 'TEX',
    unidades: [
      { codigo: 'IRC', esCritico: true },
      { codigo: 'OEC', esCritico: true }
    ],
    evaluacion2026: { estado: 'Finalizado', ambiental: 82, social: 80, etica: 85, laboral: 84, cadena: 88 }
  }
];

const eventosAuditoriaHistoricos = [
  { accion: 'Inicio de sesión corporativo en plataforma de sostenibilidad', fecha: '2026-08-15 08:30:12', correo: 'lsolano@intercorpretail.pe' },
  { accion: 'Configuración de pesos dimensionales y catálogo maestro ESG', fecha: '2026-08-15 09:14:40', correo: 'lsolano@intercorpretail.pe' },
  { accion: 'Creación y publicación de Campaña de Homologación 2026-I', fecha: '2026-08-15 10:05:22', correo: 'mprado@intercorpretail.pe' },
  { accion: 'Asignación masiva de evaluaciones a proveedores críticos', fecha: '2026-08-16 11:20:15', correo: 'ccoronel@intercorpretail.pe' },
  { accion: 'Generación de enlace seguro y código OTP para Alicorp S.A.A.', fecha: '2026-08-18 14:10:05', correo: 'ccoronel@intercorpretail.pe' },
  { accion: 'Recepción y calificación automática de evaluación para RUC 20100070970', fecha: '2026-08-19 16:45:30', correo: 'admin@intercorpretail.pe' },
  { accion: 'Emisión de Certificado Oficial de Homologación ESG (Alicorp)', fecha: '2026-08-20 09:12:18', correo: 'mprado@intercorpretail.pe' },
  { accion: 'Asignación de evaluación a proveedores críticos de Promart', fecha: '2026-08-22 10:30:00', correo: 'cchiroque@intercorpretail.pe' },
  { accion: 'Recepción y calificación automática de evaluación para Aceros Arequipa', fecha: '2026-08-25 15:20:11', correo: 'admin@intercorpretail.pe' },
  { accion: 'Actualización de criticidad de abastecimiento para Oechsle', fecha: '2026-08-28 11:05:44', correo: 'fbeltran@intercorpretail.pe' },
  { accion: 'Recepción y calificación automática de evaluación para Textiles Camones', fecha: '2026-09-02 17:10:55', correo: 'admin@intercorpretail.pe' },
  { accion: 'Exportación a Excel del Padrón General de Proveedores Homologados', fecha: '2026-09-05 16:40:22', correo: 'lsolano@intercorpretail.pe' },
  { accion: 'Descarga del Informe Analítico REP-06 de Brechas ESG por Unidad', fecha: '2026-09-10 14:25:33', correo: 'mprado@intercorpretail.pe' },
  { accion: 'Validación de código OTP para acceso de proveedor RUC 20509823417', fecha: '2026-09-12 10:15:08', correo: 'admin@intercorpretail.pe' },
  { accion: 'Recepción y calificación de evaluación para Ransa Comercial S.A.', fecha: '2026-09-14 18:02:40', correo: 'admin@intercorpretail.pe' },
  { accion: 'Consulta de bitácora forense de auditoría de seguridad', fecha: '2026-09-18 11:50:19', correo: 'gnavarro@intercorpretail.pe' },
  { accion: 'Actualización de matriz de criticidad multicriterio', fecha: '2026-09-22 15:30:10', correo: 'cchiroque@intercorpretail.pe' },
  { accion: 'Emisión de Certificado Oficial de Homologación ESG (Ransa)', fecha: '2026-09-25 09:40:50', correo: 'mprado@intercorpretail.pe' }
];

export async function sembrarDatos(cadenaConexion = process.env.URL_BASE_DATOS) {
  const cliente = new Client({
    connectionString: cadenaConexion,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await cliente.connect();
    console.log('Conectado a Neon PostgreSQL para sembrar datos reales de demostración...');

    await cliente.query(`
      CREATE TABLE IF NOT EXISTS campania (
        id_campania SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        periodo VARCHAR(40) NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
      );
      CREATE TABLE IF NOT EXISTS proveedor_unidad_negocio (
        id_proveedor INT NOT NULL,
        id_unidad INT NOT NULL,
        es_critico BOOLEAN NOT NULL DEFAULT FALSE
      );
      CREATE TABLE IF NOT EXISTS evaluacion (
        id_evaluacion SERIAL PRIMARY KEY,
        id_campania INT NOT NULL,
        id_proveedor INT NOT NULL,
        token VARCHAR(80) NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
        fecha_envio TIMESTAMPTZ,
        puntaje_total NUMERIC(5,2)
      );
      CREATE TABLE IF NOT EXISTS puntaje_dimension (
        id_puntaje SERIAL PRIMARY KEY,
        id_evaluacion INT NOT NULL,
        id_dimension INT NOT NULL,
        valor NUMERIC(5,2) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS respuesta (
        id_respuesta SERIAL PRIMARY KEY,
        id_evaluacion INT NOT NULL,
        id_item INT NOT NULL,
        id_alternativa INT NOT NULL,
        fecha TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS auditoria (
        id_auditoria SERIAL PRIMARY KEY,
        id_usuario INT,
        id_evaluacion INT,
        accion VARCHAR(120) NOT NULL,
        fecha TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(200);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS direccion_fiscal VARCHAR(255);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS cargo_representante VARCHAR(120);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS tamano_empresa VARCHAR(80);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS anios_operacion VARCHAR(50);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(255);
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS es_critico BOOLEAN DEFAULT FALSE;
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS id_unidad INT;
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS id_industria INT;
      ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
      ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ;
      ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS puntaje_total NUMERIC(5,2);
      ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS token VARCHAR(80);
      ALTER TABLE evaluacion ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Pendiente';
      ALTER TABLE proveedor_unidad_negocio ADD COLUMN IF NOT EXISTS es_critico BOOLEAN DEFAULT FALSE;
      ALTER TABLE industria ADD COLUMN IF NOT EXISTS tipo VARCHAR(60);
    `);

    for (const u of unidades) {
      const resExistente = await cliente.query(
        'SELECT id_unidad FROM unidad_negocio WHERE codigo = $1 OR nombre = $2',
        [u.codigo, u.nombre]
      );
      if (resExistente.rows.length > 0) {
        await cliente.query(
          'UPDATE unidad_negocio SET codigo = $1, nombre = $2, gerente = $3 WHERE id_unidad = $4',
          [u.codigo, u.nombre, u.gerente, resExistente.rows[0].id_unidad]
        );
      } else {
        await cliente.query(
          'INSERT INTO unidad_negocio (codigo, nombre, gerente) VALUES ($1, $2, $3)',
          [u.codigo, u.nombre, u.gerente]
        );
      }
    }
    const mapaUnidades = {};
    const resUnidades = await cliente.query('SELECT id_unidad, codigo FROM unidad_negocio');
    resUnidades.rows.forEach(r => { mapaUnidades[r.codigo] = r.id_unidad; });

    for (const ind of industrias) {
      const resExistente = await cliente.query(
        'SELECT id_industria FROM industria WHERE codigo = $1 OR nombre = $2',
        [ind.codigo, ind.nombre]
      );
      if (resExistente.rows.length > 0) {
        await cliente.query(
          'UPDATE industria SET codigo = $1, nombre = $2, tipo = $3 WHERE id_industria = $4',
          [ind.codigo, ind.nombre, ind.tipo, resExistente.rows[0].id_industria]
        );
      } else {
        await cliente.query(
          'INSERT INTO industria (codigo, nombre, tipo) VALUES ($1, $2, $3)',
          [ind.codigo, ind.nombre, ind.tipo]
        );
      }
    }
    const mapaIndustrias = {};
    const resIndustrias = await cliente.query('SELECT id_industria, codigo FROM industria');
    resIndustrias.rows.forEach(r => { mapaIndustrias[r.codigo] = r.id_industria; });

    for (const d of dimensiones) {
      const resExistente = await cliente.query(
        'SELECT id_dimension FROM dimension WHERE codigo = $1 OR nombre = $2',
        [d.codigo, d.nombre]
      );
      if (resExistente.rows.length > 0) {
        await cliente.query(
          'UPDATE dimension SET codigo = $1, nombre = $2, peso = $3 WHERE id_dimension = $4',
          [d.codigo, d.nombre, d.peso, resExistente.rows[0].id_dimension]
        );
      } else {
        await cliente.query(
          'INSERT INTO dimension (codigo, nombre, peso) VALUES ($1, $2, $3)',
          [d.codigo, d.nombre, d.peso]
        );
      }
    }
    const mapaDimensiones = {};
    const resDimensiones = await cliente.query('SELECT id_dimension, codigo FROM dimension');
    resDimensiones.rows.forEach(r => { mapaDimensiones[r.codigo] = r.id_dimension; });

    const mapaItems = {};
    for (const p of preguntas) {
      const idDim = mapaDimensiones[p.codigoDimension];
      const resItemExistente = await cliente.query(
        'SELECT id_item FROM item WHERE codigo = $1',
        [p.codigo]
      );
      let idItem;
      if (resItemExistente.rows.length > 0) {
        idItem = resItemExistente.rows[0].id_item;
        await cliente.query(
          'UPDATE item SET enunciado = $1, peso = $2, id_dimension = $3 WHERE id_item = $4',
          [p.enunciado, p.peso, idDim, idItem]
        );
      } else {
        const resItem = await cliente.query(
          `INSERT INTO item (codigo, enunciado, peso, id_dimension)
           VALUES ($1, $2, $3, $4)
           RETURNING id_item`,
          [p.codigo, p.enunciado, p.peso, idDim]
        );
        idItem = resItem.rows[0].id_item;
      }
      mapaItems[p.codigo] = { idItem, alternativas: [] };

      for (let orden = 0; orden < p.alternativas.length; orden++) {
        const alt = p.alternativas[orden];
        const resBuscada = await cliente.query(
          `SELECT id_alternativa FROM alternativa WHERE id_item = $1 AND texto = $2`,
          [idItem, alt.texto]
        );
        let idAlt = resBuscada.rows[0]?.id_alternativa;
        if (!idAlt) {
          const resAlt = await cliente.query(
            `INSERT INTO alternativa (id_item, texto, puntaje, orden)
             VALUES ($1, $2, $3, $4)
             RETURNING id_alternativa`,
            [idItem, alt.texto, alt.puntaje, orden + 1]
          );
          idAlt = resAlt.rows[0]?.id_alternativa;
        }
        mapaItems[p.codigo].alternativas.push({ idAlternativa: idAlt, puntaje: alt.puntaje });
      }

      for (const idInd of Object.values(mapaIndustrias)) {
        const resRelExistente = await cliente.query(
          'SELECT id_item_industria FROM item_industria WHERE id_item = $1 AND id_industria = $2',
          [idItem, idInd]
        );
        if (resRelExistente.rows.length === 0) {
          await cliente.query(
            'INSERT INTO item_industria (id_item, id_industria, obligatorio) VALUES ($1, $2, true)',
            [idItem, idInd]
          );
        }
      }
    }

    const claveHash = await bcrypt.hash(CLAVE_DEMO, 10);
    const mapaUsuarios = {};

    for (const u of usuariosEquipo) {
      const rolRes = await cliente.query('SELECT id_rol FROM rol WHERE nombre = $1', [u.rol]);
      const idRol = rolRes.rows[0]?.id_rol || 1;
      const idUnidad = u.codigoUnidad ? mapaUnidades[u.codigoUnidad] : null;

      const resUserExistente = await cliente.query(
        'SELECT id_usuario FROM usuario WHERE correo = $1',
        [u.correo]
      );
      let idUsuario;
      if (resUserExistente.rows.length > 0) {
        idUsuario = resUserExistente.rows[0].id_usuario;
        await cliente.query(
          `UPDATE usuario SET nombre = $1, clave_hash = $2, id_rol = $3, id_unidad = $4, estado = true WHERE id_usuario = $5`,
          [u.nombre, claveHash, idRol, idUnidad, idUsuario]
        );
      } else {
        const resUser = await cliente.query(
          `INSERT INTO usuario (correo, nombre, clave_hash, id_rol, id_unidad, estado)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id_usuario`,
          [u.correo, u.nombre, claveHash, idRol, idUnidad]
        );
        idUsuario = resUser.rows[0]?.id_usuario;
      }
      mapaUsuarios[u.correo] = idUsuario;
    }

    const mapaCampanias = {};
    for (const c of campaniasMaestras) {
      const buscada = await cliente.query('SELECT id_campania FROM campania WHERE nombre = $1', [c.nombre]);
      let idCamp = buscada.rows[0]?.id_campania;
      if (!idCamp) {
        const resCamp = await cliente.query(
          `INSERT INTO campania (nombre, periodo, estado)
           VALUES ($1, $2, $3)
           RETURNING id_campania`,
          [c.nombre, c.periodo, c.estado]
        );
        idCamp = resCamp.rows[0]?.id_campania;
      }
      mapaCampanias[c.periodo] = idCamp;
    }
    const idCampaniaActiva = mapaCampanias['2026-I'] || 1;

    for (const p of padronProveedores) {
      const idUnidadPrincipal = mapaUnidades[p.unidades[0]?.codigo] || 1;
      const idIndustria = mapaIndustrias[p.codigoIndustria] || 1;
      let tamanoEmpresaNormalizado = p.tamanoEmpresa;
      if (tamanoEmpresaNormalizado === 'Mediana empresa') tamanoEmpresaNormalizado = 'PYME';
      if (tamanoEmpresaNormalizado === 'Pequeña empresa') tamanoEmpresaNormalizado = 'MYPE';
      if (!['MYPE', 'PYME', 'Gran empresa'].includes(tamanoEmpresaNormalizado)) {
        tamanoEmpresaNormalizado = 'Gran empresa';
      }

      const resProvExistente = await cliente.query(
        'SELECT id_proveedor FROM proveedor WHERE ruc = $1',
        [p.ruc]
      );
      let idProveedor;
      if (resProvExistente.rows.length > 0) {
        idProveedor = resProvExistente.rows[0].id_proveedor;
        await cliente.query(
          `UPDATE proveedor SET
             razon_social = $1,
             nombre_comercial = $2,
             direccion_fiscal = $3,
             departamento = $4,
             representante = $5,
             cargo_representante = $6,
             telefono = $7,
             correo = $8,
             tipo = $9,
             tamano_empresa = $10,
             anios_operacion = $11,
             sitio_web = $12,
             es_critico = $13,
             id_unidad = $14,
             id_industria = $15,
             activo = true
           WHERE id_proveedor = $16`,
          [
            p.razonSocial, p.nombreComercial, p.direccionFiscal, p.departamento,
            p.representante, p.cargoRepresentante, p.telefono, p.correo, p.tipo, tamanoEmpresaNormalizado,
            p.aniosOperacion, p.sitioWeb, p.esCritico, idUnidadPrincipal, idIndustria, idProveedor
          ]
        );
      } else {
        const resProv = await cliente.query(
          `INSERT INTO proveedor (
             ruc, razon_social, nombre_comercial, direccion_fiscal, departamento,
             representante, cargo_representante, telefono, correo, tipo, tamano_empresa,
             anios_operacion, sitio_web, es_critico, id_unidad, id_industria, activo
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
           RETURNING id_proveedor`,
          [
            p.ruc, p.razonSocial, p.nombreComercial, p.direccionFiscal, p.departamento,
            p.representante, p.cargoRepresentante, p.telefono, p.correo, p.tipo, tamanoEmpresaNormalizado,
            p.aniosOperacion, p.sitioWeb, p.esCritico, idUnidadPrincipal, idIndustria
          ]
        );
        idProveedor = resProv.rows[0].id_proveedor;
      }

      for (const u of p.unidades) {
        const idU = mapaUnidades[u.codigo];
        if (idU) {
          const resRelU = await cliente.query(
            'SELECT id_proveedor FROM proveedor_unidad_negocio WHERE id_proveedor = $1 AND id_unidad = $2',
            [idProveedor, idU]
          );
          if (resRelU.rows.length > 0) {
            await cliente.query(
              'UPDATE proveedor_unidad_negocio SET es_critico = $1 WHERE id_proveedor = $2 AND id_unidad = $3',
              [u.esCritico, idProveedor, idU]
            );
          } else {
            await cliente.query(
              'INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad, es_critico) VALUES ($1, $2, $3)',
              [idProveedor, idU, u.esCritico]
            );
          }
        }
      }

      const evData = p.evaluacion2026;
      if (evData) {
        const tokenEvaluacion = `eval-${idCampaniaActiva}-${idProveedor}`;
        let puntajeCalculado = null;

        if (evData.estado === 'Finalizado') {
          puntajeCalculado = Math.round(
            (evData.ambiental * 0.25) +
            (evData.social * 0.20) +
            (evData.etica * 0.25) +
            (evData.laboral * 0.20) +
            (evData.cadena * 0.10)
          );
        }

        const fechaEnvio = evData.estado === 'Finalizado' ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null;
        const resEvalExistente = await cliente.query(
          'SELECT id_evaluacion FROM evaluacion WHERE id_campania = $1 AND id_proveedor = $2',
          [idCampaniaActiva, idProveedor]
        );
        let idEvaluacion;
        if (resEvalExistente.rows.length > 0) {
          idEvaluacion = resEvalExistente.rows[0].id_evaluacion;
          await cliente.query(
            `UPDATE evaluacion SET estado = $1, puntaje_total = $2, fecha_envio = $3 WHERE id_evaluacion = $4`,
            [evData.estado, puntajeCalculado, fechaEnvio, idEvaluacion]
          );
        } else {
          const resEval = await cliente.query(
            `INSERT INTO evaluacion (id_campania, id_proveedor, token, estado, puntaje_total, fecha_envio)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id_evaluacion`,
            [idCampaniaActiva, idProveedor, tokenEvaluacion, evData.estado, puntajeCalculado, fechaEnvio]
          );
          idEvaluacion = resEval.rows[0].id_evaluacion;
        }

        if (evData.estado === 'Finalizado') {
          const notasDimensionales = [
            { codigo: 'AMB', valor: evData.ambiental },
            { codigo: 'SOC', valor: evData.social },
            { codigo: 'ETI', valor: evData.etica },
            { codigo: 'LAB', valor: evData.laboral },
            { codigo: 'CAD', valor: evData.cadena }
          ];

          for (const nd of notasDimensionales) {
            const idDim = mapaDimensiones[nd.codigo];
            if (idDim) {
              const resPuntExistente = await cliente.query(
                'SELECT id_puntaje FROM puntaje_dimension WHERE id_evaluacion = $1 AND id_dimension = $2',
                [idEvaluacion, idDim]
              );
              if (resPuntExistente.rows.length > 0) {
                await cliente.query(
                  'UPDATE puntaje_dimension SET valor = $1 WHERE id_puntaje = $2',
                  [nd.valor, resPuntExistente.rows[0].id_puntaje]
                );
              } else {
                await cliente.query(
                  'INSERT INTO puntaje_dimension (id_evaluacion, id_dimension, valor) VALUES ($1, $2, $3)',
                  [idEvaluacion, idDim, nd.valor]
                );
              }
            }
          }

          for (const itemCod of Object.keys(mapaItems)) {
            const itemObj = mapaItems[itemCod];
            const altElegida = itemObj.alternativas[0];
            if (altElegida) {
              const resRespExistente = await cliente.query(
                'SELECT id_respuesta FROM respuesta WHERE id_evaluacion = $1 AND id_item = $2',
                [idEvaluacion, itemObj.idItem]
              );
              if (resRespExistente.rows.length > 0) {
                await cliente.query(
                  'UPDATE respuesta SET id_alternativa = $1 WHERE id_respuesta = $2',
                  [altElegida.idAlternativa, resRespExistente.rows[0].id_respuesta]
                );
              } else {
                await cliente.query(
                  `INSERT INTO respuesta (id_evaluacion, id_item, id_alternativa, fecha)
                   VALUES ($1, $2, $3, CURRENT_TIMESTAMP - INTERVAL '3 days')`,
                  [idEvaluacion, itemObj.idItem, altElegida.idAlternativa]
                );
              }
            }
          }
        }
      }
    }

    const idAdmin = mapaUsuarios['admin@intercorpretail.pe'] || 1;
    for (const aud of eventosAuditoriaHistoricos) {
      const idU = mapaUsuarios[aud.correo] || idAdmin;
      await cliente.query(
        `INSERT INTO auditoria (id_usuario, accion, fecha)
         VALUES ($1, $2, $3::timestamptz)`,
        [idU, aud.accion, aud.fecha]
      );
    }

    await cliente.query(`
      UPDATE proveedor SET
        nombre_comercial = COALESCE(NULLIF(nombre_comercial, ''), razon_social),
        direccion_fiscal = COALESCE(NULLIF(direccion_fiscal, ''), 'Av. Javier Prado Este 4200, Santiago de Surco'),
        departamento = COALESCE(NULLIF(departamento, ''), 'Lima'),
        cargo_representante = COALESCE(NULLIF(cargo_representante, ''), 'Gerente de Operaciones'),
        telefono = COALESCE(NULLIF(telefono, ''), '+51 1 6188000'),
        tamano_empresa = CASE
          WHEN tamano_empresa IN ('MYPE', 'PYME', 'Gran empresa') THEN tamano_empresa
          WHEN tamano_empresa = 'Mediana empresa' THEN 'PYME'
          WHEN tamano_empresa = 'Pequeña empresa' THEN 'MYPE'
          ELSE 'Gran empresa'
        END,
        anios_operacion = COALESCE(NULLIF(anios_operacion, ''), '15 años'),
        sitio_web = COALESCE(NULLIF(sitio_web, ''), 'https://www.intercorpretail.pe')
      WHERE direccion_fiscal IS NULL OR telefono IS NULL OR departamento IS NULL OR tamano_empresa IS NULL OR anios_operacion IS NULL OR sitio_web IS NULL
    `);

    console.log('Siembra integral de datos de demostración completada con éxito.');
    console.log(`Proveedores procesados: ${padronProveedores.length}`);
    console.log(`Campañas configuradas: ${campaniasMaestras.length}`);
    console.log(`Usuarios corporativos con clave '${CLAVE_DEMO}': ${usuariosEquipo.length}`);

    await cliente.end();
    return {
      exito: true,
      proveedores: padronProveedores.length,
      campanias: campaniasMaestras.length,
      usuarios: usuariosEquipo.length
    };
  } catch (error) {
    console.error('Error durante la siembra de datos:', error);
    await cliente.end();
    throw error;
  }
}

if (process.argv[1] && process.argv[1].includes('sembrarDatosDemostracion')) {
  sembrarDatos().catch(() => process.exit(1));
}
