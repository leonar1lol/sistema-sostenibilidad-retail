import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

// La criticidad es una propiedad de la relación (proveedor, unidad), no del
// proveedor en general: un proveedor puede ser crítico para SPSA y no para
// Promart. Se agrega la columna a la tabla intermedia y se migra el valor
// antiguo (proveedor.es_critico) como punto de partida razonable: si ya era
// crítico, se marca como crítico en todas las unidades a las que hoy atiende.
async function migrar() {
  const cliente = new pkg.Client({ connectionString: process.env.URL_BASE_DATOS, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  console.log('Conectado. Aplicando migración v4...');

  await cliente.query(`ALTER TABLE proveedor_unidad_negocio ADD COLUMN IF NOT EXISTS es_critico BOOLEAN NOT NULL DEFAULT FALSE`);
  console.log('Columna es_critico agregada a proveedor_unidad_negocio.');

  const resultado = await cliente.query(`
    UPDATE proveedor_unidad_negocio pun
    SET es_critico = TRUE
    FROM proveedor p
    WHERE p.id_proveedor = pun.id_proveedor AND p.es_critico = TRUE
  `);
  console.log(`Relaciones marcadas como críticas a partir del flag antiguo: ${resultado.rowCount}.`);

  await cliente.end();
  console.log('Migración v4 completada con éxito.');
}

migrar().catch((error) => {
  console.error('Error en la migración v4:', error);
  process.exit(1);
});
