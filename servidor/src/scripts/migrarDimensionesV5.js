import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

// Consolida las 5 dimensiones ASG originales (Ambiental, Social, Ética y
// Gobernanza, Laboral, Cadena de Suministro) en las mismas 3 dimensiones que
// usa Intercorp Retail en su propia plataforma de evaluación de proveedores
// (Económico, Ambiental, Social). Mapeo aplicado, siguiendo su criterio:
//   - Ambiental            -> se mantiene igual
//   - Social               -> se mantiene igual
//   - Ética y Gobernanza   -> Económico (ellos agrupan "Gobierno corporativo" ahí)
//   - Laboral              -> Social (ellos agrupan "Prácticas laborales" ahí)
//   - Cadena de Suministro -> Económico (ellos agrupan "Gestión de proveedores" ahí)
// La fila de "Ética y Gobernanza" se reutiliza (mismo id_dimension) para
// convertirse en "Económico", de modo que los ítems, puntajes y
// recomendaciones ya asociados a ella conserven su integridad referencial.
async function migrar() {
  const cliente = new pkg.Client({ connectionString: process.env.URL_BASE_DATOS, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  console.log('Conectado. Aplicando migración v5 (consolidación de dimensiones)...');

  await cliente.query(`UPDATE dimension SET codigo = 'ECO', nombre = 'Económico', peso = 0.35 WHERE codigo = 'ETI'`);
  await cliente.query(`UPDATE dimension SET peso = 0.40 WHERE codigo = 'SOC'`);
  await cliente.query(`UPDATE dimension SET peso = 0.25 WHERE codigo = 'AMB'`);
  console.log('Dimensión "Ética y Gobernanza" renombrada a "Económico" y pesos actualizados.');

  const itemsASocial = await cliente.query(`
    UPDATE item SET id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'SOC')
    WHERE id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'LAB')
  `);
  const itemsAEconomico = await cliente.query(`
    UPDATE item SET id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'ECO')
    WHERE id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'CAD')
  `);
  console.log(`Ítems reclasificados: ${itemsASocial.rowCount} de Laboral -> Social, ${itemsAEconomico.rowCount} de Cadena de Suministro -> Económico.`);

  const recomendacionesASocial = await cliente.query(`
    UPDATE recomendacion SET id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'SOC')
    WHERE id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'LAB')
  `);
  const recomendacionesAEconomico = await cliente.query(`
    UPDATE recomendacion SET id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'ECO')
    WHERE id_dimension = (SELECT id_dimension FROM dimension WHERE codigo = 'CAD')
  `);
  console.log(`Recomendaciones reclasificadas: ${recomendacionesASocial.rowCount} -> Social, ${recomendacionesAEconomico.rowCount} -> Económico.`);

  // Los puntajes por dimensión ya calculados para evaluaciones finalizadas bajo
  // las dimensiones eliminadas no tienen un destino sin ambigüedad (podría
  // chocar con un puntaje ya existente para la misma evaluación en SOC/ECO por
  // la restricción UNIQUE(id_evaluacion, id_dimension)); se descartan y se
  // recalculan automáticamente la próxima vez que se finalice una evaluación.
  const puntajesEliminados = await cliente.query(`
    DELETE FROM puntaje_dimension
    WHERE id_dimension IN (SELECT id_dimension FROM dimension WHERE codigo IN ('LAB', 'CAD'))
  `);
  console.log(`Puntajes por dimensión obsoletos descartados: ${puntajesEliminados.rowCount}.`);

  const dimensionesEliminadas = await cliente.query(`DELETE FROM dimension WHERE codigo IN ('LAB', 'CAD')`);
  console.log(`Dimensiones obsoletas eliminadas: ${dimensionesEliminadas.rowCount}.`);

  const resultado = await cliente.query('SELECT codigo, nombre, peso FROM dimension ORDER BY id_dimension ASC');
  console.log('Dimensiones finales:', resultado.rows);

  await cliente.end();
  console.log('Migración v5 completada con éxito.');
}

migrar().catch((error) => {
  console.error('Error en la migración v5:', error);
  process.exit(1);
});
