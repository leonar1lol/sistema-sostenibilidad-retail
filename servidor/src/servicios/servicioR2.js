import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const clienteR2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const NOMBRE_BUCKET = process.env.R2_BUCKET_NAME;

const tieneConfiguracionR2 = () => {
  return Boolean(
    NOMBRE_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT
  );
};

export const subirArchivoR2 = async (clave, buffer, tipoMime, entorno = process.env.NODE_ENV) => {
  if (!tieneConfiguracionR2()) {
    if (entorno === 'production') {
      throw new Error('Configuración de Cloudflare R2 no disponible o incompleta.');
    }
    return;
  }
  await clienteR2.send(new PutObjectCommand({
    Bucket: NOMBRE_BUCKET,
    Key: clave,
    Body: buffer,
    ContentType: tipoMime
  }));
};

export const eliminarArchivoR2 = async (clave, entorno = process.env.NODE_ENV) => {
  if (!tieneConfiguracionR2()) {
    if (entorno === 'production') {
      throw new Error('Configuración de Cloudflare R2 no disponible o incompleta.');
    }
    return;
  }
  await clienteR2.send(new DeleteObjectCommand({ Bucket: NOMBRE_BUCKET, Key: clave }));
};

export const generarUrlDescargaR2 = async (clave, nombreArchivo, entorno = process.env.NODE_ENV) => {
  if (!tieneConfiguracionR2()) {
    if (entorno === 'production') {
      throw new Error('Configuración de Cloudflare R2 no disponible o incompleta.');
    }
    return `https://almacenamiento.local/${clave}`;
  }
  const comando = new GetObjectCommand({
    Bucket: NOMBRE_BUCKET,
    Key: clave,
    ResponseContentDisposition: `attachment; filename="${nombreArchivo}"`
  });
  return getSignedUrl(clienteR2, comando, { expiresIn: 300 });
};

export const servicioR2 = {
  subirArchivoR2,
  eliminarArchivoR2,
  generarUrlDescargaR2
};
