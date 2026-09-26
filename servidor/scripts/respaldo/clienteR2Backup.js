import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const PREFIJO_BACKUPS = 'database-backups/';

function crearClienteR2Backup() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_BACKUP;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Variables de entorno de R2 para respaldo incompletas: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_BACKUP son obligatorias.');
  }

  const cliente = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  return { cliente, bucket };
}

export async function subirObjetoBackup(claveRelativa, buffer) {
  if (!claveRelativa.startsWith(PREFIJO_BACKUPS)) {
    throw new Error(`Clave de backup fuera del prefijo permitido. Debe comenzar con "${PREFIJO_BACKUPS}". Clave recibida: ${claveRelativa}`);
  }

  const { cliente, bucket } = crearClienteR2Backup();

  await cliente.send(new PutObjectCommand({
    Bucket: bucket,
    Key: claveRelativa,
    Body: buffer,
    ContentType: 'application/octet-stream'
  }));
}

export async function descargarObjetoBackup(claveRelativa) {
  if (!claveRelativa.startsWith(PREFIJO_BACKUPS)) {
    throw new Error(`Clave de descarga fuera del prefijo permitido. Debe comenzar con "${PREFIJO_BACKUPS}".`);
  }

  const { cliente, bucket } = crearClienteR2Backup();

  const respuesta = await cliente.send(new GetObjectCommand({
    Bucket: bucket,
    Key: claveRelativa
  }));

  const trozos = [];
  for await (const trozo of respuesta.Body) {
    trozos.push(trozo);
  }
  return Buffer.concat(trozos);
}

export async function listarObjetosBackup(prefijoBusqueda = PREFIJO_BACKUPS) {
  if (!prefijoBusqueda.startsWith(PREFIJO_BACKUPS)) {
    throw new Error(`Prefijo de listado fuera del espacio permitido. Debe comenzar con "${PREFIJO_BACKUPS}".`);
  }

  const { cliente, bucket } = crearClienteR2Backup();
  const objetos = [];
  let token = undefined;

  do {
    const respuesta = await cliente.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefijoBusqueda,
      ContinuationToken: token
    }));

    for (const obj of (respuesta.Contents ?? [])) {
      objetos.push({ clave: obj.Key, fechaModificacion: obj.LastModified, tamanoBytes: obj.Size });
    }

    token = respuesta.IsTruncated ? respuesta.NextContinuationToken : undefined;
  } while (token);

  return objetos;
}

export async function eliminarObjetosVencidos(diasRetencion = 9) {
  const umbralMs = diasRetencion * 24 * 60 * 60 * 1000;
  const ahora = Date.now();

  const objetos = await listarObjetosBackup(PREFIJO_BACKUPS);
  const vencidos = objetos.filter(o => (ahora - new Date(o.fechaModificacion).getTime()) > umbralMs);

  if (vencidos.length === 0) {
    return { eliminados: 0, claves: [] };
  }

  const { cliente, bucket } = crearClienteR2Backup();
  const clavesEliminadas = [];

  for (const obj of vencidos) {
    if (!obj.clave.startsWith(PREFIJO_BACKUPS)) {
      throw new Error(`Intento de eliminar objeto fuera del prefijo de backups: ${obj.clave}`);
    }
    await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.clave }));
    clavesEliminadas.push(obj.clave);
  }

  return { eliminados: clavesEliminadas.length, claves: clavesEliminadas };
}
