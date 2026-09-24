import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

// Migración aditiva e idempotente. Agrega:
// 1) Borrado lógico para dimension (CRUD completo de dimensiones).
// 2) Relación muchos-a-muchos proveedor <-> unidad_negocio (un proveedor puede
//    atender a varias unidades). Se conserva proveedor.id_unidad (ahora nullable)
//    solo como "unidad de origen del primer registro", pero deja de ser la fuente
//    de verdad: la tabla nueva es la que se usa para filtros y visualización.
const sentencias = [
  `ALTER TABLE dimension ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE proveedor ALTER COLUMN id_unidad DROP NOT NULL`,
  `CREATE TABLE IF NOT EXISTS proveedor_unidad_negocio (
    id_proveedor INT NOT NULL REFERENCES proveedor(id_proveedor),
    id_unidad    INT NOT NULL REFERENCES unidad_negocio(id_unidad),
    PRIMARY KEY (id_proveedor, id_unidad)
  )`
];

async function migrar() {
  const cliente = new pkg.Client({ connectionString: process.env.URL_BASE_DATOS, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  console.log('Conectado. Aplicando migración v3...');

  for (const sql of sentencias) {
    await cliente.query(sql);
  }
  console.log('Columnas y tabla nuevas listas.');

  const resultado = await cliente.query(`
    INSERT INTO proveedor_unidad_negocio (id_proveedor, id_unidad)
    SELECT id_proveedor, id_unidad FROM proveedor WHERE id_unidad IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
  console.log(`Relaciones proveedor-unidad migradas desde el campo antiguo: ${resultado.rowCount}.`);

  await cliente.end();
  console.log('Migración v3 completada con éxito.');
}

migrar().catch((error) => {
  console.error('Error en la migración v3:', error);
  process.exit(1);
});
