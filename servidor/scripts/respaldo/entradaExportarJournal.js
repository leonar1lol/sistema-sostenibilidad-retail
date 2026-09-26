import { exportarJournal } from './exportarJournal.js';

async function principal() {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - 2 * 60 * 60 * 1000);

  const resultado = await exportarJournal({ desde: desde.toISOString(), hasta: hasta.toISOString() });
  console.log('Exportación de journal generada con éxito para artefacto de GitHub Actions.');
  console.log('Directorio de salida:', resultado.directorioSalida);
  console.log('Ventana desde:', resultado.metadatos.ventanaDesde);
  console.log('Ventana hasta:', resultado.metadatos.ventanaHasta);
  console.log('Total eventos:', resultado.metadatos.totalEventos);
  console.log('Tamaño cifrado (bytes):', resultado.tamanoBytes);
  console.log('SHA-256 del journal cifrado:', resultado.metadatos.sha256JournalCifrado);
}

principal().catch(err => {
  console.error('Error durante la exportación del journal:', err.message);
  process.exit(1);
});
