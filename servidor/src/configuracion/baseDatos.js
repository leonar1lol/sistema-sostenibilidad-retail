import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const { Pool } = pkg;

export const grupoConexiones = new Pool({
  connectionString: process.env.URL_BASE_DATOS,
  ssl: { rejectUnauthorized: false }
});

export const consultarBaseDatos = (textoConsulta, parametros) => {
  return grupoConexiones.query(textoConsulta, parametros);
};

export const ejecutarTransaccion = async (funcionTransaccion) => {
  const cliente = await grupoConexiones.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await funcionTransaccion(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
};
