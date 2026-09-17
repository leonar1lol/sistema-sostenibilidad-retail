export const enviarCodigoAccesoOtp = async (correoDestinatario, codigoGenerado) => {
  if (process.env.CLAVE_API_RESEND) {
    const respuestaServicio = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAVE_API_RESEND}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Intercorp Retail Sostenibilidad <${process.env.CORREO_REMITENTE_RESEND || 'notificaciones@intercorpretail.pe'}>`,
        to: [correoDestinatario],
        subject: 'Código de acceso - Evaluación de Sostenibilidad',
        html: `<h2>Código de Verificación</h2><p>Su código de acceso de un solo uso es: <strong>${codigoGenerado}</strong></p><p>Este código expira en 10 minutos.</p>`
      })
    });
    return respuestaServicio.ok;
  }
  return false;
};

export const enviarRecordatorioEvaluacion = async (correoDestinatario, razonSocial, enlaceEvaluacion) => {
  if (process.env.CLAVE_API_RESEND) {
    const respuestaServicio = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAVE_API_RESEND}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Intercorp Retail Sostenibilidad <${process.env.CORREO_REMITENTE_RESEND || 'notificaciones@intercorpretail.pe'}>`,
        to: [correoDestinatario],
        subject: 'Recordatorio - Evaluación de Sostenibilidad pendiente',
        html: `<h2>Evaluación pendiente</h2><p>Estimado proveedor <strong>${razonSocial}</strong>,</p><p>Le recordamos que tiene una evaluación de sostenibilidad pendiente. Ingrese al siguiente enlace para completarla:</p><p><a href="${enlaceEvaluacion}">${enlaceEvaluacion}</a></p>`
      })
    });
    return respuestaServicio.ok;
  }
  return true;
};

export const enviarReporteResultados = async (correoDestinatario, razonSocial, puntajeTotal, recomendaciones) => {
  if (process.env.CLAVE_API_RESEND) {
    const seccionRecomendaciones = recomendaciones.length > 0
      ? `<h3>Recomendaciones de mejora:</h3><ul>${recomendaciones.map((item) => `<li>${item.texto}</li>`).join('')}</ul>`
      : '<h3>Recomendaciones de mejora:</h3><p>No se generaron recomendaciones: su puntaje superó los umbrales definidos en todas las dimensiones evaluadas.</p>';

    const respuestaServicio = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAVE_API_RESEND}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Intercorp Retail Sostenibilidad <${process.env.CORREO_REMITENTE_RESEND || 'notificaciones@intercorpretail.pe'}>`,
        to: [correoDestinatario],
        subject: `Resultados Evaluación de Sostenibilidad - ${razonSocial}`,
        html: `<h2>Evaluación de Sostenibilidad</h2><p>Estimado proveedor <strong>${razonSocial}</strong>,</p><p>Su puntaje global alcanzado es de <strong>${puntajeTotal} / 100</strong>.</p>${seccionRecomendaciones}`
      })
    });
    return respuestaServicio.ok;
  }
  return true;
};
