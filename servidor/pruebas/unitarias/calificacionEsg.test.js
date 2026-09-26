import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  determinarNivelDesempeno,
  calcularPuntajes,
  calcularVisibilidad
} from '../../src/servicios/servicioCalificacion.js';

describe('Motor de Calificacion ESG - Niveles de Desempeno', () => {
  it('asigna nivel Avanzado para puntajes iguales o mayores a 75', () => {
    assert.equal(determinarNivelDesempeno(100), 'Avanzado');
    assert.equal(determinarNivelDesempeno(85), 'Avanzado');
    assert.equal(determinarNivelDesempeno(75), 'Avanzado');
  });

  it('asigna nivel Intermedio para puntajes entre 60 y 74 inclusive', () => {
    assert.equal(determinarNivelDesempeno(74), 'Intermedio');
    assert.equal(determinarNivelDesempeno(65), 'Intermedio');
    assert.equal(determinarNivelDesempeno(60), 'Intermedio');
  });

  it('asigna nivel Inicial para puntajes inferiores a 60', () => {
    assert.equal(determinarNivelDesempeno(59), 'Inicial');
    assert.equal(determinarNivelDesempeno(35), 'Inicial');
    assert.equal(determinarNivelDesempeno(0), 'Inicial');
  });
});

describe('Motor de Calificacion ESG - Calculo de Puntajes Ponderados', () => {
  const dimensionesOficiales = [
    { idDimension: 1, codigo: 'AMB', nombre: 'Ambiental', peso: 0.25 },
    { idDimension: 2, codigo: 'SOC', nombre: 'Social', peso: 0.20 },
    { idDimension: 3, codigo: 'ETI', nombre: 'Etica', peso: 0.25 },
    { idDimension: 4, codigo: 'LAB', nombre: 'Laboral', peso: 0.20 },
    { idDimension: 5, codigo: 'CAD', nombre: 'Cadena de Suministro', peso: 0.10 }
  ];

  it('calcula puntaje perfecto de 100 cuando todas las alternativas tienen 100 puntos', () => {
    const items = dimensionesOficiales.map((d, index) => ({
      idItem: index + 1,
      idDimension: d.idDimension,
      puntajeAlternativa: 100,
      peso: 1
    }));

    const resultado = calcularPuntajes(items, dimensionesOficiales);
    assert.equal(resultado.puntajeTotal, 100);
    assert.equal(resultado.dimensiones.length, 5);
    resultado.dimensiones.forEach((dim) => {
      assert.equal(dim.puntaje, 100);
    });
  });

  it('calcula puntaje minimo de 0 cuando todas las alternativas tienen 0 puntos', () => {
    const items = dimensionesOficiales.map((d, index) => ({
      idItem: index + 1,
      idDimension: d.idDimension,
      puntajeAlternativa: 0,
      peso: 1
    }));

    const resultado = calcularPuntajes(items, dimensionesOficiales);
    assert.equal(resultado.puntajeTotal, 0);
  });

  it('calcula correctamente ponderaciones distintas entre items de una misma dimension', () => {
    const items = [
      { idItem: 101, idDimension: 1, puntajeAlternativa: 100, peso: 2 },
      { idItem: 102, idDimension: 1, puntajeAlternativa: 40, peso: 1 }
    ];

    const resultado = calcularPuntajes(items, [dimensionesOficiales[0]]);
    assert.equal(resultado.dimensiones[0].puntaje, 80);
    assert.equal(resultado.puntajeTotal, 80);
  });

  it('omite dimensiones sin respuestas sin penalizarlas con cero', () => {
    const items = [
      { idItem: 201, idDimension: 1, puntajeAlternativa: 80, peso: 1 },
      { idItem: 202, idDimension: 2, puntajeAlternativa: 60, peso: 1 }
    ];

    const resultado = calcularPuntajes(items, dimensionesOficiales);
    assert.equal(resultado.dimensiones.length, 2);
    assert.equal(resultado.puntajeTotal, 71);
  });

  it('devuelve puntajeTotal nulo si no se proporciona ningun item respondido', () => {
    const resultado = calcularPuntajes([], dimensionesOficiales);
    assert.equal(resultado.puntajeTotal, null);
    assert.deepEqual(resultado.dimensiones, []);
  });
});

describe('Motor de Calificacion ESG - Reglas Condicionales y Visibilidad', () => {
  it('mantiene visible y habilitado un item que no tiene reglas asociadas', () => {
    const items = [{ idItem: 10 }];
    const reglas = [];
    const respuestas = {};

    const visibilidad = calcularVisibilidad(items, reglas, respuestas);
    assert.deepEqual(visibilidad[10], { visible: true, deshabilitado: false });
  });

  it('oculta por defecto un item condicionado a mostrar hasta que se dispare la regla', () => {
    const items = [{ idItem: 20 }];
    const reglas = [
      { idItemDestino: 20, idItemOrigen: 5, idAlternativaDisparadora: 501, accion: 'mostrar' }
    ];

    const visibilidadInicial = calcularVisibilidad(items, reglas, {});
    assert.equal(visibilidadInicial[20].visible, false);

    const visibilidadDisparada = calcularVisibilidad(items, reglas, { 5: 501 });
    assert.equal(visibilidadDisparada[20].visible, true);
  });

  it('oculta un item cuando la regla disparadora de ocultamiento coincide con la respuesta', () => {
    const items = [{ idItem: 30 }];
    const reglas = [
      { idItemDestino: 30, idItemOrigen: 8, idAlternativaDisparadora: 802, accion: 'ocultar' }
    ];

    const visibilidadSinDisparar = calcularVisibilidad(items, reglas, { 8: 801 });
    assert.equal(visibilidadSinDisparar[30].visible, true);

    const visibilidadDisparada = calcularVisibilidad(items, reglas, { 8: 802 });
    assert.equal(visibilidadDisparada[30].visible, false);
  });

  it('deshabilita un item cuando la regla disparadora es de tipo deshabilitar', () => {
    const items = [{ idItem: 40 }];
    const reglas = [
      { idItemDestino: 40, idItemOrigen: 9, idAlternativaDisparadora: 901, accion: 'deshabilitar' }
    ];

    const visibilidadDisparada = calcularVisibilidad(items, reglas, { 9: 901 });
    assert.equal(visibilidadDisparada[40].deshabilitado, true);
    assert.equal(visibilidadDisparada[40].visible, true);
  });
});
