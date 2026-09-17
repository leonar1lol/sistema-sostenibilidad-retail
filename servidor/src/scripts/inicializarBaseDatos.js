import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

async function ejecutarInicializacion() {
  const clientePostgres = new Client({
    connectionString: process.env.URL_BASE_DATOS,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await clientePostgres.connect();
    console.log('Conexión establecida con Neon PostgreSQL.');

    const rutaSql = path.resolve(directorioActual, '../../../base-datos/esquema_inicial.sql');
    const contenidoSql = fs.readFileSync(rutaSql, 'utf-8');

    console.log('Ejecutando esquema inicial de base de datos...');
    await clientePostgres.query(contenidoSql);
    console.log('Esquema ejecutado con éxito.');

    const resultadoTablas = await clientePostgres.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tablas existentes en la base de datos:');
    resultadoTablas.rows.forEach(fila => console.log(` - ${fila.table_name}`));

    const conteoUnidades = await clientePostgres.query('SELECT COUNT(*) FROM unidad_negocio;');
    const conteoDimensiones = await clientePostgres.query('SELECT COUNT(*) FROM dimension;');
    const conteoIndustrias = await clientePostgres.query('SELECT COUNT(*) FROM industria;');
    const conteoRoles = await clientePostgres.query('SELECT COUNT(*) FROM rol;');

    console.log('Resumen de datos iniciales:');
    console.log(` - Roles: ${conteoRoles.rows[0].count}`);
    console.log(` - Unidades de negocio: ${conteoUnidades.rows[0].count}`);
    console.log(` - Dimensiones: ${conteoDimensiones.rows[0].count}`);
    console.log(` - Industrias: ${conteoIndustrias.rows[0].count}`);

    await clientePostgres.end();
    console.log('Proceso de inicialización finalizado correctamente.');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    await clientePostgres.end();
    process.exit(1);
  }
}

ejecutarInicializacion();
