import { exportarJournal } from './exportarJournal.js';

async function principal() {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - 2 * 60 * 60 * 1000);

  const resultado = await exportarJournal({ desde: desde.toISOString(), hasta: hasta.toISOString(), subirAR2: true });
  console.log('Exportacion de journal completada.');
  console.log('Ventana desde:', resultado.metadatos.ventanaDesde);
  console.log('Ventana hasta:', resultado.metadatos.ventanaHasta);
  console.log('Total eventos:', resultado.metadatos.totalEventos);
  console.log('Tamano cifrado (bytes):', resultado.metadatos.tamanoBytes);
}

principal().catch(err => {
  console.error('Error en exportacion de journal:', err.message);
  process.exit(1);
});
