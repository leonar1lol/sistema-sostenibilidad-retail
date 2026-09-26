import { ejecutarBackupDiario } from './crearBackupDiario.js';
import { eliminarObjetosVencidos } from './clienteR2Backup.js';

async function principal() {
  const resultado = await ejecutarBackupDiario({ subirAR2: true });
  console.log('Backup diario completado.');
  console.log('Snapshot MVCC:', resultado.snapshotMvcc);
  console.log('Tamano cifrado (bytes):', resultado.tamanoBytes);
  console.log('Fecha backup:', resultado.manifest.fechaBackup);

  const purga = await eliminarObjetosVencidos(9);
  console.log(`Purga completada. Objetos eliminados: ${purga.eliminados}`);
}

principal().catch(err => {
  console.error('Error en backup diario:', err.message);
  process.exit(1);
});
