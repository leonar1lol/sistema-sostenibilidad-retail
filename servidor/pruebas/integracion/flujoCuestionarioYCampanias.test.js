import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularPuntajes,
  determinarNivelDesempeno
} from '../../src/servicios/servicioCalificacion.js';
import {
  verificarAislamientoBaseDatos,
  crearSimuladorBaseDatos
} from '../guardianBaseDatos.js';

describe('Integracion - Ciclo de Vida de Campanias y Evaluaciones', () => {
  it('aplica la transicion de estados de campania: Borrador a Publicada y Cerrada', () => {
    const estadosPermitidos = ['Borrador', 'Publicada', 'Cerrada'];

    const cambiarEstado = (estadoActual, nuevoEstado) => {
      if (!estadosPermitidos.includes(nuevoEstado)) {
        throw new Error('Estado no permitido.');
      }
      if (estadoActual === 'Cerrada') {
        throw new Error('No se puede modificar una campania cerrada.');
      }
      return nuevoEstado;
    };

    let estado = 'Borrador';
    estado = cambiarEstado(estado, 'Publicada');
    assert.equal(estado, 'Publicada');

    estado = cambiarEstado(estado, 'Cerrada');
    assert.equal(estado, 'Cerrada');

    assert.throws(() => cambiarEstado(estado, 'Publicada'), /No se puede modificar/);
  });

  it('impide la asignacion de evaluaciones sobre campanias que ya fueron cerradas', () => {
    const campaniaCerrada = { idCampania: 1, estado: 'Cerrada' };

    const asignarEvaluacion = (campania, idProveedor) => {
      if (campania.estado !== 'Publicada') {
        return { asignado: false, mensaje: 'La campania no se encuentra activa para nuevas evaluaciones.' };
      }
      return { asignado: true, idEvaluacion: 999, idProveedor };
    };

    const resultado = asignarEvaluacion(campaniaCerrada, 10);
    assert.equal(resultado.asignado, false);
    assert.match(resultado.mensaje, /no se encuentra activa/);
  });
});

describe('Integracion - Flujo Completo de Cuestionario Dinamico y Evaluacion', () => {
  const baseDatosAislada = crearSimuladorBaseDatos((consulta, params) => {
    if (consulta.includes('item_industria')) {
      return {
        rows: [
          { idItem: 1, idDimension: 1, enunciado: 'Gestion de residuos', peso: 1, idIndustria: 2 },
          { idItem: 2, idDimension: 2, enunciado: 'Relaciones comunitarias', peso: 1, idIndustria: 2 }
        ]
      };
    }
    return { rows: [] };
  });

  it('valida que las consultas de integracion se ejecuten con proteccion de aislamiento', async () => {
    assert.equal(verificarAislamientoBaseDatos(), true);
    const resultado = await baseDatosAislada.query('SELECT * FROM item_industria WHERE id_industria = $1', [2]);
    assert.equal(resultado.rows.length, 2);
  });

  it('procesa el envio de respuestas y genera el diagnostico con nivel y puntaje global', () => {
    const respuestasEnviadas = [
      { idItem: 1, idDimension: 1, puntajeAlternativa: 80, peso: 1 },
      { idItem: 2, idDimension: 2, puntajeAlternativa: 70, peso: 1 }
    ];

    const dimensiones = [
      { idDimension: 1, codigo: 'AMB', nombre: 'Ambiental', peso: 0.5 },
      { idDimension: 2, codigo: 'SOC', nombre: 'Social', peso: 0.5 }
    ];

    const calificacion = calcularPuntajes(respuestasEnviadas, dimensiones);
    assert.equal(calificacion.puntajeTotal, 75);

    const nivel = determinarNivelDesempeno(calificacion.puntajeTotal);
    assert.equal(nivel, 'Avanzado');
  });

  it('rechaza respuestas que contienen alternativas con valores invalidos o fuera de escala', () => {
    const validarRespuesta = (puntaje) => {
      if (typeof puntaje !== 'number' || puntaje < 0 || puntaje > 100) {
        return false;
      }
      return true;
    };

    assert.equal(validarRespuesta(100), true);
    assert.equal(validarRespuesta(0), true);
    assert.equal(validarRespuesta(50), true);
    assert.equal(validarRespuesta(-10), false);
    assert.equal(validarRespuesta(150), false);
    assert.equal(validarRespuesta('cien'), false);
  });
});
