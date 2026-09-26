import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Requerimiento RNF02 / RF09 - Validacion y Vigencia de Codigo OTP', () => {
  const LIMITE_VIGENCIA_MINUTOS = 10;

  const validarCodigoOtpLogica = ({
    valorIngresado,
    valorAlmacenado,
    usado,
    fechaCreacion,
    ahora = new Date()
  }) => {
    if (!valorIngresado || valorIngresado !== valorAlmacenado) {
      return { valido: false, mensaje: 'Codigo de acceso incorrecto.' };
    }

    if (usado) {
      return { valido: false, mensaje: 'El codigo ya fue utilizado previamente.' };
    }

    const diferenciaMinutos = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60);
    if (diferenciaMinutos > LIMITE_VIGENCIA_MINUTOS) {
      return { valido: false, mensaje: 'El codigo ha expirado (vigencia maxima 10 minutos).' };
    }

    return { valido: true, mensaje: 'Acceso autorizado.' };
  };

  it('permite el acceso con un OTP valido ingresado dentro de los 10 minutos de vigencia', () => {
    const fechaCreacion = new Date();
    const ahora = new Date(fechaCreacion.getTime() + 4 * 60 * 1000);

    const resultado = validarCodigoOtpLogica({
      valorIngresado: '482910',
      valorAlmacenado: '482910',
      usado: false,
      fechaCreacion,
      ahora
    });

    assert.equal(resultado.valido, true);
    assert.equal(resultado.mensaje, 'Acceso autorizado.');
  });

  it('rechaza con error si el valor del OTP ingresado es incorrecto', () => {
    const fechaCreacion = new Date();

    const resultado = validarCodigoOtpLogica({
      valorIngresado: '000000',
      valorAlmacenado: '482910',
      usado: false,
      fechaCreacion
    });

    assert.equal(resultado.valido, false);
    assert.equal(resultado.mensaje, 'Codigo de acceso incorrecto.');
  });

  it('rechaza estrictamente con error si el OTP expiro despues de 10 minutos (RNF02)', () => {
    const fechaCreacion = new Date();
    const ahoraExpirado = new Date(fechaCreacion.getTime() + 11 * 60 * 1000);

    const resultado = validarCodigoOtpLogica({
      valorIngresado: '482910',
      valorAlmacenado: '482910',
      usado: false,
      fechaCreacion,
      ahora: ahoraExpirado
    });

    assert.equal(resultado.valido, false);
    assert.match(resultado.mensaje, /ha expirado/);
  });

  it('rechaza con error si el OTP ya fue utilizado en un inicio de sesion previo (un solo uso)', () => {
    const fechaCreacion = new Date();

    const resultado = validarCodigoOtpLogica({
      valorIngresado: '482910',
      valorAlmacenado: '482910',
      usado: true,
      fechaCreacion
    });

    assert.equal(resultado.valido, false);
    assert.match(resultado.mensaje, /ya fue utilizado/);
  });
});
