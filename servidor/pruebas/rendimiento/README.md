# Rendimiento y Latencia — Requisito RNF05

## RNF05
Respuesta a las acciones del usuario en un tiempo menor a tres segundos bajo carga normal (< 3 s).

## Entorno
PostgreSQL TEST local aislado (`127.0.0.1:5433 / sostenibilidad_test`), validado mediante `guardianBaseDatos` para garantizar aislamiento estricto respecto al clúster operativo en la nube.

> **Nota sobre medición exploratoria:** Se realizó una medición exploratoria inicial que fue descartada como evidencia formal al detectarse conexión con el entorno operativo.

## Herramienta
`autocannon 7.15.0` (fijado mediante `npx --yes autocannon@7.15.0`).

## Escenarios
Se utilizó la concurrencia HTTP como aproximación reproducible a la carga multiusuario:
- **Escenario A (Línea Base):** 1 conexión / 10 s.
- **Escenario B (Carga Ligera):** 5 conexiones / 15 s.
- **Escenario C (Carga Normal Formal):** 20 conexiones / 30 s (supuesto experimental conservador adoptado para el proyecto).

## Criterio
Percentil real $p97.5 < 3000\text{ ms}$ y tasa de errores inesperados $< 1\%$.

*Justificación metodológica:* `autocannon` no reporta de forma nativa el percentil $p95$, pero sí registra $p97.5$. Dado que $p97.5 \ge p95$ en cualquier distribución de latencia, cumplir $p97.5 < 3000\text{ ms}$ constituye una cota conservadora que demuestra estrictamente que $p95 < 3000\text{ ms}$.

## Resultado Formal (20 conexiones concurrentes / 30 s)
- `/api/salud` → $p97.5 = 3\text{ ms}$ | RPS: 8,493 | 0% errores
- `/api/sistema/monitoreo-bd` → $p97.5 = 5\text{ ms}$ | RPS: 5,045 | 0% errores
- `/api/proveedores/datos-maestros` → $p97.5 = 8\text{ ms}$ | RPS: 3,372 | 0% errores
- `/api/proveedores` → $p97.5 = 13\text{ ms}$ | RPS: 1,889 | 0% errores

**Veredicto:** RNF05 — ✅ DEMOSTRADO EN ENTORNO DE PRUEBA CONTROLADO Y AISLADO.

## Reproducibilidad del Entorno TEST
**Prerequisito:** PostgreSQL TEST disponible y aislado (ej. clúster local en puerto `5433`).

1. Aplicar esquema oficial:
   ```bash
   psql -h 127.0.0.1 -p 5433 -U postgres_test -d sostenibilidad_test -f base-datos/esquema_inicial.sql
   ```
2. Aplicar dataset sintético:
   ```bash
   psql -h 127.0.0.1 -p 5433 -U postgres_test -d sostenibilidad_test -f servidor/pruebas/rendimiento/seed-rnf05.sql
   ```
3. Configurar temporalmente en el entorno de ejecución:
   ```bash
   URL_BASE_DATOS_TEST=postgresql://postgres_test:test_password_123@127.0.0.1:5433/sostenibilidad_test
   ```
4. Iniciar backend TEST en puerto `4001` con `NODE_ENV=test`.
5. Ejecutar el arnés automatizado:
   ```bash
   node servidor/pruebas/rendimiento/ejecutarPruebasCarga.js
   ```

## Limitaciones
- **Entorno local:** Las mediciones se realizaron en entorno de red local y no incorporan latencia de red WAN ni cómputo en Cloud Run / Neon.
- **Dataset sintético:** La prueba formal evalúa concurrencia y comportamiento de los endpoints sobre un conjunto sintético reducido (10 proveedores de prueba). No constituye una prueba de *capacity planning* respecto a un volumen futuro masivo de proveedores.
- **Aproximación de carga:** Concurrencia HTTP directa como aproximación reproducible a la carga multiusuario.
