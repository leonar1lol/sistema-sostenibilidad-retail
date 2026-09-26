import { ejecutarBackupDiario } from './crearBackupDiario.js';

async function principal() {
  const resultado = await ejecutarBackupDiario();
  console.log('Backup diario generado con éxito para artefacto de GitHub Actions.');
  console.log('Directorio de salida:', resultado.directorioSalida);
  console.log('Snapshot MVCC:', resultado.snapshotMvcc);
  console.log('Tamaño cifrado (bytes):', resultado.tamanoBytes);
  console.log('SHA-256 del dump cifrado:', resultado.manifest.sha256DumpCifrado);
  console.log('Fecha backup:', resultado.manifest.fechaBackup);
}

principal().catch(err => {
  console.error('Error durante la generación del backup diario:', err.message);
  process.exit(1);
});
