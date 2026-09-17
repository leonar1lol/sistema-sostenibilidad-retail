import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const CLAVE_DEMO = 'Admin2026';

const usuarios = [
  { correo: 'admin@intercorpretail.pe', nombre: 'Leonardo Raul Solano Pio Huaman', rol: 'Administrador Corporativo', unidad: null },
  { correo: 'ccoronel@intercorpretail.pe', nombre: 'Carloman Coronel Cruz', rol: 'Gerente de Unidad de Negocio', unidad: 'SPSA' },
  { correo: 'cchiroque@intercorpretail.pe', nombre: 'Carlos Juniors Chiroque Silva', rol: 'Analista de Unidad de Negocio', unidad: 'PRO' },
  { correo: 'fbeltran@intercorpretail.pe', nombre: 'Frank Alex Beltran Ponce', rol: 'Gerente de Unidad de Negocio', unidad: 'OEC' },
  { correo: 'gnavarro@intercorpretail.pe', nombre: 'Gianfranco Daniel Navarro Flores', rol: 'Consulta', unidad: null }
];

async function poblar() {
  const cliente = new Client({ connectionString: process.env.URL_BASE_DATOS, ssl: { rejectUnauthorized: false } });
  await cliente.connect();

  const claveHash = await bcrypt.hash(CLAVE_DEMO, 10);

  for (const u of usuarios) {
    const rolResultado = await cliente.query('SELECT id_rol FROM rol WHERE nombre = $1', [u.rol]);
    const idRol = rolResultado.rows[0]?.id_rol;
    let idUnidad = null;
    if (u.unidad) {
      const unidadResultado = await cliente.query('SELECT id_unidad FROM unidad_negocio WHERE codigo = $1', [u.unidad]);
      idUnidad = unidadResultado.rows[0]?.id_unidad || null;
    }

    await cliente.query(
      `INSERT INTO usuario (correo, nombre, clave_hash, id_rol, id_unidad)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre, id_rol = EXCLUDED.id_rol, id_unidad = EXCLUDED.id_unidad`,
      [u.correo, u.nombre, claveHash, idRol, idUnidad]
    );
    console.log(`Usuario listo: ${u.correo} (${u.rol})`);
  }

  await cliente.end();
  console.log(`Contraseña de todos los usuarios sembrados: ${CLAVE_DEMO}`);
}

poblar().catch((error) => {
  console.error('Error al poblar usuarios:', error);
  process.exit(1);
});
