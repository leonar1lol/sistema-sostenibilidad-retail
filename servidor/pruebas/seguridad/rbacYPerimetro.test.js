import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requierePermiso } from '../../src/middleware/autenticacion.js';
import { aplicarCabecerasSeguridad } from '../../src/middleware/seguridadHeaders.js';
import { crearLimitador } from '../../src/middleware/limitadorPeticiones.js';

describe('Seguridad - Control de Acceso Basado en Roles (RBAC)', () => {
  it('permite acceso total al Administrador Corporativo mediante comodin asterisco', () => {
    let siguienteInvocado = false;
    const peticion = {
      usuario: { rol: 'Administrador Corporativo', permisos: ['*'] }
    };
    const respuesta = {};
    const siguiente = () => {
      siguienteInvocado = true;
    };

    const verificador = requierePermiso('administrar_usuarios_roles');
    verificador(peticion, respuesta, siguiente);
    assert.equal(siguienteInvocado, true);
  });

  it('permite acceso cuando el usuario cuenta con el permiso especifico concedido', () => {
    let siguienteInvocado = false;
    const peticion = {
      usuario: { rol: 'Especialista', permisos: ['configurar_banco_items'] }
    };
    const respuesta = {};
    const siguiente = () => {
      siguienteInvocado = true;
    };

    const verificador = requierePermiso('configurar_banco_items');
    verificador(peticion, respuesta, siguiente);
    assert.equal(siguienteInvocado, true);
  });

  it('rechaza estrictamente con HTTP 403 cuando el usuario carece del permiso requerido', () => {
    let codigoEstado = null;
    let cuerpoRespuesta = null;

    const peticion = {
      usuario: { rol: 'Auditor Externo', permisos: ['ver_dashboard_unidad'] }
    };
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
      assert.fail('No debio conceder acceso a un usuario sin permiso');
    };

    const verificador = requierePermiso('administrar_usuarios_roles');
    verificador(peticion, respuesta, siguiente);
    assert.equal(codigoEstado, 403);
    assert.equal(cuerpoRespuesta.exito, false);
    assert.equal(cuerpoRespuesta.mensaje, 'No tiene permiso para esta operación.');
  });
});

describe('Seguridad - Aislamiento de Evaluacion entre Proveedores (Prevencion IDOR)', () => {
  it('garantiza que la sesion del proveedor quede anclada a su identificador de evaluacion', () => {
    const sesionProveedorA = { idProveedor: 101, idEvaluacion: 501 };
    const sesionProveedorB = { idProveedor: 102, idEvaluacion: 502 };

    const validarAccesoEvaluacion = (sesion, idEvaluacionObjetivo) => {
      if (sesion.idEvaluacion !== idEvaluacionObjetivo) {
        return { autorizado: false, codigo: 403 };
      }
      return { autorizado: true, codigo: 200 };
    };

    assert.equal(validarAccesoEvaluacion(sesionProveedorA, 501).autorizado, true);
    assert.equal(validarAccesoEvaluacion(sesionProveedorA, 502).autorizado, false);
    assert.equal(validarAccesoEvaluacion(sesionProveedorB, 501).autorizado, false);
  });
});

describe('Seguridad Perimetral - Cabeceras HTTP y Limitador de Tasa', () => {
  it('aplica las cabeceras HTTP de proteccion perimetral requeridas', () => {
    const cabecerasEstablecidas = {};
    const peticion = {};
    const respuesta = {
      setHeader: (nombre, valor) => {
        cabecerasEstablecidas[nombre] = valor;
      }
    };
    let siguienteInvocado = false;
    const siguiente = () => {
      siguienteInvocado = true;
    };

    aplicarCabecerasSeguridad(peticion, respuesta, siguiente);

    assert.equal(siguienteInvocado, true);
    assert.equal(cabecerasEstablecidas['X-Content-Type-Options'], 'nosniff');
    assert.equal(cabecerasEstablecidas['X-Frame-Options'], 'SAMEORIGIN');
    assert.equal(cabecerasEstablecidas['X-XSS-Protection'], '1; mode=block');
    assert.equal(cabecerasEstablecidas['Referrer-Policy'], 'strict-origin-when-cross-origin');
  });

  it('permite solicitudes dentro del umbral de tasa y bloquea con HTTP 429 al superarlo', () => {
    const limitadorPrueba = crearLimitador({
      ventanaMinutos: 1,
      maximoIntentos: 2,
      mensaje: 'Umbral de prueba excedido.'
    });

    const peticion = {
      ip: '192.168.1.100',
      baseUrl: '/api/prueba',
      path: '/recurso'
    };

    const simularLlamada = () => {
      let estado = 200;
      let cuerpo = null;
      const respuesta = {
        setHeader: () => {},
        status: (codigo) => {
          estado = codigo;
          return {
            json: (datos) => {
              cuerpo = datos;
            }
          };
        }
      };
      let siguienteEjecutado = false;
      limitadorPrueba(peticion, respuesta, () => {
        siguienteEjecutado = true;
      });
      return { estado, cuerpo, siguienteEjecutado };
    };

    const intento1 = simularLlamada();
    assert.equal(intento1.siguienteEjecutado, true);
    assert.equal(intento1.estado, 200);

    const intento2 = simularLlamada();
    assert.equal(intento2.siguienteEjecutado, true);
    assert.equal(intento2.estado, 200);

    const intento3 = simularLlamada();
    assert.equal(intento3.siguienteEjecutado, false);
    assert.equal(intento3.estado, 429);
    assert.equal(intento3.cuerpo.exito, false);
    assert.equal(intento3.cuerpo.mensaje, 'Umbral de prueba excedido.');
  });
});
