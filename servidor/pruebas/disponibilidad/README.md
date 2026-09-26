# Disponibilidad del Sistema — Requisito RNF06

## 1. Definición Académica Oficial
**RNF06 — Disponibilidad:**  
*“Operación de al menos 99 % durante periodos de campaña.”*

### Formulación Matemática Estándar
$$\text{Disponibilidad (\%)} = \frac{\text{Tiempo total observado} - \text{Tiempo de indisponibilidad}}{\text{Tiempo total observado}} \times 100$$

*Ejemplo conceptual de referencia:* Para un periodo mensual de 30 días (720 horas), una disponibilidad del 99.00% admite un tiempo de indisponibilidad acumulado máximo de aproximadamente 7 horas y 12 minutos. (Este cálculo es exclusivamente una referencia matemática ilustrativa, no un dato operacional registrado del sistema).

---

## 2. Herramientas y Mecanismos de Observabilidad

Se distingue estrictamente entre los mecanismos reportados a nivel de arquitectura y la evidencia empírica verificada de forma independiente durante esta auditoría:

| Herramienta | Recurso Reportado | Estado de Verificación en la Auditoría Actual | Fuente de Información |
|---|---|---|---|
| **UptimeRobot** | Backend HTTP (`/api/salud`) | Existe referencia previa a un monitor UptimeRobot del backend, pero su configuración e historial no pudieron verificarse de manera independiente desde el entorno actual (*“Evidencia histórica no accesible desde el entorno actual”*). | Documentación previa (`README.md` del repositorio) |
| **Sentry** | Excepciones no controladas (Frontend + Backend) | SDKs presentes en el código (`@sentry/react` en cliente, `@sentry/node` en servidor). Sin anomalías bloqueantes registradas en las comprobaciones locales. | Código fuente e instrumentación del proyecto |
| **Google Cloud Monitoring** | Contenedor en Cloud Run | Métricas de infraestructura gestionadas en plataforma Google Cloud. No consultadas por API externa durante esta prueba. | Arquitectura de despliegue en Google Cloud |
| **Cloudflare Analytics** | Red Edge CDN de Cloudflare Pages | Cabeceras perimetrales confirmadas en la respuesta HTTP (`CF-RAY`). | Comprobación de cabeceras HTTP en producción |

---

## 3. Arquitectura de Endpoints de Salud y Diagnóstico

### A. Endpoint de Salud de Aplicación (`/api/salud`)
- **Propósito:** Validar que el proceso del runtime Node.js y el servidor Express se encuentran en ejecución, escuchando en el puerto configurado y aceptando conexiones HTTP.
- **Respuesta esperada:** Código HTTP 200 con carga JSON:
  ```json
  {
    "estado": "Operativo",
    "plataforma": "Evaluaciones de Sostenibilidad Intercorp Retail",
    "version": "1.0.0"
  }
  ```
- **Alcance técnico:** Demuestra la disponibilidad de la **capa de aplicación/backend**, pero **no** verifica la conectividad ni el estado operacional de la base de datos PostgreSQL.

### B. Endpoint de Diagnóstico de Base de Datos (`/api/sistema/monitoreo-bd`)
- **Propósito:** Comprueba disponibilidad del backend, conectividad con PostgreSQL y capacidad de ejecutar una consulta de lectura.
- **Operación ejecutada:** `SELECT NOW() as marca_tiempo;`
- **Alcance técnico:** Evalúa la conectividad de red con el clúster PostgreSQL en Neon y la respuesta del pool de conexiones `pg`. **NO demuestra escrituras**, ya que ejecuta únicamente una consulta de lectura (`SELECT NOW()`). En el entorno de producción actual, este endpoint no se encuentra desplegado en la imagen del contenedor de Cloud Run (retorna HTTP 404), manteniéndose disponible en el repositorio y en ejecución local.

---

## 4. Estado de Comprobación Operacional en Producción

Las siguientes mediciones corresponden a una **disponibilidad puntual comprobada en la fecha/hora de observación** (26 de septiembre de 2026, 06:54 UTC-5 / 11:54 GMT). No representan ni sustituyen un historial acumulado de disponibilidad:

### Frontend (Cloudflare Pages)
- **URL:** `https://plataforma-sostenibilidad.pages.dev`
- **Estado HTTP observado:** `200 OK`
- **Infraestructura:** Servidor Cloudflare en red perimetral Anycast (nodo de borde detectado: `CF-RAY: a412131159a2144d-LIM`).
- **Diagnóstico:** Disponibilidad puntual comprobada en la fecha/hora de observación.

### Backend (Google Cloud Run)
- **URL:** `https://plataforma-sostenibilidad-api-42337725028.us-east1.run.app/api/salud`
- **Estado HTTP observado:** `200 OK`
- **Infraestructura:** Contenedor serverless en Google Cloud Run (región `us-east1`, servidor `Google Frontend`).
- **Diagnóstico:** Disponibilidad puntual comprobada en la fecha/hora de observación.

---

## 5. Análisis del Periodo de Campaña y Evidencia Histórica

1. **Estado en Base de Datos:**
   - La tabla `campania` registra la `Campaña Anual de Sostenibilidad 2026` (`periodo: 2026-I`, `estado: Publicada`, creada el `2026-09-24T17:34:32.693Z`).
2. **Ventana Histórica de Campaña:**
   - La campaña 2026-I está actualmente en curso. Todavía no existe una ventana completa y cerrada de campaña con historial operacional suficiente para calcular métricas consolidadas de disponibilidad.
3. **Acceso a Telemetría Externa:**
   - No se dispone de credenciales ni claves de API en el repositorio para extraer los registros históricos (24h, 7d, 30d) de UptimeRobot u otra herramienta de sondeo continuo.

---

## 6. Veredicto Oficial RNF06

$$\mathbf{RNF06} \text{ — } \Large{\text{🟡 PARCIALMENTE DEMOSTRADO}}$$

### Conclusión Oficial:
> **RNF06 permanece PARCIALMENTE DEMOSTRADO.** El frontend y backend se encuentran actualmente operativos y existen mecanismos de observabilidad. Sin embargo, no se dispone todavía de una serie histórica verificable que permita calcular una disponibilidad $\ge 99\%$ durante una ventana completa de campaña.

---

## 7. Limitaciones Metodológicas
- **Comprobación Puntual vs. Historial:** Las respuestas HTTP 200 obtenidas corresponden a sondeos puntuales y no constituyen evidencia suficiente de estabilidad en el tiempo.
- **SLA de Proveedor vs. Uptime de Aplicación:** Las garantías de nivel de servicio (SLA) contractuales de los proveedores de nube (Google Cloud, Cloudflare, Neon) no son equivalentes a la disponibilidad real observada del software desarrollado.
- **Aislamiento de Secretos:** Conforme a los principios de seguridad del proyecto, no se incluyen claves API ni tokens de servicios SaaS externos dentro del repositorio versionado.

---

## 8. Evidencia Pendiente para Cierre Definitivo

Para certificar formalmente el cumplimiento de RNF06 ($\ge 99\%$) al término del ciclo de evaluación, se deberá incorporar:
1. Exportación o reporte verificable de UptimeRobot o herramienta equivalente de monitoreo sintético continuo.
2. Periodo exacto observado correspondiente a la ventana de campaña.
3. Registro consolidado del tiempo de indisponibilidad (*downtime*) acumulado.
4. Porcentaje final de disponibilidad calculado mediante la fórmula:
   $$\text{Disponibilidad (\%)} = \frac{\text{Tiempo observado} - \text{Downtime}}{\text{Tiempo observado}} \times 100$$
5. Trazabilidad directa y correspondencia con el periodo de la campaña oficial `2026-I`.
