import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
const directorioActual = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

// Cartera de proveedores demo (RUC reales de empresas peruanas conocidas, usados solo
// como datos de ejemplo para poblar el directorio y el dashboard corporativo).
const proveedores = [
  { ruc: '20100070970', razonSocial: 'Alicorp S.A.A.', representante: 'Manuel Romero Caro', correo: 'contacto@alicorp.com.pe', tipo: 'Retail', esCritico: true, idUnidad: 1, idIndustria: 1 },
  { ruc: '20100119227', razonSocial: 'Gloria S.A.', representante: 'Claudio Rodríguez Huaco', correo: 'proveedores@gloria.com.pe', tipo: 'Retail', esCritico: true, idUnidad: 1, idIndustria: 1 },
  { ruc: '20512345678', razonSocial: 'Distribuidora Alimentos del Norte S.A.C.', representante: 'Carlos Mendoza Alva', correo: 'contacto@proveedor.com.pe', tipo: 'No retail', esCritico: false, idUnidad: 1, idIndustria: 1 },
  { ruc: '20254053822', razonSocial: 'Aceros Arequipa S.A.', representante: 'Ricardo Cillóniz Champin', correo: 'sostenibilidad@acerosarequipa.pe', tipo: 'Retail', esCritico: true, idUnidad: 2, idIndustria: 4 },
  { ruc: '20452398411', razonSocial: 'Cementos Pacasmayo S.A.A.', representante: 'Humberto Nadal del Carpio', correo: 'proveedor@pacasmayo.com.pe', tipo: 'Retail', esCritico: true, idUnidad: 2, idIndustria: 4 },
  { ruc: '20338574921', razonSocial: 'Textiles Camones S.A.', representante: 'Carlos Camones Sánchez', correo: 'ventas@camones.com.pe', tipo: 'Retail', esCritico: true, idUnidad: 3, idIndustria: 3 },
  { ruc: '20601248593', razonSocial: 'Confecciones Andinas del Sur E.I.R.L.', representante: 'María Luisa Quispe', correo: 'informes@andinasur.pe', tipo: 'No retail', esCritico: false, idUnidad: 3, idIndustria: 3 },
  { ruc: '20509823417', razonSocial: 'Operador Logístico Ransa Comercial S.A.', representante: 'Tomás Moro Belmont', correo: 'atencion@ransa.net', tipo: 'Retail', esCritico: true, idUnidad: 4, idIndustria: 2 },
  { ruc: '20100142806', razonSocial: 'Laboratorios Farmindustria S.A.', representante: 'Jorge Arévalo Silva', correo: 'corporativo@farmindustria.com.pe', tipo: 'Retail', esCritico: true, idUnidad: 5, idIndustria: 6 },
  { ruc: '20491823741', razonSocial: 'Droguería Médica del Pacífico S.A.C.', representante: 'Elena Villacorta Peña', correo: 'contacto@medpacc.pe', tipo: 'No retail', esCritico: false, idUnidad: 5, idIndustria: 6 },
  { ruc: '20556677889', razonSocial: 'Soluciones Inmobiliarias y Propiedades S.A. (SIP)', representante: 'Fernando Carrillo Otero', correo: 'operaciones@sipcorp.pe', tipo: 'Retail', esCritico: true, idUnidad: 6, idIndustria: 4 },
  { ruc: '20609988771', razonSocial: 'Shanghai Global Sourcing Retail Ltd.', representante: 'Wei Zhang Lin', correo: 'asia-support@intercorpretail.pe', tipo: 'Retail', esCritico: true, idUnidad: 7, idIndustria: 2 }
];

// Ítems base del cuestionario, uno por dimensión como mínimo, aplicados a TODAS las
// industrias (obligatorios) para que cualquier proveedor tenga un cuestionario completo.
// Es aditivo: usa ON CONFLICT/existencia previa, nunca borra ítems ni alternativas ya
// usados por evaluaciones reales.
const itemsPreguntas = [
  { codigo: 'AMB-01', enunciado: '¿La empresa cuenta con una política formalizada y documentada de gestión de residuos y reciclaje?', peso: 25.00, idDimension: 1 },
  { codigo: 'AMB-02', enunciado: '¿La empresa mide anualmente sus emisiones de gases de efecto invernadero (huella de carbono)?', peso: 25.00, idDimension: 1 },
  { codigo: 'SOC-01', enunciado: '¿Cuenta con un programa anual estructurado de desarrollo comunitario y apoyo local?', peso: 25.00, idDimension: 2 },
  { codigo: 'ETI-15', enunciado: '¿La empresa cuenta con un canal formalizado de denuncias anónimas para faltas éticas o fraude?', peso: 25.00, idDimension: 3 },
  { codigo: 'ETI-16', enunciado: '¿El canal de denuncias es administrado por una firma independiente que garantiza confidencialidad absoluta?', peso: 15.00, idDimension: 3 },
  { codigo: 'LAB-01', enunciado: '¿Todos los colaboradores se encuentran registrados en planilla electrónica conforme a la legislación peruana?', peso: 25.00, idDimension: 4 },
  { codigo: 'CAD-01', enunciado: '¿La empresa exige criterios de sostenibilidad a sus propios proveedores (segundo nivel de la cadena)?', peso: 20.00, idDimension: 5 }
];

const alternativasPorItem = [
  { codigoItem: 'AMB-01', texto: 'Sí, formalizada, documentada y auditada anualmente', puntaje: 100.00, orden: 1 },
  { codigoItem: 'AMB-01', texto: 'Sí, formalizada pero sin auditoría externa', puntaje: 70.00, orden: 2 },
  { codigoItem: 'AMB-01', texto: 'En proceso de elaboración e implementación', puntaje: 40.00, orden: 3 },
  { codigoItem: 'AMB-01', texto: 'No cuenta con política formal de residuos', puntaje: 0.00, orden: 4 },
  { codigoItem: 'AMB-02', texto: 'Sí, con medición y certificación de Alcance 1, 2 y 3', puntaje: 100.00, orden: 1 },
  { codigoItem: 'AMB-02', texto: 'Sí, medición de Alcance 1 y 2 sin certificación externa', puntaje: 70.00, orden: 2 },
  { codigoItem: 'AMB-02', texto: 'En proceso de cálculo inicial', puntaje: 30.00, orden: 3 },
  { codigoItem: 'AMB-02', texto: 'No realiza medición de emisiones de carbono', puntaje: 0.00, orden: 4 },
  { codigoItem: 'SOC-01', texto: 'Sí, con presupuesto asignado e indicadores de impacto medidos', puntaje: 100.00, orden: 1 },
  { codigoItem: 'SOC-01', texto: 'Sí, con actividades periódicas sin indicadores formales', puntaje: 65.00, orden: 2 },
  { codigoItem: 'SOC-01', texto: 'Participaciones esporádicas no planificadas', puntaje: 35.00, orden: 3 },
  { codigoItem: 'SOC-01', texto: 'No cuenta con programas comunitarios', puntaje: 0.00, orden: 4 },
  { codigoItem: 'ETI-15', texto: 'Sí, canal gestionado por un tercero independiente con protección al denunciante', puntaje: 100.00, orden: 1 },
  { codigoItem: 'ETI-15', texto: 'Sí, canal interno formalizado y publicado', puntaje: 75.00, orden: 2 },
  { codigoItem: 'ETI-15', texto: 'Buzón de sugerencias o correo sin garantía de anonimato', puntaje: 30.00, orden: 3 },
  { codigoItem: 'ETI-15', texto: 'No dispone de canal de denuncias formal', puntaje: 0.00, orden: 4 },
  { codigoItem: 'ETI-16', texto: 'Sí, firma externa internacional con certificación de secreto profesional', puntaje: 100.00, orden: 1 },
  { codigoItem: 'ETI-16', texto: 'Sí, estudio jurídico externo nacional', puntaje: 70.00, orden: 2 },
  { codigoItem: 'ETI-16', texto: 'Comité interno de cumplimiento corporativo', puntaje: 40.00, orden: 3 },
  { codigoItem: 'ETI-16', texto: 'No cuenta con administración externa ni especializada', puntaje: 0.00, orden: 4 },
  { codigoItem: 'LAB-01', texto: '100% formalizados en planilla electrónica con auditorías laborales periódicas', puntaje: 100.00, orden: 1 },
  { codigoItem: 'LAB-01', texto: '100% formalizados en planilla sin auditorías periódicas', puntaje: 80.00, orden: 2 },
  { codigoItem: 'LAB-01', texto: 'Mayoría en planilla con personal bajo regularización', puntaje: 40.00, orden: 3 },
  { codigoItem: 'LAB-01', texto: 'No se tiene registro formal unificado', puntaje: 0.00, orden: 4 },
  { codigoItem: 'CAD-01', texto: 'Sí, con cláusulas contractuales y auditorías a proveedores críticos', puntaje: 100.00, orden: 1 },
  { codigoItem: 'CAD-01', texto: 'Sí, con criterios informales sin verificación', puntaje: 60.00, orden: 2 },
  { codigoItem: 'CAD-01', texto: 'En evaluación para su futura implementación', puntaje: 30.00, orden: 3 },
  { codigoItem: 'CAD-01', texto: 'No exige criterios de sostenibilidad a sus proveedores', puntaje: 0.00, orden: 4 }
];

async function poblar() {
  const cliente = new Client({
    connectionString: process.env.URL_BASE_DATOS,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await cliente.connect();
    console.log('Conectado a Neon PostgreSQL para poblar datos de demo...');

    for (const p of proveedores) {
      await cliente.query(`
        INSERT INTO proveedor (ruc, razon_social, representante, correo, tipo, es_critico, id_unidad, id_industria)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (ruc) DO UPDATE SET
          razon_social = EXCLUDED.razon_social,
          representante = EXCLUDED.representante,
          correo = EXCLUDED.correo,
          tipo = EXCLUDED.tipo,
          es_critico = EXCLUDED.es_critico;
      `, [p.ruc, p.razonSocial, p.representante, p.correo, p.tipo, p.esCritico, p.idUnidad, p.idIndustria]);
    }
    console.log(`Proveedores listos: ${proveedores.length}`);

    for (const item of itemsPreguntas) {
      await cliente.query(`
        INSERT INTO item (codigo, enunciado, peso, id_dimension)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (codigo) DO UPDATE SET enunciado = EXCLUDED.enunciado, peso = EXCLUDED.peso;
      `, [item.codigo, item.enunciado, item.peso, item.idDimension]);
    }

    const mapaItems = {};
    const resItems = await cliente.query('SELECT id_item, codigo FROM item;');
    for (const fila of resItems.rows) mapaItems[fila.codigo] = fila.id_item;

    const mapaAlternativas = {};
    for (const alt of alternativasPorItem) {
      const idItem = mapaItems[alt.codigoItem];
      if (!idItem) continue;
      const existente = await cliente.query(
        'SELECT id_alternativa FROM alternativa WHERE id_item = $1 AND texto = $2',
        [idItem, alt.texto]
      );
      if (existente.rows.length > 0) {
        mapaAlternativas[`${alt.codigoItem}|${alt.texto}`] = existente.rows[0].id_alternativa;
        continue;
      }
      const insertado = await cliente.query(
        `INSERT INTO alternativa (id_item, texto, puntaje, orden) VALUES ($1, $2, $3, $4) RETURNING id_alternativa;`,
        [idItem, alt.texto, alt.puntaje, alt.orden]
      );
      mapaAlternativas[`${alt.codigoItem}|${alt.texto}`] = insertado.rows[0].id_alternativa;
    }
    console.log(`Ítems listos: ${Object.keys(mapaItems).length}, alternativas listas: ${Object.keys(mapaAlternativas).length}`);

    const resIndustrias = await cliente.query('SELECT id_industria FROM industria;');
    for (const codigo of Object.keys(mapaItems)) {
      for (const ind of resIndustrias.rows) {
        await cliente.query(
          `INSERT INTO item_industria (id_item, id_industria, obligatorio) VALUES ($1, $2, true)
           ON CONFLICT (id_item, id_industria) DO NOTHING;`,
          [mapaItems[codigo], ind.id_industria]
        );
      }
    }
    console.log(`Ítems vinculados a las ${resIndustrias.rows.length} industrias.`);

    const idAlternativaDisparadora = mapaAlternativas['ETI-15|Sí, canal gestionado por un tercero independiente con protección al denunciante'];
    if (mapaItems['ETI-15'] && mapaItems['ETI-16'] && idAlternativaDisparadora) {
      const reglaExistente = await cliente.query(
        'SELECT id_regla FROM regla_condicional WHERE id_item_origen = $1 AND id_item_destino = $2',
        [mapaItems['ETI-15'], mapaItems['ETI-16']]
      );
      if (reglaExistente.rows.length === 0) {
        await cliente.query(
          `INSERT INTO regla_condicional (id_item_origen, id_alternativa_disparadora, accion, id_item_destino)
           VALUES ($1, $2, 'mostrar', $3);`,
          [mapaItems['ETI-15'], idAlternativaDisparadora, mapaItems['ETI-16']]
        );
        console.log('Regla condicional ETI-15 -> ETI-16 creada.');
      }
    }

    console.log('Poblado de demo completado con éxito.');
    await cliente.end();
  } catch (error) {
    console.error('Error al poblar:', error);
    await cliente.end();
    process.exit(1);
  }
}

poblar();
