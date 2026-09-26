import { eliminarObjetosVencidos } from './clienteR2Backup.js';

async function principal() {
  console.log('Aviso: entradaPurgaBackup.js pertenece al backend alternativo de Cloudflare R2 (no utilizado en la arquitectura oficial de GitHub Artifacts con retention-days: 9).');
  const purga = await eliminarObjetosVencidos(9);
  console.log(`Purga de backups R2 vencidos completada. Total de objetos eliminados: ${purga.eliminados}`);
  if (purga.claves.length > 0) {
    console.log('Claves purgadas:', purga.claves.join(', '));
  }
}

principal().catch(err => {
  console.error('Error durante la purga de backups R2:', err.message);
  process.exit(1);
});
