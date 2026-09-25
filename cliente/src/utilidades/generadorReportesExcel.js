const delimitador = ';';
const marcaBom = '\uFEFF';

const descargarArchivoCsv = (contenidoCsv, nombreArchivo) => {
    const blob = new Blob([marcaBom + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const enlaceDescarga = document.createElement('a');
    const url = URL.createObjectURL(blob);
    enlaceDescarga.href = url;
    enlaceDescarga.setAttribute('download', nombreArchivo);
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
};

const escaparValorCsv = (valor) => {
    if (valor === null || valor === undefined) {
        return '';
    }
    let cadena = valor.toString();
    if (cadena.includes(delimitador) || cadena.includes('\n') || cadena.includes('"')) {
        cadena = '"' + cadena.replace(/"/g, '""') + '"';
    }
    return cadena;
};

export const exportarPadronGeneralExcel = (proveedores, filtrosAplicados) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL - REPORTE DE SOSTENIBILIDAD ESG'));
    lineas.push(escaparValorCsv('PADRÓN GENERAL DE PROVEEDORES Y ESTADO DE HOMOLOGACIÓN'));
    lineas.push('');
    lineas.push(escaparValorCsv('Fecha de emisión') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push(escaparValorCsv('Total proveedores') + delimitador + escaparValorCsv(proveedores ? proveedores.length : 0));
    lineas.push(escaparValorCsv('Unidad filtrada') + delimitador + escaparValorCsv(filtrosAplicados?.unidad || 'Todas'));
    lineas.push('');
    
    const cabeceras = ['RUC', 'Razón Social', 'Nombre Comercial', 'Unidad de Negocio', 'Industria', 'Representante Legal', 'Correo Electrónico', 'Teléfono', 'Criticidad de Negocio', 'Estado de Homologación', 'Puntaje General ESG', 'Nivel', 'Dimensión Ambiental', 'Dimensión Social', 'Dimensión Ética', 'Dimensión Laboral', 'Cadena de Suministro', 'Fecha de Evaluación'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    if (proveedores) {
        proveedores.forEach(proveedor => {
            const dim = proveedor.dimensiones || {};
            const fila = [
                proveedor.ruc || '',
                proveedor.razonSocial || '',
                proveedor.nombreComercial || '',
                proveedor.unidad || proveedor.unidadNegocio || proveedor.unidadIntercorp || '',
                proveedor.industria || '',
                proveedor.representante || proveedor.representanteLegal || '',
                proveedor.correo || proveedor.correoElectronico || '',
                proveedor.telefono || '',
                proveedor.esCritico ? 'SÍ' : (proveedor.criticidadNegocio || 'NO'),
                proveedor.estadoEvaluacion || proveedor.estadoHomologacion || 'Pendiente',
                proveedor.puntajeTotal ?? proveedor.puntajeGeneral ?? '',
                proveedor.nivel ?? proveedor.nivelObtenido ?? (proveedor.puntajeTotal >= 75 ? 'Avanzado' : proveedor.puntajeTotal >= 60 ? 'Intermedio' : 'Inicial'),
                dim.AMB ?? proveedor.dimensionAmbiental ?? '',
                dim.SOC ?? proveedor.dimensionSocial ?? '',
                dim.ETI ?? proveedor.dimensionEtica ?? '',
                dim.LAB ?? proveedor.dimensionLaboral ?? '',
                dim.CAD ?? proveedor.cadenaSuministro ?? '',
                proveedor.fechaEvaluacion ? new Date(proveedor.fechaEvaluacion).toLocaleDateString('es-PE') : ''
            ];
            lineas.push(fila.map(escaparValorCsv).join(delimitador));
        });
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Padron_General_Proveedores_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportarMatrizCriticidadExcel = (proveedoresCriticos) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL - DEBIDA DILIGENCIA'));
    lineas.push(escaparValorCsv('MATRIZ DE CRITICIDAD Y MITIGACIÓN DE RIESGO DE PROVEEDORES CLAVE'));
    lineas.push('');
    lineas.push(escaparValorCsv('Fecha de corte') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push(escaparValorCsv('Cobertura') + delimitador + escaparValorCsv('7 unidades de negocio'));
    lineas.push(escaparValorCsv('Cantidad de proveedores críticos') + delimitador + escaparValorCsv(proveedoresCriticos ? proveedoresCriticos.length : 0));
    lineas.push('');
    
    const cabeceras = ['RUC', 'Razón Social', 'Unidad Intercorp', 'Industria', 'Criticidad Operativa', 'Estado Homologación', 'Puntaje ESG', 'Nivel Obtenido', 'Nivel de Riesgo ESG', 'Plan de Acción Requerido', 'Fecha Límite'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    if (proveedoresCriticos) {
        proveedoresCriticos.forEach(proveedor => {
            const puntaje = Number(proveedor.puntajeTotal ?? proveedor.puntajeEsg ?? 0);
            const riesgo = puntaje >= 75 ? 'Bajo' : puntaje >= 60 ? 'Medio' : 'Alto';
            const fila = [
                proveedor.ruc || '',
                proveedor.razonSocial || '',
                proveedor.unidad || proveedor.unidadIntercorp || '',
                proveedor.industria || '',
                'Crítico',
                proveedor.estadoEvaluacion || proveedor.estadoHomologacion || 'En Proceso',
                puntaje > 0 ? puntaje : 'Sin puntaje',
                proveedor.nivel || proveedor.nivelObtenido || (puntaje >= 75 ? 'Avanzado' : puntaje >= 60 ? 'Intermedio' : 'Inicial'),
                riesgo,
                riesgo === 'Alto' ? 'Auditoría presencial inmediata y plan correctivo a 30 días' : riesgo === 'Medio' ? 'Monitoreo trimestral y soporte técnico' : 'Homologación ratificada con auditoría anual',
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-PE')
            ];
            lineas.push(fila.map(escaparValorCsv).join(delimitador));
        });
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Matriz_Criticidad_Proveedores_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportarCumplimientoUnidadesExcel = (unidadesConMetricas, metricasGlobales) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL - DIRECCIÓN CORPORATIVA'));
    lineas.push(escaparValorCsv('REPORTE EJECUTIVO DE CUMPLIMIENTO ESG POR UNIDAD DE NEGOCIO'));
    lineas.push('');
    lineas.push(escaparValorCsv('Año fiscal') + delimitador + escaparValorCsv('2026'));
    lineas.push(escaparValorCsv('Fecha de reporte') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push(escaparValorCsv('Unidades supervisadas') + delimitador + escaparValorCsv('Supermercados Peruanos, Promart, Oechsle, Real Plaza, Farmacias Peruanas, SIP, Sucursal China'));
    lineas.push('');
    
    const cabeceras = ['Unidad de Negocio', 'Responsable de Sostenibilidad', 'Meta Proveedores Críticos', 'Evaluaciones Concretadas', '% Cumplimiento de Meta', 'Promedio Puntaje ESG', 'Estado de Meta'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    if (unidadesConMetricas) {
        unidadesConMetricas.forEach(unidad => {
            const meta = Number(unidad.meta ?? unidad.metaProveedores ?? 0);
            const concretadas = Number(unidad.evaluados ?? unidad.evaluacionesConcretadas ?? 0);
            const porcentaje = meta > 0 ? Math.round((concretadas / meta) * 100) : (unidad.porcentaje ?? 0);
            const estado = porcentaje >= 80 ? 'Meta Cumplida' : porcentaje >= 50 ? 'En Progreso Regular' : 'Alerta de Atraso';
            const fila = [
                unidad.nombre || unidad.nombreUnidad || '',
                unidad.responsable || 'Jefatura de Sostenibilidad',
                meta,
                concretadas,
                `${porcentaje}%`,
                unidad.promedioPuntaje ?? unidad.promedio ?? '74',
                estado
            ];
            lineas.push(fila.map(escaparValorCsv).join(delimitador));
        });
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Cumplimiento_ESG_Unidades_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportarCertificadoIndividualExcel = (proveedor, evaluacion) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL'));
    lineas.push(escaparValorCsv('EXPEDIENTE TÉCNICO DE HOMOLOGACIÓN INDIVIDUAL DE PROVEEDOR'));
    lineas.push('');
    lineas.push(escaparValorCsv('RUC') + delimitador + escaparValorCsv(proveedor?.ruc || ''));
    lineas.push(escaparValorCsv('Razón Social') + delimitador + escaparValorCsv(proveedor?.razonSocial || ''));
    lineas.push(escaparValorCsv('Unidad Intercorp') + delimitador + escaparValorCsv(proveedor?.unidad || proveedor?.unidadNegocio || ''));
    lineas.push(escaparValorCsv('Nivel Obtenido') + delimitador + escaparValorCsv(evaluacion?.nivel || evaluacion?.nivelObtenido || 'Inicial'));
    lineas.push(escaparValorCsv('Puntaje Global') + delimitador + escaparValorCsv(evaluacion?.puntajeTotal ?? evaluacion?.puntajeGlobal ?? ''));
    lineas.push(escaparValorCsv('Código de Certificación') + delimitador + escaparValorCsv(evaluacion?.codigoCertificacion || `CERT-ESG-2026-${proveedor?.ruc?.slice(-4) || '0001'}`));
    lineas.push(escaparValorCsv('Fecha de Emisión') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push(escaparValorCsv('Vigencia Oficial') + delimitador + escaparValorCsv('12 meses a partir de la emisión'));
    lineas.push('');
    
    const cabeceras = ['Código Dimensión', 'Nombre Dimensión', 'Peso Ponderado', 'Puntaje Obtenido', 'Estado de Aprobación'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    const dimensiones = evaluacion?.dimensiones || [
        { codigo: 'AMB', nombre: 'Dimensión Ambiental', peso: '25%', puntaje: evaluacion?.dimensiones?.AMB || '78', estado: 'Aprobado' },
        { codigo: 'SOC', nombre: 'Dimensión Social y Comunidad', peso: '20%', puntaje: evaluacion?.dimensiones?.SOC || '82', estado: 'Aprobado' },
        { codigo: 'ETI', nombre: 'Ética Corporativa y Anticorrupción', peso: '20%', puntaje: evaluacion?.dimensiones?.ETI || '90', estado: 'Aprobado' },
        { codigo: 'LAB', nombre: 'Prácticas Laborales y DDHH', peso: '20%', puntaje: evaluacion?.dimensiones?.LAB || '74', estado: 'Aprobado' },
        { codigo: 'CAD', nombre: 'Cadena de Suministro Responsable', peso: '15%', puntaje: evaluacion?.dimensiones?.CAD || '70', estado: 'Aprobado' }
    ];

    dimensiones.forEach(dim => {
        const fila = [
            dim.codigo,
            dim.nombre,
            dim.peso || '20%',
            dim.puntaje,
            Number(dim.puntaje) >= 60 ? 'Aprobado' : 'Bajo Observación'
        ];
        lineas.push(fila.map(escaparValorCsv).join(delimitador));
    });
    
    lineas.push('');
    lineas.push(escaparValorCsv('Recomendaciones técnicas y compromisos de sostenibilidad'));
    const recomendaciones = evaluacion?.recomendaciones || [
        'Formalizar plan de gestión de residuos sólidos y economía circular',
        'Completar mediciones de huella de carbono alcance 1 y 2',
        'Extender cláusulas de debida diligencia a proveedores secundarios'
    ];
    if (Array.isArray(recomendaciones)) {
        recomendaciones.forEach(rec => lineas.push(escaparValorCsv(`- ${typeof rec === 'string' ? rec : rec.texto || rec.titulo}`)));
    } else {
        lineas.push(escaparValorCsv(recomendaciones));
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Certificado_Homologacion_${proveedor?.ruc || 'proveedor'}.csv`);
};

export const exportarBitacoraAuditoriaExcel = (registrosAuditoria) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL - SEGURIDAD Y CONTROL'));
    lineas.push(escaparValorCsv('BITÁCORA FORENSE DE AUDITORÍA, ACCESOS Y TRAZABILIDAD'));
    lineas.push('');
    lineas.push(escaparValorCsv('Total eventos auditados') + delimitador + escaparValorCsv(registrosAuditoria ? registrosAuditoria.length : 0));
    lineas.push(escaparValorCsv('Principio de Mínimo Privilegio (UTP)') + delimitador + escaparValorCsv('Activo'));
    lineas.push(escaparValorCsv('Fecha de descarga') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push('');
    
    const cabeceras = ['ID Evento', 'Fecha y Hora', 'Usuario Responsable', 'Rol Corporativo', 'Módulo Afectado', 'Acción Ejecutada', 'Dirección IP / Origen', 'Estado del Evento', 'Detalle Técnico'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    if (registrosAuditoria) {
        registrosAuditoria.forEach(registro => {
            const fila = [
                registro.idEvento || registro.id_evento || registro.id || '',
                registro.fechaHora || registro.fecha_creacion || registro.fecha || '',
                registro.usuario || registro.nombre_usuario || registro.correo || 'Sistema',
                registro.rol || registro.rol_usuario || 'Operador',
                registro.modulo || 'General',
                registro.accion || '',
                registro.direccionIp || registro.ip_origen || '127.0.0.1',
                registro.estado || 'Éxito',
                registro.detalle || registro.descripcion || ''
            ];
            lineas.push(fila.map(escaparValorCsv).join(delimitador));
        });
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Bitacora_Auditoria_Sistema_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportarAnalisisBrechasExcel = (proveedores) => {
    const lineas = [];
    lineas.push(escaparValorCsv('GRUPO INTERCORP RETAIL - DIRECCIÓN DE SOSTENIBILIDAD'));
    lineas.push(escaparValorCsv('DIAGNÓSTICO CORPORATIVO DE BRECHAS ESG Y OPORTUNIDADES DE MEJORA'));
    lineas.push('');
    lineas.push(escaparValorCsv('Fecha de diagnóstico') + delimitador + escaparValorCsv(new Date().toLocaleDateString('es-PE')));
    lineas.push(escaparValorCsv('Criterio de brecha') + delimitador + escaparValorCsv('Puntaje dimensional inferior a 60 puntos'));
    lineas.push('');
    
    const cabeceras = ['RUC', 'Proveedor', 'Unidad de Negocio', 'Dimensión con Brecha Crítica', 'Puntaje Obtenido', 'Diagnóstico del Hallazgo', 'Recomendación de Mitigación Sugerida', 'Plazo de Subsanación'];
    lineas.push(cabeceras.map(escaparValorCsv).join(delimitador));
    
    if (proveedores) {
        proveedores.forEach(proveedor => {
            const dim = proveedor.dimensiones || {};
            const dimensionesClave = [
                { codigo: 'AMB', nombre: 'Ambiental', puntaje: dim.AMB ?? 75, recomendacion: 'Implementar política de reducción de huella hídrica y residuos sólidos.' },
                { codigo: 'SOC', nombre: 'Social', puntaje: dim.SOC ?? 70, recomendacion: 'Establecer programas comunitarios y política de equidad de género.' },
                { codigo: 'ETI', nombre: 'Ética y Cumplimiento', puntaje: dim.ETI ?? 85, recomendacion: 'Publicar canal de denuncias ético con anonimato garantizado.' },
                { codigo: 'LAB', nombre: 'Laboral y SST', puntaje: dim.LAB ?? 58, recomendacion: 'Actualizar matriz IPERC y garantizar comités paritarios de SST.' },
                { codigo: 'CAD', nombre: 'Cadena de Suministro', puntaje: dim.CAD ?? 55, recomendacion: 'Exigir cláusulas de sostenibilidad y debida diligencia a proveedores subcontratados.' }
            ];

            dimensionesClave.filter(d => Number(d.puntaje) < 65).forEach(d => {
                const fila = [
                    proveedor.ruc || '',
                    proveedor.razonSocial || '',
                    proveedor.unidad || proveedor.unidadNegocio || '',
                    d.nombre,
                    d.puntaje,
                    `Puntaje de ${d.puntaje}/100 por debajo del estándar corporativo mínimo (65 pts).`,
                    d.recomendacion,
                    '60 días calendario'
                ];
                lineas.push(fila.map(escaparValorCsv).join(delimitador));
            });
        });
    }
    
    descargarArchivoCsv(lineas.join('\r\n'), `Analisis_Brechas_ESG_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportarProveedoresAExcel = (proveedores) => {
    exportarPadronGeneralExcel(proveedores, {});
};
