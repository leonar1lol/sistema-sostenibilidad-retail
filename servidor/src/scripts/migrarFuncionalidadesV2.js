import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

// Migración aditiva e idempotente (ALTER TABLE ... IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
// No borra ni modifica datos existentes. Agrega soporte para:
// 1) Separar representante legal de la persona que responde la evaluación.
// 2) "Requiere documento" por unidad de negocio.
// 3) Recomendaciones diferenciadas por tamaño de empresa.
// 4) Modelo de criticidad ponderado (origen, negocio, participación) configurable.
// 5) Estado activo/inactivo (borrado lógico) para proveedor, ítem, industria y unidad de negocio.
const sentencias = [
  // --- 1) Persona que realiza la evaluación (distinta del representante legal) ---
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(160)`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS celular_contacto VARCHAR(20)`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS dni_contacto VARCHAR(20)`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS cargo_contacto VARCHAR(120)`,

  // --- 2) Requiere documento por unidad de negocio ---
  `ALTER TABLE unidad_negocio ADD COLUMN IF NOT EXISTS requiere_documento BOOLEAN NOT NULL DEFAULT FALSE`,

  // --- 3) Recomendaciones por tamaño de empresa ---
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS tamano_empresa VARCHAR(20) CHECK (tamano_empresa IN ('MYPE','PYME','Gran empresa'))`,
  `ALTER TABLE recomendacion ADD COLUMN IF NOT EXISTS tamano_empresa VARCHAR(20) CHECK (tamano_empresa IN ('MYPE','PYME','Gran empresa'))`,

  // --- 4) Modelo de criticidad ponderado ---
  `ALTER TABLE industria ADD COLUMN IF NOT EXISTS tipo VARCHAR(60) NOT NULL DEFAULT 'Productos (comerciales)'`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS pais VARCHAR(60) NOT NULL DEFAULT 'Perú'`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS nivel_criticidad_negocio VARCHAR(10) NOT NULL DEFAULT 'Bajo' CHECK (nivel_criticidad_negocio IN ('Alto','Medio','Bajo'))`,
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS nivel_participacion VARCHAR(10) NOT NULL DEFAULT 'Baja' CHECK (nivel_participacion IN ('Alta','Media','Baja'))`,
  `CREATE TABLE IF NOT EXISTS configuracion_pesos (
    id_configuracion       SERIAL PRIMARY KEY,
    peso_asg               NUMERIC(4,3) NOT NULL DEFAULT 0.55,
    peso_negocio           NUMERIC(4,3) NOT NULL DEFAULT 0.30,
    peso_origen            NUMERIC(4,3) NOT NULL DEFAULT 0.10,
    peso_participacion     NUMERIC(4,3) NOT NULL DEFAULT 0.05,
    criticidad_local       NUMERIC(5,2) NOT NULL DEFAULT 100,
    criticidad_internacional NUMERIC(5,2) NOT NULL DEFAULT 90
  )`,
  `CREATE TABLE IF NOT EXISTS configuracion_criticidad (
    id_configuracion    SERIAL PRIMARY KEY,
    tipo_industria      VARCHAR(60) NOT NULL UNIQUE,
    critico_alto        NUMERIC(5,2) NOT NULL DEFAULT 100,
    critico_medio       NUMERIC(5,2) NOT NULL DEFAULT 70,
    critico_bajo        NUMERIC(5,2) NOT NULL DEFAULT 30,
    participacion_alta  NUMERIC(5,2) NOT NULL DEFAULT 100,
    participacion_media NUMERIC(5,2) NOT NULL DEFAULT 70,
    participacion_baja  NUMERIC(5,2) NOT NULL DEFAULT 30,
    umbral_bajo         NUMERIC(5,2) NOT NULL DEFAULT 60,
    umbral_medio        NUMERIC(5,2) NOT NULL DEFAULT 80
  )`,

  // --- 5) Borrado lógico (activo/inactivo) para catálogos administrables ---
  `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE item ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE industria ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE unidad_negocio ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE`
];

async function migrar() {
  const cliente = new Client({ connectionString: process.env.URL_BASE_DATOS, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  console.log('Conectado. Aplicando migración v2...');

  for (const sql of sentencias) {
    await cliente.query(sql);
  }
  console.log('Columnas y tablas nuevas listas.');

  await cliente.query(
    `INSERT INTO configuracion_pesos (id_configuracion) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM configuracion_pesos)`
  );

  const tiposIndustria = ['Productos (comerciales)', 'Activos, servicios y suministros'];
  for (const tipo of tiposIndustria) {
    await cliente.query(
      `INSERT INTO configuracion_criticidad (tipo_industria) VALUES ($1) ON CONFLICT (tipo_industria) DO NOTHING`,
      [tipo]
    );
  }
  console.log('Filas de configuración por defecto listas.');

  // Clasificación inicial razonable de las 8 industrias sembradas en dos supertipos.
  const industriasDeServicios = ['LOG', 'SGE', 'ESS'];
  await cliente.query(
    `UPDATE industria SET tipo = 'Activos, servicios y suministros' WHERE codigo = ANY($1::text[])`,
    [industriasDeServicios]
  );
  await cliente.query(
    `UPDATE industria SET tipo = 'Productos (comerciales)' WHERE codigo != ALL($1::text[])`,
    [industriasDeServicios]
  );
  console.log('Industrias clasificadas por tipo (productos vs. activos/servicios/suministros).');

  await cliente.end();
  console.log('Migración v2 completada con éxito.');
}

migrar().catch((error) => {
  console.error('Error en la migración v2:', error);
  process.exit(1);
});
