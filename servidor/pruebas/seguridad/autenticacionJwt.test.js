import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { verificarSesion, requierePermiso } from '../../src/middleware/autenticacion.js';
import {
  verificarSesionProveedor,
  requiereEvaluacionAsignada
} from '../../src/middleware/autenticacionProveedor.js';
import {
  verificarAislamientoBaseDatos
} from '../guardianBaseDatos.js';

const CLAVE_PRUEBAS = 'clave_criptografica_aislada_para_pruebas_unitarias_2026';

describe('Seguridad - Guardian de Aislamiento de Base de Datos', () => {
  it('permite ejecucion segura cuando no hay colision con base operativa', () => {
    process.env.URL_BASE_DATOS_TEST = 'postgresql://usuario:clave@localhost:5432/bd_pruebas';
    assert.equal(verificarAislamientoBaseDatos(), true);
  });

  it('activa bloqueo fail-fast si URL_BASE_DATOS_TEST es identica a la operativa', () => {
    const urlOriginalTest = process.env.URL_BASE_DATOS_TEST;
    const urlOperativa = process.env.URL_BASE_DATOS || 'postgresql://usuario:clave@host-operativo.neon.tech/neondb';
    process.env.URL_BASE_DATOS = urlOperativa;
    process.env.URL_BASE_DATOS_TEST = urlOperativa;

    assert.throws(
      () => verificarAislamientoBaseDatos(),
      /BLOQUEO DE SEGURIDAD CRITICO/
    );

    process.env.URL_BASE_DATOS_TEST = urlOriginalTest;
  });

  it('activa bloqueo fail-fast si URL_BASE_DATOS_TEST contiene el mismo host operativo', () => {
    const urlOriginalTest = process.env.URL_BASE_DATOS_TEST;
    const urlOperativa = process.env.URL_BASE_DATOS || 'postgresql://usuario:clave@host-operativo.neon.tech/neondb';
    process.env.URL_BASE_DATOS = urlOperativa;
    process.env.URL_BASE_DATOS_TEST = 'postgresql://otro_usuario:otra_clave@host-operativo.neon.tech/otra_bd';

    assert.throws(
      () => verificarAislamientoBaseDatos(),
      /apunta al mismo host de base de datos operativa/
    );

    process.env.URL_BASE_DATOS_TEST = urlOriginalTest;
  });
});

describe('Seguridad - Autenticacion JWT Corporativa', () => {
  const claveOriginal = process.env.CLAVE_SECRETA_JWT;

  it('rechaza con codigo 401 si no se proporciona cabecera de sesion', () => {
    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const peticion = { headers: {} };
    const respuesta = {
      status: (codigo) => {
        codigoEstado = codigo;
        return {
          json: (datos) => {
            cuerpoRespuesta = datos;
          }
        };
      }
    };
    const siguiente = () => {
      assert.fail('No debio invocar siguiente()');
    };

    verificarSesion(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 401);
    assert.equal(cuerpoRespuesta.exito, false);
    assert.equal(cuerpoRespuesta.mensaje, 'Sesión no proporcionada.');
  });

  it('rechaza con codigo 401 ante un token con firma invalida o adulterada', () => {
    process.env.CLAVE_SECRETA_JWT = CLAVE_PRUEBAS;

    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const tokenFalso = jwt.sign({ idUsuario: 99 }, 'otra_clave_diferente');
    const peticion = { headers: { authorization: `Bearer ${tokenFalso}` } };
    const respuesta = {
      status: (codigo) => {
        codigoEstado = codigo;
        return {
          json: (datos) => {
            cuerpoRespuesta = datos;
          }
        };
      }
    };
    const siguiente = () => {
      assert.fail('No debio invocar siguiente()');
    };

    verificarSesion(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 401);
    assert.equal(cuerpoRespuesta.exito, false);
    assert.equal(cuerpoRespuesta.mensaje, 'Sesión inválida o expirada.');
  });

  it('rechaza estrictamente con codigo 401 ante un token expirado sin bypass', () => {
    process.env.CLAVE_SECRETA_JWT = CLAVE_PRUEBAS;

    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const tokenExpirado = jwt.sign(
      { idUsuario: 1, correo: 'admin@intercorpretail.pe' },
      CLAVE_PRUEBAS,
      { expiresIn: '-1s' }
    );

    const peticion = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const respuesta = {
      status: (codigo) => {
        codigoEstado = codigo;
        return {
          json: (datos) => {
            cuerpoRespuesta = datos;
          }
        };
      }
    };
    const siguiente = () => {
      assert.fail('No debio permitir el acceso con token vencido');
    };

    verificarSesion(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 401);
    assert.equal(cuerpoRespuesta.exito, false);
    assert.equal(cuerpoRespuesta.mensaje, 'Sesión inválida o expirada.');
  });

  it('permite el paso e inyecta la identidad del usuario cuando el token es valido', () => {
    process.env.CLAVE_SECRETA_JWT = CLAVE_PRUEBAS;

    let siguienteInvocado = false;
    const datosUsuario = { idUsuario: 5, nombre: 'Analista ESG', rol: 'Analista de Unidad de Negocio' };
    const tokenValido = jwt.sign(datosUsuario, CLAVE_PRUEBAS, { expiresIn: '1h' });

    const peticion = { headers: { authorization: `Bearer ${tokenValido}` } };
    const respuesta = {};
    const siguiente = () => {
      siguienteInvocado = true;
    };

    verificarSesion(peticion, respuesta, siguiente);
    assert.equal(siguienteInvocado, true);
    assert.equal(peticion.usuario.idUsuario, 5);
    assert.equal(peticion.usuario.rol, 'Analista de Unidad de Negocio');
  });

  it('restaura la variable de entorno original', () => {
    process.env.CLAVE_SECRETA_JWT = claveOriginal;
  });
});

describe('Seguridad - Autenticacion de Proveedor (Portal Passwordless)', () => {
  const claveOriginal = process.env.CLAVE_SECRETA_JWT;

  it('rechaza tokens corporativos utilizados indebidamente en el portal del proveedor', () => {
    process.env.CLAVE_SECRETA_JWT = CLAVE_PRUEBAS;

    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const tokenCorporativo = jwt.sign(
      { idUsuario: 1, tipo: 'corporativo' },
      CLAVE_PRUEBAS,
      { expiresIn: '1h' }
    );

    const peticion = { headers: { authorization: `Bearer ${tokenCorporativo}` } };
    const respuesta = {
      status: (codigo) => {
        codigoEstado = codigo;
        return {
          json: (datos) => {
            cuerpoRespuesta = datos;
          }
        };
      }
    };
    const siguiente = () => {
      assert.fail('No debio permitir token no clasificado como proveedor');
    };

    verificarSesionProveedor(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 401);
    assert.equal(cuerpoRespuesta.mensaje, 'Sesión inválida.');
  });

  it('bloquea con HTTP 403 a proveedores que no cuentan con evaluacion asignada', () => {
    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const peticion = { sesionProveedor: { idProveedor: 10 } };
    const respuesta = {
      status: (codigo) => {
        codigoEstado = codigo;
        return {
          json: (datos) => {
            cuerpoRespuesta = datos;
          }
        };
      }
    };
    const siguiente = () => {
      assert.fail('No debio continuar sin evaluacion asignada');
    };

    requiereEvaluacionAsignada(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 403);
    assert.equal(cuerpoRespuesta.mensaje, 'Debe completar el registro antes de continuar.');
  });

  it('permite el paso a proveedores con evaluacion formalmente asignada', () => {
    let siguienteInvocado = false;
    const peticion = { sesionProveedor: { idProveedor: 10, idEvaluacion: 55 } };
    const respuesta = {};
    const siguiente = () => {
      siguienteInvocado = true;
    };

    requiereEvaluacionAsignada(peticion, respuesta, siguiente);
    assert.equal(siguienteInvocado, true);
  });

  it('restaura la variable de entorno original', () => {
    process.env.CLAVE_SECRETA_JWT = claveOriginal;
  });
});
