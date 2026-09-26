import { eliminarObjetosVencidos } from './clienteR2Backup.js';

async function principal() {
  const purga = await eliminarObjetosVencidos(9);
  console.log(`Purga de backups vencidos completada. Total de objetos eliminados: ${purga.eliminados}`);
  if (purga.claves.length > 0) {
    console.log('Claves purgadas:', purga.claves.join(', '));
  }
}

principal().catch(err => {
  console.error('Error durante la purga de backups vencidos:', err.message);
  process.exit(1);
});
