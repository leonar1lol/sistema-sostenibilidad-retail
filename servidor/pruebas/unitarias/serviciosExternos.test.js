import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  enviarCodigoAccesoOtp,
  enviarRecordatorioEvaluacion,
  enviarReporteResultados
} from '../../src/servicios/servicioCorreo.js';
import {
  subirArchivoR2,
  eliminarArchivoR2
} from '../../src/servicios/servicioR2.js';

describe('Servicios Externos - Servicio de Correo Transaccional (Resend Mock)', () => {
  const fetchOriginal = global.fetch;

  it('retorna false limpiamente sin enviar correos si no existe CLAVE_API_RESEND', async () => {
    const claveOriginal = process.env.CLAVE_API_RESEND;
    delete process.env.CLAVE_API_RESEND;

    const enviado = await enviarCodigoAccesoOtp('proveedor@ejemplo.com', '123456');
    assert.equal(enviado, false);

    process.env.CLAVE_API_RESEND = claveOriginal;
  });

  it('invoca la API de correo con estructura correcta de remitente y destinatario', async () => {
    process.env.CLAVE_API_RESEND = 're_simulacion_clave_pruebas';
    process.env.CORREO_REMITENTE_RESEND = 'notificaciones@intercorpretail.pe';

    let urlLlamada = null;
    let cuerpoEnviado = null;
    let cabecerasEnviadas = null;

    global.fetch = async (url, opciones) => {
      urlLlamada = url;
      cuerpoEnviado = JSON.parse(opciones.body);
      cabecerasEnviadas = opciones.headers;
      return { ok: true, status: 200 };
    };

    const resultado = await enviarCodigoAccesoOtp('empresa@proveedor.pe', '654321');

    assert.equal(resultado, true);
    assert.equal(urlLlamada, 'https://api.resend.com/emails');
    assert.equal(cabecerasEnviadas.Authorization, 'Bearer re_simulacion_clave_pruebas');
    assert.deepEqual(cuerpoEnviado.to, ['empresa@proveedor.pe']);
    assert.match(cuerpoEnviado.html, /654321/);

    global.fetch = fetchOriginal;
  });

  it('genera plantilla de reporte de resultados con recomendaciones dimensionales', async () => {
    process.env.CLAVE_API_RESEND = 're_simulacion_clave_pruebas';

    let cuerpoEnviado = null;
    global.fetch = async (url, opciones) => {
      cuerpoEnviado = JSON.parse(opciones.body);
      return { ok: true, status: 200 };
    };

    const recomendaciones = [
      { texto: 'Implementar auditoria anual de huella hidrica.' }
    ];

    const resultado = await enviarReporteResultados(
      'proveedor@retail.com',
      'Distribuidora SAC',
      85,
      recomendaciones
    );

    assert.equal(resultado, true);
    assert.match(cuerpoEnviado.html, /85 \/ 100/);
    assert.match(cuerpoEnviado.html, /huella hidrica/);

    global.fetch = fetchOriginal;
  });
});

describe('Servicios Externos - Validacion de Archivos y Evidencias', () => {
  const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
  const tamanoMaximoBytes = 5 * 1024 * 1024;

  const validarArchivoEvidencia = (archivo) => {
    if (!archivo) {
      return { valido: false, mensaje: 'Archivo ausente.' };
    }
    if (!tiposPermitidos.includes(archivo.tipoMime)) {
      return { valido: false, mensaje: 'Tipo MIME no admitido.' };
    }
    if (archivo.tamanoBytes > tamanoMaximoBytes) {
      return { valido: false, mensaje: 'Supera el limite de 5 MB.' };
    }
    return { valido: true, mensaje: 'Archivo valido.' };
  };

  it('admite archivos PDF, JPG y PNG dentro del limite de 5 megabytes', () => {
    const archivoValido = {
      tipoMime: 'application/pdf',
      tamanoBytes: 2 * 1024 * 1024
    };
    assert.equal(validarArchivoEvidencia(archivoValido).valido, true);
  });

  it('rechaza archivos con extensiones ejecutables o no soportadas', () => {
    const archivoEjecutable = {
      tipoMime: 'application/x-msdownload',
      tamanoBytes: 1024
    };
    assert.equal(validarArchivoEvidencia(archivoEjecutable).valido, false);
  });

  it('rechaza archivos que exceden los 5 megabytes', () => {
    const archivoPesado = {
      tipoMime: 'image/jpeg',
      tamanoBytes: 6 * 1024 * 1024
    };
    const resultado = validarArchivoEvidencia(archivoPesado);
    assert.equal(resultado.valido, false);
    assert.equal(resultado.mensaje, 'Supera el limite de 5 MB.');
  });

  it('falla explicitamente en produccion si Cloudflare R2 no esta configurado', async () => {
    await assert.rejects(
      async () => subirArchivoR2('test.pdf', Buffer.from('abc'), 'application/pdf', 'production'),
      /Configuración de Cloudflare R2 no disponible o incompleta/
    );

    await assert.rejects(
      async () => eliminarArchivoR2('test.pdf', 'production'),
      /Configuración de Cloudflare R2 no disponible o incompleta/
    );
  });
});
