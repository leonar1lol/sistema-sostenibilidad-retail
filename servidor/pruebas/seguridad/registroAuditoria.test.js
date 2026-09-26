import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { registrarAuditoria } from '../../src/servicios/servicioAuditoria.js';
import { servicioR2 } from '../../src/servicios/servicioR2.js';
import {
  obtenerRegistrosAuditoria,
  registrarAccionAuditoria
} from '../../src/controladores/controladorAuditoria.js';
import {
  verificarAcceso,
  registrarProveedor,
  guardarRespuesta,
  finalizarEvaluacion
} from '../../src/controladores/controladorPortal.js';
import {
  subirEvidenciaPortal,
  eliminarEvidenciaPortal
} from '../../src/controladores/controladorEvidencia.js';
import { requierePermiso } from '../../src/middleware/autenticacion.js';
import { grupoConexiones } from '../../src/configuracion/baseDatos.js';
import { verificarAislamientoBaseDatos } from '../guardianBaseDatos.js';

const crearRespuestaSimulada = () => {
  let codigoEstado = null;
  let cuerpoJson = null;
  const respuesta = {
    status: (codigo) => {
      codigoEstado = codigo;
      return respuesta;
    },
    json: (datos) => {
      cuerpoJson = datos;
      return respuesta;
    }
  };
  return {
    respuesta,
    obtenerCodigo: () => codigoEstado,
    obtenerCuerpo: () => cuerpoJson
  };
};

describe('Auditoria y Trazabilidad - RF16 y RNF08', () => {
  it('AUD-01: Una operacion auditable invoca correctamente el servicio de auditoria', async () => {
    verificarAislamientoBaseDatos();

    let consultaEjecutada = null;
    let parametrosEjecutados = null;

    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql, params) => {
      consultaEjecutada = sql;
      parametrosEjecutados = params;
      return { rows: [], rowCount: 1 };
    });

    try {
      await registrarAuditoria({
        idUsuario: 10,
        idEvaluacion: 5,
        accion: 'Modificacion de parametros en el banco de items'
      });

      assert.equal(mockConsulta.mock.callCount(), 1);
      assert.match(consultaEjecutada, /INSERT INTO auditoria/i);
      assert.deepEqual(parametrosEjecutados, [
        10,
        5,
        'Modificacion de parametros en el banco de items'
      ]);
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-02: El registro contiene identificacion del usuario o valor nulo para eventos publicos', async () => {
    verificarAislamientoBaseDatos();

    const llamadas = [];
    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql, params) => {
      llamadas.push({ sql, params });
      return { rows: [], rowCount: 1 };
    });

    try {
      await registrarAuditoria({
        idUsuario: 88,
        accion: 'Creacion de usuario corporativo'
      });

      await registrarAuditoria({
        idEvaluacion: 120,
        accion: 'Finalizo su evaluacion en el portal del proveedor'
      });

      assert.equal(llamadas.length, 2);
      assert.equal(llamadas[0].params[0], 88);
      assert.equal(llamadas[0].params[1], null);
      assert.equal(llamadas[1].params[0], null);
      assert.equal(llamadas[1].params[1], 120);
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-03: El registro contiene la accion ejecutada y valida obligatoriedad en endpoint', async () => {
    verificarAislamientoBaseDatos();

    const resInvalida = crearRespuestaSimulada();
    const peticionInvalida = {
      body: {},
      usuario: { idUsuario: 1 }
    };

    await registrarAccionAuditoria(peticionInvalida, resInvalida.respuesta);
    assert.equal(resInvalida.obtenerCodigo(), 400);
    assert.equal(resInvalida.obtenerCuerpo().exito, false);
    assert.equal(resInvalida.obtenerCuerpo().mensaje, 'La acción es requerida.');

    let consultaRegistrada = null;
    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql, params) => {
      consultaRegistrada = { sql, params };
      return { rows: [], rowCount: 1 };
    });

    try {
      const resValida = crearRespuestaSimulada();
      const peticionValida = {
        body: { accion: 'Exportacion de reporte REP-01 en Excel', idEvaluacion: 14 },
        usuario: { idUsuario: 2 }
      };

      await registrarAccionAuditoria(peticionValida, resValida.respuesta);
      assert.equal(resValida.obtenerCodigo(), 201);
      assert.equal(resValida.obtenerCuerpo().exito, true);
      assert.equal(consultaRegistrada.params[2], 'Exportacion de reporte REP-01 en Excel');
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-04: Delega la marca temporal centralizada a PostgreSQL sin desfases de cliente', async () => {
    verificarAislamientoBaseDatos();

    let sqlCapturado = null;
    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql) => {
      sqlCapturado = sql;
      return { rows: [], rowCount: 1 };
    });

    try {
      await registrarAuditoria({
        idUsuario: 3,
        accion: 'Cierre formal de periodo de evaluacion'
      });

      assert.doesNotMatch(sqlCapturado, /VALUES\s*\([^)]*fecha/i);
      assert.match(sqlCapturado, /INSERT INTO auditoria \(id_usuario, id_evaluacion, accion\)/i);
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-05: Ante error en la insercion de auditoria aplica politica fail-close devolviendo HTTP 500', async () => {
    verificarAislamientoBaseDatos();

    const mockConsulta = mock.method(grupoConexiones, 'query', async () => {
      throw new Error('Fallo de comunicacion simulado con Neon PostgreSQL');
    });

    try {
      await assert.rejects(
        async () => {
          await registrarAuditoria({ idUsuario: 1, accion: 'Prueba de contingencia' });
        },
        /Fallo de comunicacion/
      );

      const simRes = crearRespuestaSimulada();
      const peticion = {
        body: { accion: 'Intento de registro con base inaccesible' },
        usuario: { idUsuario: 1 }
      };

      await registrarAccionAuditoria(peticion, simRes.respuesta);
      assert.equal(simRes.obtenerCodigo(), 500);
      assert.equal(simRes.obtenerCuerpo().exito, false);
      assert.match(simRes.obtenerCuerpo().mensaje, /Error al registrar la acción/i);
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-06: Un usuario sin permiso ver_dashboard_corporativo no puede consultar la bitacora', () => {
    const simRes = crearRespuestaSimulada();
    const peticionSinPermiso = {
      usuario: {
        idUsuario: 5,
        rol: 'Analista de Unidad de Negocio',
        permisos: ['ver_dashboard_unidad', 'exportar_reportes']
      }
    };
    const siguiente = () => {
      assert.fail('No debio conceder acceso a un usuario sin permiso corporativo.');
    };

    const middleware = requierePermiso('ver_dashboard_corporativo');
    middleware(peticionSinPermiso, simRes.respuesta, siguiente);

    assert.equal(simRes.obtenerCodigo(), 403);
    assert.equal(simRes.obtenerCuerpo().exito, false);
    assert.equal(simRes.obtenerCuerpo().mensaje, 'No tiene permiso para esta operación.');

    let accesoPermitido = false;
    const peticionConPermiso = {
      usuario: {
        idUsuario: 1,
        rol: 'Administrador Corporativo',
        permisos: ['*']
      }
    };

    middleware(peticionConPermiso, simRes.respuesta, () => {
      accesoPermitido = true;
    });

    assert.equal(accesoPermitido, true);
  });

  it('AUD-07: La consulta de bitacora obtiene registros ordenados cronologicamente y categoriza modulos', async () => {
    verificarAislamientoBaseDatos();

    const registrosFicticios = [
      {
        idAuditoria: 1,
        usuario: 'Juan Perez',
        rol: 'Administrador Corporativo',
        idEvaluacion: null,
        accion: 'Inicio de sesión exitoso',
        fecha: new Date('2026-09-26T10:00:00Z'),
        modulo: 'Autenticación',
        detalles: 'Inicio de sesión exitoso'
      },
      {
        idAuditoria: 2,
        usuario: 'Maria Lopez',
        rol: 'Gerente de Unidad de Negocio',
        idEvaluacion: 3,
        accion: 'Asignó la campaña #1 al proveedor',
        fecha: new Date('2026-09-26T10:05:00Z'),
        modulo: 'Campañas',
        detalles: 'Asignó la campaña #1 al proveedor'
      }
    ];

    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql) => {
      assert.match(sql, /ORDER BY a\.fecha DESC/i);
      assert.match(sql, /LIMIT 200/i);
      return { rows: registrosFicticios, rowCount: 2 };
    });

    try {
      const simRes = crearRespuestaSimulada();
      await obtenerRegistrosAuditoria({}, simRes.respuesta);
      assert.equal(simRes.obtenerCodigo(), 200);
      assert.equal(simRes.obtenerCuerpo().exito, true);
      assert.equal(simRes.obtenerCuerpo().registros.length, 2);
      assert.equal(simRes.obtenerCuerpo().registros[0].modulo, 'Autenticación');
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-08: Inmutabilidad de la bitacora a nivel de aplicacion al no exponer operaciones de modificacion o eliminacion', () => {
    import('../../src/servicios/servicioAuditoria.js').then((modulo) => {
      const funcionesExportadas = Object.keys(modulo);
      assert.deepEqual(funcionesExportadas, ['registrarAuditoria']);
      assert.equal(funcionesExportadas.includes('actualizarAuditoria'), false);
      assert.equal(funcionesExportadas.includes('eliminarAuditoria'), false);
    });
  });

  it('AUD-09: Rechaza accion vacia, solo espacios, null o undefined en registrarAuditoria', async () => {
    verificarAislamientoBaseDatos();

    await assert.rejects(
      async () => registrarAuditoria({ idUsuario: 1, accion: '' }),
      /La acción de auditoría es obligatoria/
    );

    await assert.rejects(
      async () => registrarAuditoria({ idUsuario: 1, accion: '    ' }),
      /La acción de auditoría es obligatoria/
    );

    await assert.rejects(
      async () => registrarAuditoria({ idUsuario: 1, accion: null }),
      /La acción de auditoría es obligatoria/
    );

    await assert.rejects(
      async () => registrarAuditoria({ idUsuario: 1, accion: undefined }),
      /La acción de auditoría es obligatoria/
    );
  });

  it('AUD-10: Trunca de forma segura a 120 caracteres una accion que exceda el limite', async () => {
    verificarAislamientoBaseDatos();

    let parametrosCapturados = null;
    const mockConsulta = mock.method(grupoConexiones, 'query', async (sql, params) => {
      parametrosCapturados = params;
      return { rows: [], rowCount: 1 };
    });

    try {
      const accionExtensa = 'Operacion de actualizacion de politicas corporativas para el proveedor con razon social extremadamente larga '.repeat(2);
      assert.ok(accionExtensa.length > 120);

      await registrarAuditoria({
        idUsuario: 2,
        accion: accionExtensa
      });

      assert.equal(parametrosCapturados[2].length, 120);
    } finally {
      mockConsulta.mock.restore();
    }
  });

  it('AUD-11: Guardar o actualizar una respuesta en el portal ejecuta insercion y auditoria dentro de la misma transaccion', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('FROM alternativa')) {
        return { rows: [{ idAlternativa: 10, idItem: 4 }] };
      }
      return { rows: [], rowCount: 1 };
    });

    try {
      const peticion = {
        sesionProveedor: { idEvaluacion: 55 },
        body: { idItem: 4, idAlternativa: 10 }
      };
      const simRes = crearRespuestaSimulada();

      await guardarRespuesta(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 200);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const consultaRespuesta = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO respuesta'));
      assert.ok(consultaRespuesta);
      assert.deepEqual(consultaRespuesta.params, [55, 4, 10]);

      const consultaAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(consultaAuditoria);
      assert.equal(consultaAuditoria.params[1], 55);
      assert.equal(consultaAuditoria.params[2], 'Actualizó respuesta del ítem #4');
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
    }
  });

  it('AUD-12: Subir un archivo de evidencia ejecuta insercion y auditoria dentro de una transaccion', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        if (sql.includes('INSERT INTO evidencia')) {
          return {
            rows: [{
              idEvidencia: 101,
              nombreArchivo: 'certificado_iso14001.pdf',
              tipoMime: 'application/pdf',
              tamanoBytes: 1024,
              subidoEn: new Date()
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('SELECT id_respuesta')) {
        return { rows: [{ idRespuesta: 77 }] };
      }
      return { rows: [], rowCount: 1 };
    });

    try {
      const peticion = {
        sesionProveedor: { idEvaluacion: 33 },
        params: { idItem: 8 },
        file: {
          originalname: 'certificado_iso14001.pdf',
          buffer: Buffer.from('contenido_binario_simulado'),
          mimetype: 'application/pdf',
          size: 1024
        }
      };
      const simRes = crearRespuestaSimulada();

      await subirEvidenciaPortal(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 201);
      assert.equal(simRes.obtenerCuerpo().exito, true);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const consultaAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(consultaAuditoria);
      assert.equal(consultaAuditoria.params[1], 33);
      assert.equal(consultaAuditoria.params[2], 'Adjuntó evidencia al ítem #8');
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
    }
  });

  it('AUD-13: Eliminar un archivo de evidencia ejecuta eliminacion y auditoria dentro de la misma transaccion antes de limpiar R2', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('SELECT e.id_evidencia')) {
        return {
          rows: [{
            idEvidencia: 99,
            claveR2: 'evidencias/33/77/clave-archivo.pdf',
            idItem: 8
          }]
        };
      }
      return { rows: [], rowCount: 1 };
    });

    let claveR2Eliminada = null;
    const mockEliminarR2 = mock.method(servicioR2, 'eliminarArchivoR2', async (clave) => {
      claveR2Eliminada = clave;
    });

    try {
      const peticion = {
        sesionProveedor: { idEvaluacion: 33 },
        params: { idEvidencia: 99 }
      };
      const simRes = crearRespuestaSimulada();

      await eliminarEvidenciaPortal(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 200);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const consultaDelete = consultasTransaccionales.find((c) => c.sql.includes('DELETE FROM evidencia'));
      assert.ok(consultaDelete);
      assert.deepEqual(consultaDelete.params, [99]);

      const consultaAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(consultaAuditoria);
      assert.equal(consultaAuditoria.params[1], 33);
      assert.equal(consultaAuditoria.params[2], 'Eliminó evidencia del ítem #8');

      assert.equal(claveR2Eliminada, 'evidencias/33/77/clave-archivo.pdf');
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
      mockEliminarR2.mock.restore();
    }
  });

  it('AUD-14: guardarRespuesta ejecuta rollback atomico si la auditoria o la insercion falla dentro de la transaccion', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        if (sql.includes('INSERT INTO auditoria')) {
          throw new Error('Fallo simulado al registrar auditoria en base de datos');
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('FROM alternativa')) {
        return { rows: [{ idAlternativa: 12, idItem: 7 }] };
      }
      return { rows: [], rowCount: 1 };
    });

    try {
      const peticion = {
        sesionProveedor: { idEvaluacion: 80 },
        body: { idItem: 7, idAlternativa: 12 }
      };
      const simRes = crearRespuestaSimulada();

      await guardarRespuesta(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 500);
      assert.equal(simRes.obtenerCuerpo().exito, false);
      assert.equal(simRes.obtenerCuerpo().mensaje, 'Error al guardar la respuesta.');

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('ROLLBACK'));
      assert.equal(sqls.includes('COMMIT'), false);
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
    }
  });

  it('AUD-15: finalizarEvaluacion utiliza el mismo cliente transaccional para actualizar evaluacion, dimensiones y auditoria', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('FROM evaluacion ev') && sql.includes('JOIN proveedor')) {
        return {
          rows: [{
            idEvaluacion: 60,
            estado: 'En proceso',
            idProveedor: 10,
            correo: 'contacto@proveedor.pe',
            razonSocial: 'Distribuidora Central S.A.C.',
            idIndustria: 1,
            idUnidad: 2
          }]
        };
      }
      if (sql.includes('FROM item i') && sql.includes('JOIN item_industria')) {
        return {
          rows: [{
            idItem: 1,
            codigo: 'AMB01',
            enunciado: 'Gestion de residuos',
            peso: 1,
            idDimension: 1
          }]
        };
      }
      if (sql.includes('FROM alternativa')) {
        return {
          rows: [{
            idAlternativa: 100,
            idItem: 1,
            texto: 'Programa integral implementado',
            puntaje: 100
          }]
        };
      }
      if (sql.includes('FROM regla_condicional')) {
        return { rows: [] };
      }
      if (sql.includes('FROM respuesta WHERE id_evaluacion')) {
        return {
          rows: [{
            idItem: 1,
            idAlternativa: 100
          }]
        };
      }
      if (sql.includes('FROM dimension')) {
        return {
          rows: [{
            idDimension: 1,
            codigo: 'AMB',
            nombre: 'Ambiental',
            peso: 1
          }]
        };
      }
      if (sql.includes('FROM recomendacion')) {
        return { rows: [] };
      }
      return { rows: [], rowCount: 1 };
    });

    try {
      const peticion = { sesionProveedor: { idEvaluacion: 60 } };
      const simRes = crearRespuestaSimulada();

      await finalizarEvaluacion(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 200);
      assert.equal(simRes.obtenerCuerpo().exito, true);
      assert.equal(simRes.obtenerCuerpo().puntajeTotal, 100);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const updateEvaluacion = consultasTransaccionales.find((c) => c.sql.includes('UPDATE evaluacion SET puntaje_total'));
      assert.ok(updateEvaluacion);
      assert.equal(updateEvaluacion.params[0], 100);
      assert.equal(updateEvaluacion.params[1], 60);

      const deleteDimension = consultasTransaccionales.find((c) => c.sql.includes('DELETE FROM puntaje_dimension'));
      assert.ok(deleteDimension);
      assert.equal(deleteDimension.params[0], 60);

      const insertDimension = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO puntaje_dimension'));
      assert.ok(insertDimension);
      assert.deepEqual(insertDimension.params, [60, 1, 100]);

      const insertAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(insertAuditoria);
      assert.equal(insertAuditoria.params[1], 60);
      assert.match(insertAuditoria.params[2], /Finalizó su evaluación con puntaje 100\/100/);
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
    }
  });

  it('AUD-16: registrarProveedor utiliza el mismo cliente transaccional para proveedor, evaluacion y auditoria', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        if (sql.includes('SELECT id_proveedor, id_unidad FROM proveedor WHERE ruc')) {
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO proveedor')) {
          return { rows: [{ id_proveedor: 44 }] };
        }
        if (sql.includes('SELECT id_campania FROM campania')) {
          return { rows: [{ id_campania: 3 }] };
        }
        if (sql.includes('INSERT INTO evaluacion')) {
          return { rows: [{ idEvaluacion: 75, estado: 'En proceso' }] };
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);

    try {
      const peticion = {
        sesionProveedor: { correo: 'nuevo@empresa.pe', idProveedor: null },
        body: {
          ruc: '20600000001',
          razonSocial: 'Logistica Retail S.A.C.',
          idIndustria: 2,
          idUnidad: 1,
          tipo: 'Retail'
        }
      };
      const simRes = crearRespuestaSimulada();

      await registrarProveedor(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 200);
      assert.equal(simRes.obtenerCuerpo().exito, true);
      assert.equal(simRes.obtenerCuerpo().idEvaluacion, 75);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const insertProveedor = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO proveedor'));
      assert.ok(insertProveedor);

      const insertEvaluacion = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO evaluacion'));
      assert.ok(insertEvaluacion);

      const insertAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(insertAuditoria);
      assert.equal(insertAuditoria.params[1], 75);
      assert.match(insertAuditoria.params[2], /20600000001/);
    } finally {
      mockConnect.mock.restore();
    }
  });

  it('AUD-17: verificarAcceso utiliza el mismo cliente transaccional para marcar OTP consumido y registrar auditoria', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        if (sql.includes('SELECT id_codigo FROM codigo_otp')) {
          return { rows: [{ id_codigo: 15 }] };
        }
        if (sql.includes('SELECT id_proveedor AS "idProveedor"')) {
          return {
            rows: [{
              idProveedor: 20,
              ruc: '20100130204',
              razonSocial: 'Distribuidora del Norte'
            }]
          };
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);

    try {
      const peticion = {
        body: {
          correo: 'demo@proveedor.com',
          valor: '123456'
        }
      };
      const simRes = crearRespuestaSimulada();

      await verificarAcceso(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 200);
      assert.equal(simRes.obtenerCuerpo().exito, true);
      assert.ok(simRes.obtenerCuerpo().token);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('COMMIT'));

      const updateOtp = consultasTransaccionales.find((c) => c.sql.includes('UPDATE codigo_otp SET usado = TRUE'));
      assert.ok(updateOtp);
      assert.deepEqual(updateOtp.params, [15]);

      const insertAuditoria = consultasTransaccionales.find((c) => c.sql.includes('INSERT INTO auditoria'));
      assert.ok(insertAuditoria);
      assert.equal(insertAuditoria.params[2], 'Validó acceso mediante código OTP');
      assert.doesNotMatch(insertAuditoria.params[2], /123456/);
    } finally {
      mockConnect.mock.restore();
    }
  });

  it('AUD-18: subirEvidenciaPortal ejecuta compensacion en R2 cuando falla la transaccion subsiguiente en PostgreSQL', async () => {
    verificarAislamientoBaseDatos();

    const consultasTransaccionales = [];
    const mockCliente = {
      query: async (sql, params) => {
        consultasTransaccionales.push({ sql, params });
        if (sql.includes('INSERT INTO evidencia')) {
          throw new Error('Fallo critico simulado en base de datos al guardar evidencia');
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {}
    };

    const mockConnect = mock.method(grupoConexiones, 'connect', async () => mockCliente);
    const mockQuery = mock.method(grupoConexiones, 'query', async (sql) => {
      if (sql.includes('SELECT id_respuesta')) {
        return { rows: [{ idRespuesta: 88 }] };
      }
      return { rows: [], rowCount: 1 };
    });

    let claveSubida = null;
    let claveCompensada = null;

    const mockSubirR2 = mock.method(servicioR2, 'subirArchivoR2', async (clave) => {
      claveSubida = clave;
    });
    const mockEliminarR2 = mock.method(servicioR2, 'eliminarArchivoR2', async (clave) => {
      claveCompensada = clave;
    });

    try {
      const peticion = {
        sesionProveedor: { idEvaluacion: 40 },
        params: { idItem: 3 },
        file: {
          originalname: 'balance_social_2025.pdf',
          buffer: Buffer.from('contenido_pdf'),
          mimetype: 'application/pdf',
          size: 2048
        }
      };
      const simRes = crearRespuestaSimulada();

      await subirEvidenciaPortal(peticion, simRes.respuesta);

      assert.equal(simRes.obtenerCodigo(), 500);
      assert.equal(simRes.obtenerCuerpo().exito, false);
      assert.equal(simRes.obtenerCuerpo().mensaje, 'Error al subir la evidencia.');

      assert.ok(claveSubida);
      assert.match(claveSubida, /evidencias\/40\/88\//);
      assert.equal(claveCompensada, claveSubida);

      const sqls = consultasTransaccionales.map((c) => c.sql);
      assert.ok(sqls.includes('BEGIN'));
      assert.ok(sqls.includes('ROLLBACK'));
      assert.equal(sqls.includes('COMMIT'), false);
    } finally {
      mockConnect.mock.restore();
      mockQuery.mock.restore();
      mockSubirR2.mock.restore();
      mockEliminarR2.mock.restore();
    }
  });
});
