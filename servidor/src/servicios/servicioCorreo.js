const enviarCorreoBrevo = async ({ destinatario, asunto, html }) => {
  if (!process.env.CLAVE_API_BREVO) return false;

  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.CLAVE_API_BREVO,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Intercorp Retail Sostenibilidad',
        email: process.env.CORREO_REMITENTE_BREVO
      },
      to: [{ email: destinatario }],
      subject: asunto,
      htmlContent: html
    })
  });
  return respuesta.ok;
};

export const enviarCodigoAccesoOtp = async (correoDestinatario, codigoGenerado) =>
  enviarCorreoBrevo({
    destinatario: correoDestinatario,
    asunto: 'Código de acceso - Evaluación de Sostenibilidad',
    html: `<h2>Código de Verificación</h2><p>Su código de acceso de un solo uso es: <strong>${codigoGenerado}</strong></p><p>Este código expira en 10 minutos.</p>`
  });

export const enviarRecordatorioEvaluacion = async (correoDestinatario, razonSocial, enlaceEvaluacion) =>
  enviarCorreoBrevo({
    destinatario: correoDestinatario,
    asunto: 'Recordatorio - Evaluación de Sostenibilidad pendiente',
    html: `<h2>Evaluación pendiente</h2><p>Estimado proveedor <strong>${razonSocial}</strong>,</p><p>Le recordamos que tiene una evaluación de sostenibilidad pendiente. Ingrese al siguiente enlace para completarla:</p><p><a href="${enlaceEvaluacion}">${enlaceEvaluacion}</a></p>`
  });

export const enviarReporteResultados = async (correoDestinatario, razonSocial, puntajeTotal, recomendaciones) => {
  const seccionRecomendaciones = recomendaciones.length > 0
    ? `<h3>Recomendaciones de mejora:</h3><ul>${recomendaciones.map((item) => `<li>${item.texto}</li>`).join('')}</ul>`
    : '<h3>Recomendaciones de mejora:</h3><p>No se generaron recomendaciones: su puntaje superó los umbrales definidos en todas las dimensiones evaluadas.</p>';

  return enviarCorreoBrevo({
    destinatario: correoDestinatario,
    asunto: `Resultados Evaluación de Sostenibilidad - ${razonSocial}`,
    html: `<h2>Evaluación de Sostenibilidad</h2><p>Estimado proveedor <strong>${razonSocial}</strong>,</p><p>Su puntaje global alcanzado es de <strong>${puntajeTotal} / 100</strong>.</p>${seccionRecomendaciones}`
  });
};
