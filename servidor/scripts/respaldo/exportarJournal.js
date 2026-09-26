import { Client } from 'pg';
import { cifrarContenido } from '../pruebas/recuperacion/servicioCifradoBackup.js';
import { subirObjetoBackup } from './clienteR2Backup.js';

function obtenerUrlBasesDatos() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('La variable de entorno DATABASE_URL es obligatoria y no está definida.');
  }
  return url;
}

function construirClaveJournal(fechaInicio, nombreArchivo) {
  const d = fechaInicio.toISOString().slice(0, 10);
  const h = fechaInicio.toISOString().slice(11, 13);
  return `database-backups/journal/${d}/${h}.${nombreArchivo}`;
}

export async function exportarJournal({ desde, hasta, claveEncriptado, subirAR2 = true } = {}) {
  const databaseUrl = obtenerUrlBasesDatos();
  const clave = claveEncriptado ?? process.env.BACKUP_ENCRYPTION_KEY;

  if (!clave) {
    throw new Error('La variable de entorno BACKUP_ENCRYPTION_KEY es obligatoria para exportar el journal.');
  }

  const desdeDate = desde ? new Date(desde) : new Date(Date.now() - 2 * 60 * 60 * 1000);
  const hastaDate = hasta ? new Date(hasta) : new Date();

  const cliente = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await cliente.connect();

  let eventos;
  try {
    const res = await cliente.query(
      `SELECT
        id_registro,
        nombre_tabla,
        operacion,
        clave_primaria,
        datos_anteriores,
        datos_nuevos,
        fecha_evento,
        fecha_cierre_transaccion_aprox,
        xid_transaccion,
        id_transaccion
      FROM registro_recuperacion
      WHERE fecha_evento >= $1
        AND fecha_evento < $2
      ORDER BY id_registro ASC;`,
      [desdeDate.toISOString(), hastaDate.toISOString()]
    );
    eventos = res.rows;
  } finally {
    await cliente.end();
  }

  const jsonEventos = JSON.stringify({
    ventanaDesde: desdeDate.toISOString(),
    ventanaHasta: hastaDate.toISOString(),
    totalEventos: eventos.length,
    eventos
  }, null, 2);

  const bufferCifrado = cifrarContenido(jsonEventos, clave);

  const metadatos = {
    ventanaDesde: desdeDate.toISOString(),
    ventanaHasta: hastaDate.toISOString(),
    totalEventos: eventos.length,
    tamanoBytes: bufferCifrado.length,
    generadoEn: new Date().toISOString()
  };

  if (subirAR2) {
    const claveEnc = construirClaveJournal(desdeDate, 'enc');
    const claveMeta = construirClaveJournal(desdeDate, 'manifest.json');
    await subirObjetoBackup(claveEnc, bufferCifrado);
    await subirObjetoBackup(claveMeta, Buffer.from(JSON.stringify(metadatos, null, 2), 'utf8'));
  }

  return { metadatos, bufferCifrado };
}
