import { descifrarContenido } from './servicioCifradoBackup.js';

export async function restaurarAPuntoEnElTiempo({
  clienteDestino,
  paqueteBackupBaseCifrado,
  listaPaquetesJournalCifrados = [],
  tiempoObjetivoIso,
  claveCifrado
}) {
  if (!clienteDestino) {
    throw new Error('El cliente de base de datos destino es obligatorio.');
  }
  if (!paqueteBackupBaseCifrado) {
    throw new Error('El paquete de respaldo base cifrado es obligatorio.');
  }
  if (!tiempoObjetivoIso) {
    throw new Error('El tiempo objetivo (timestamp) es obligatorio.');
  }

  const marcaTiempoObjetivo = new Date(tiempoObjetivoIso);
  if (isNaN(marcaTiempoObjetivo.getTime())) {
    throw new Error(`Marca de tiempo objetivo inválida: ${tiempoObjetivoIso}`);
  }

  const contenidoSqlBase = descifrarContenido(paqueteBackupBaseCifrado, claveCifrado).toString('utf8');
  await clienteDestino.query(contenidoSqlBase);

  const mapaEventosPorId = new Map();

  for (const paqueteJournal of listaPaquetesJournalCifrados) {
    const jsonJournalTexto = descifrarContenido(paqueteJournal, claveCifrado).toString('utf8');
    const listaEventos = JSON.parse(jsonJournalTexto);
    for (const evento of listaEventos) {
      if (!mapaEventosPorId.has(evento.id_registro)) {
        mapaEventosPorId.set(evento.id_registro, evento);
      }
    }
  }

  const todosEventosDeduplicados = Array.from(mapaEventosPorId.values())
    .sort((a, b) => Number(a.id_registro) - Number(b.id_registro));

  const transaccionesConFechas = new Map();
  for (const ev of todosEventosDeduplicados) {
    const idTx = ev.id_transaccion;
    const fechaEv = new Date(ev.fecha_evento).getTime();
    if (!transaccionesConFechas.has(idTx)) {
      transaccionesConFechas.set(idTx, { minFecha: fechaEv, maxFecha: fechaEv, eventos: [] });
    }
    const infoTx = transaccionesConFechas.get(idTx);
    infoTx.minFecha = Math.min(infoTx.minFecha, fechaEv);
    infoTx.maxFecha = Math.max(infoTx.maxFecha, fechaEv);
    infoTx.eventos.push(ev);
  }

  const eventosAplicables = [];
  const corteMs = marcaTiempoObjetivo.getTime();

  for (const [, infoTx] of transaccionesConFechas.entries()) {
    if (infoTx.maxFecha <= corteMs) {
      for (const ev of infoTx.eventos) {
        eventosAplicables.push(ev);
      }
    }
  }

  eventosAplicables.sort((a, b) => Number(a.id_registro) - Number(b.id_registro));

  await clienteDestino.query('BEGIN;');
  await clienteDestino.query("SET LOCAL sostenibilidad.modo_recuperacion = 'true';");
  await clienteDestino.query('SET CONSTRAINTS ALL DEFERRED;');

  let contadorInsert = 0;
  let contadorUpdate = 0;
  let contadorDelete = 0;
  const conjuntoTablasAfectadas = new Set();

  for (const evento of eventosAplicables) {
    const nombreTabla = evento.nombre_tabla;
    conjuntoTablasAfectadas.add(nombreTabla);

    if (evento.operacion === 'INSERT') {
      const columnas = Object.keys(evento.datos_nuevos);
      const nombresColumnas = columnas.map(c => `"${c}"`).join(', ');
      const marcadores = columnas.map((_, i) => `$${i + 1}`).join(', ');
      const valores = columnas.map(c => evento.datos_nuevos[c]);

      const sqlInsert = `INSERT INTO "${nombreTabla}" (${nombresColumnas}) VALUES (${marcadores}) ON CONFLICT DO NOTHING;`;
      await clienteDestino.query(sqlInsert, valores);
      contadorInsert++;
    } else if (evento.operacion === 'UPDATE') {
      const datosNuevos = evento.datos_nuevos;
      const columnas = Object.keys(datosNuevos);
      const pkObj = evento.clave_primaria;
      const pkCol = Object.keys(pkObj)[0];
      const pkVal = pkObj[pkCol];

      const asignaciones = columnas.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const valores = columnas.map(c => datosNuevos[c]);
      valores.push(pkVal);

      const sqlUpdate = `UPDATE "${nombreTabla}" SET ${asignaciones} WHERE "${pkCol}" = $${valores.length};`;
      await clienteDestino.query(sqlUpdate, valores);
      contadorUpdate++;
    } else if (evento.operacion === 'DELETE') {
      const pkObj = evento.clave_primaria;
      const pkCol = Object.keys(pkObj)[0];
      const pkVal = pkObj[pkCol];

      const sqlDelete = `DELETE FROM "${nombreTabla}" WHERE "${pkCol}" = $1;`;
      await clienteDestino.query(sqlDelete, [pkVal]);
      contadorDelete++;
    }
  }

  for (const tabla of conjuntoTablasAfectadas) {
    try {
      const resSec = await clienteDestino.query(`
        SELECT column_name, pg_get_serial_sequence($1, column_name) as seq
        FROM information_schema.columns
        WHERE table_name = $1 AND pg_get_serial_sequence($1, column_name) IS NOT NULL;
      `, [tabla]);

      for (const fila of resSec.rows) {
        if (fila.seq) {
          await clienteDestino.query(`
            SELECT setval($1, COALESCE((SELECT MAX("${fila.column_name}") FROM "${tabla}"), 1));
          `, [fila.seq]);
        }
      }
    } catch {
      // Ignorar si la tabla no posee secuencias
    }
  }

  await clienteDestino.query('COMMIT;');

  return {
    tiempoObjetivo: marcaTiempoObjetivo.toISOString(),
    eventosTotalesEnJournal: todosEventosDeduplicados.length,
    eventosAplicados: eventosAplicables.length,
    desgloseOperaciones: {
      insert: contadorInsert,
      update: contadorUpdate,
      delete: contadorDelete
    },
    tablasModificadas: Array.from(conjuntoTablasAfectadas)
  };
}
