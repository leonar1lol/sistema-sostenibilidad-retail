# Respaldo y Recuperación — Requisito RNF09

## 1. Definición Académica Oficial
**RNF09 — Respaldo y recuperación:**  
*“Copias de seguridad diarias y recuperación a un punto en el tiempo de al menos 7 días.”*

El requerimiento exige simultáneamente dos capacidades técnicas diferenciadas:
1. **Copias de seguridad diarias:** Generación periódica y automatizada de una copia de seguridad o snapshot independiente de un punto concreto.
2. **Recuperación a un punto en el tiempo (PITR $\ge$ 7 días):** Historial continuo de transacciones que permita restaurar el estado de la base de datos a un instante específico y arbitrario dentro de una ventana histórica mínima de 7 días continuos.

---

## 2. Diferenciación Conceptual entre Backup y PITR

- **Backup / Copia de Seguridad Discreta:** Copia independiente o instantánea (*snapshot*) de un momento específico en el tiempo (e.g. 03:00 AM). Representa un punto discreto de recuperación; no permite reconstruir estados intermedios entre dos copias sucesivas.
- **PITR (Historial Continuo de Recuperación / Recuperación Point-in-Time):** Capacidad de restaurar la base de datos a cualquier segundo arbitrario dentro de una ventana histórica determinada, apoyándose en la secuencia ininterrumpida de registros de transacciones (*Write-Ahead Logs*, WAL o bitácora de cambios transaccionales).
- **Interpretación Metodológica:** Un mecanismo de backup diario **no** sustituye a la recuperación PITR de 7 días, ni la existencia de PITR exime la necesidad de copias de seguridad discretas periódicas. RNF09 exige ambas garantías de forma concurrente.

---

## 3. Estado Real del Proyecto (Evidencia Empírica en Neon Console)

**Fecha y hora de verificación:** 26 de septiembre de 2026, 07:22 GMT-5  
**Modo de auditoría:** Estricto de solo lectura en la consola web de Neon ([console.neon.tech](https://console.neon.tech)).

### A. Proyecto Neon Identificado (Sanitizado)
- **Proyecto:** `sostenibilidad-retail`
- **Proveedor:** Neon Serverless PostgreSQL
- **Región:** AWS `us-east-2` (Ohio)
- **Base de Datos:** `neondb`
- **Plan Actual:** `Free` ($0 / mes)
- **Rama Activa:** `production`
- **Versión de Motor:** PostgreSQL 18.6

### B. Métricas Actuales de Uso (Consola Real)
- **Período de registro:** Desde 12 de septiembre de 2026.
- **Almacenamiento de base de datos:** `33.08 MB` (cuota incluida en Free: 0.5 GB).
- **Historial WAL (History storage en 6h):** `417.97 kB`.
- **Cómputo acumulado:** `1.18 CU-horas` (cuota incluida en Free: 100 CU-horas/mes; auto-scale `0.25 ↔ 2 CU` con suspensión tras 5 minutos de inactividad).

### C. Configuración Actual de Respaldo y Recuperación
- **Instant Restore:** Habilitado para la rama `production`.
- **Ventana de Historial (*History Window*) Configurada:** **6 horas (`6h`)** (configurada en el valor máximo que permite la interfaz para el plan Free).
- **Máximo de Retención Permitido en Plan Actual:** **6 horas**.
- **Punto Recuperable Más Antiguo Mostrado:** `Sep 26, 2026 1:21 am (GMT-5)` (ventana rodante de 6 horas calculada al momento de la consulta).
- **Snapshots Manuales:** Capacidad disponible, pero **0 snapshots creados**.
- **Respaldos Programados (*Scheduled Backups*):** **NO CONFIGURADOS / BLOQUEADOS**. La consola indica explícitamente: *"Upgrade for schedules"*.

---

## 4. Comparación Oficial de Planes Neon

*Fuente consultada:* Matriz oficial de facturación de Neon en la consola y documentación oficial ([neon.tech/pricing](https://neon.tech/pricing) y [neon.tech/docs/introduction/plans](https://neon.tech/docs/introduction/plans)), verificada el 26 de septiembre de 2026.

| Característica | Plan Free | Plan Launch (Pago por uso) | Plan Scale |
|---|---|---|---|
| **Costo base mensual** | $0 / mes | **$0 / mes base** (*No monthly minimum / pay-as-you-go*) | **$0 / mes base** (*Usage-based pricing*) |
| **Instant Restore / PITR** | **Hasta 6 horas** (o 1 GB de cambios) | **Hasta 7 días** | **Hasta 30 días** |
| **Tarifa de History Storage (WAL)** | Incluido en cuota Free (hasta 1 GB) | $0.20 / GB-mes | $0.20 / GB-mes |
| **Tarifa de Compute** | 100 CU-horas incluidas / mes | $0.106 / CU-hora | $0.222 / CU-hora |
| **Tarifa de Storage de BD** | 0.5 GB incluidos / proyecto | $0.35 / GB-mes | $0.35 / GB-mes |
| **Snapshots manuales** | 1 snapshot manual | Hasta 100 snapshots | Hasta 100 snapshots |
| **Respaldos programados (*Scheduled Backups*)** | **No disponible** (*"Upgrade for schedules"*) | **Disponible** (frecuencias: **Daily**, Weekly, Monthly) | **Disponible** (frecuencias: **Daily**, Weekly, Monthly) |
| **Tarifa de almacenamiento de Snapshots** | N/A | $0.09 / GB-mes | $0.09 / GB-mes |

---

## 5. Matriz de Cumplimiento RNF09 (Producción Operativa Actual)

| Componente del Requisito | Criterio Exigido | Estado Actual en Producción | Diagnóstico Técnico Basado en Evidencia Real |
|---|---|---|---|
| **Respaldo Diario** | Copia de seguridad periódica diaria (snapshot o volcado lógico) | 🔴 **NO CUMPLE ACTUALMENTE** | No existen snapshots programados en Neon (función bloqueada en Free plan: *"Upgrade for schedules"*) ni volcados lógicos programados (`pg_dump`). |
| **PITR $\ge$ 7 Días** | Recuperación point-in-time a cualquier instante en los últimos $\ge$ 7 días | 🔴 **NO CUMPLE ACTUALMENTE** | La ventana real configurada es de **6 horas**, que constituye el límite técnico máximo del plan Free actual. 6 horas es insuficiente para los 7 días requeridos. |
| **RNF09 Global** | Cumplimiento simultáneo de ambas capacidades | 🔴 **NO CUMPLE ACTUALMENTE** | Ninguna de las dos capacidades satisface la especificación formal del requisito bajo la configuración operativa actual de producción. |

---

## 6. Restricción del Proyecto: Costo Adicional = $0 USD

El proyecto establece una restricción estricta de **Costo Adicional = $0 USD**:
- **Descarte de Neon Launch:** Aunque el plan Launch ofrece PITR de 7 días nativo por ~$0.30 - $1.00 USD/mes, cualquier plan de pago queda descartado.
- **Mantener Neon Free:** Se conserva el plan Free ($0 USD).
- **Enfoque Técnico:** Diseñar e implementar una solución de respaldo y recuperación temporal gestionada por la arquitectura de la aplicación, utilizando exclusivamente capas gratuitas garantizadas (*free tiers*).

---

## 7. Validación de Corrección Temporal y Transaccional (Fase 7C)

En la Fase 7C se sometió el mecanismo de journaling por triggers a pruebas rigurosas de frontera temporal y concurrencia transaccional en un entorno PostgreSQL 18 local aislado (puerto 5433).

### A. Problema de Commit Timestamp y Transacciones Largas
- **Hipótesis evaluada:** En el diseño básico inicial, el trigger DML registraba `fecha_evento = clock_timestamp()` al ejecutarse la sentencia (`UPDATE`), no al confirmarse la transacción (`COMMIT`).
- **Escenario ejecutado:**
  - T0: BEGIN Transacción A.
  - T1: UPDATE en tabla `proveedor` dentro de Transacción A.
  - T2: TARGET_TIME de recuperación.
  - T3: COMMIT de Transacción A (T3 > T2).
- **Resultado empírico:** **FALLA**.
  El restaurador evaluó la fecha del evento según la hora de ejecución del UPDATE (T1 $\le$ T2), aplicando indebidamente la modificación en la base restaurada, a pesar de que en T2 la transacción no estaba confirmada.

### B. Comprobación Real de `track_commit_timestamp`
Se verificó el parámetro nativo de PostgreSQL tanto en el entorno de pruebas local como en la base productiva de Neon (en modo estricto de solo lectura):
- **Local Test (PostgreSQL 18.4):**
  - `SHOW track_commit_timestamp;` $\to$ **`off`**
  - `SELECT current_setting('track_commit_timestamp');` $\to$ **`off`**
- **Neon Free Productivo (PostgreSQL 18.6):**
  - `SHOW track_commit_timestamp;` $\to$ **`off`**
  - `SELECT current_setting('track_commit_timestamp');` $\to$ **`off`**
- **Diagnóstico Técnico:** Al estar deshabilitado (`off`), PostgreSQL **no almacena** marcas temporales de commit y la función `pg_xact_commit_timestamp()` no está disponible. Al ser un parámetro de contexto `postmaster`, requiere reinicio del servidor y privilegios de superusuario (no disponibles en Neon Free).

### C. Prueba de Orden Inverso de COMMIT
- **Escenario ejecutado:**
  - Transacción A inicia en $T_{A0}$, ejecuta UPDATE en fila 1 en $T_{A1}$ y se mantiene abierta.
  - Transacción B inicia en $T_{B0}$, ejecuta UPDATE en fila 2 en $T_{B1}$ y ejecuta COMMIT en $T_{B2}$.
  - TARGET_TIME fijado en $T_{\text{target}}$ ($T_{B2} < T_{\text{target}}$).
  - Transacción A ejecuta COMMIT en $T_{A2}$ ($T_{A2} > T_{\text{target}}$).
- **Resultado esperado:** Fila 2 modificada por B debe existir; fila 1 modificada por A **no** debe existir.
- **Resultado con diseño inicial:** **FALLA**. Al depender de la hora del DML, la modificación de A se incluyó erróneamente en el estado restaurado.

### D. Solución Técnica Demostrada: Triggers Diferidos de Restricción
- Se evaluó el uso de `CREATE CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED`.
- **Comportamiento en PostgreSQL:** Los triggers de restricción diferidos no se disparan durante la ejecución del DML, sino al final del bloque transaccional, en el momento inmediatamente anterior a la confirmación del COMMIT.
- Si la transacción se revierte (`ROLLBACK`), el trigger diferido nunca se ejecuta.
- Al ejecutarse al cierre de la transacción, `clock_timestamp()` captura la hora en ese instante, asociando `id_transaccion` con su `fecha_cierre_transaccion_aprox`.
- **Precisión de la marca temporal:** El campo se denomina `fecha_cierre_transaccion_aprox` (no `fecha_commit`) porque el trigger diferido se ejecuta **justo antes** de que el COMMIT quede definitivamente completado en el WAL. Adicionalmente, si un cliente ejecuta `SET CONSTRAINTS <nombre> IMMEDIATE;`, el trigger puede dispararse anticipadamente dentro de la transacción, antes del COMMIT real. Esta es una limitación conocida documentada en la Fase 7D.

### E. Consistencia en la Frontera del Backup Base (Snapshot Consistency)
- Se evaluó el corte entre el volcado base (`pg_dump` con aislamiento `REPEATABLE READ`) y el journal transaccional.
- **Escenario:** Transacción A modificó una fila antes de iniciar el backup; el backup capturó el valor original (A invisible en el snapshot). Al finalizar el backup, A hizo COMMIT.
- **Resultado al restaurar base + journal:** La modificación de A se aplicó exactamente **UNA VEZ**, sin duplicados y sin pérdidas (**✅ CORRECTO**).
- **Marcador reproducible:** PostgreSQL exporta snapshots consistentes (`pg_current_snapshot()`, `xmin:xmax:xip_list`).

### F. Análisis Físico de Restricciones (Constraints) en el Esquema
Se inspeccionó físicamente el archivo [`base-datos/esquema_inicial.sql`](../../base-datos/esquema_inicial.sql) determinando el estado de deferrabilidad de todas las restricciones:

| Constraint | Tabla | Tipo | Deferrable | Impacto en Restore |
|---|---|---|---|---|
| `rol_pkey` (`id_rol`) | `rol` | PK | **NOT DEFERRABLE** | Requiere PK antes de insertar FKs dependientes. |
| `rol_nombre_key` (`nombre`) | `rol` | UNIQUE | **NOT DEFERRABLE** | Falla inmediatamente si hay duplicados en replay. |
| `permiso_pkey` (`id_permiso`) | `permiso` | PK | **NOT DEFERRABLE** | Inserciones deben preceder a referencias FK. |
| `permiso_codigo_key` (`codigo`) | `permiso` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `rol_permiso_pkey` (`id_rol_permiso`) | `rol_permiso` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `rol_permiso_id_rol_fkey` | `rol_permiso` | FK | **NOT DEFERRABLE** | Requiere existencia previa de `rol`. |
| `rol_permiso_id_permiso_fkey` | `rol_permiso` | FK | **NOT DEFERRABLE** | Requiere existencia previa de `permiso`. |
| `rol_permiso_id_rol_id_permiso_key` | `rol_permiso` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `unidad_negocio_pkey` (`id_unidad`) | `unidad_negocio` | PK | **NOT DEFERRABLE** | Inserción previa a tablas dependientes. |
| `unidad_negocio_codigo_key` (`codigo`) | `unidad_negocio` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `usuario_pkey` (`id_usuario`) | `usuario` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `usuario_correo_key` (`correo`) | `usuario` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `usuario_id_rol_fkey` | `usuario` | FK | **NOT DEFERRABLE** | Requiere `rol` previo. |
| `usuario_id_unidad_fkey` | `usuario` | FK | **NOT DEFERRABLE** | Requiere `unidad_negocio` previa. |
| `industria_pkey` (`id_industria`) | `industria` | PK | **NOT DEFERRABLE** | Inserción previa a proveedores. |
| `industria_codigo_key` (`codigo`) | `industria` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `proveedor_pkey` (`id_proveedor`) | `proveedor` | PK | **NOT DEFERRABLE** | Base para evaluaciones y OTP. |
| `proveedor_ruc_key` (`ruc`) | `proveedor` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `proveedor_id_unidad_fkey` | `proveedor` | FK | **NOT DEFERRABLE** | Requiere `unidad_negocio` previa. |
| `proveedor_id_industria_fkey` | `proveedor` | FK | **NOT DEFERRABLE** | Requiere `industria` previa. |
| `dimension_pkey` (`id_dimension`) | `dimension` | PK | **NOT DEFERRABLE** | Inserción previa a ítems. |
| `dimension_codigo_key` (`codigo`) | `dimension` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `item_pkey` (`id_item`) | `item` | PK | **NOT DEFERRABLE** | Inserción previa a alternativas. |
| `item_codigo_key` (`codigo`) | `item` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `item_id_dimension_fkey` | `item` | FK | **NOT DEFERRABLE** | Requiere `dimension` previa. |
| `item_industria_pkey` (`id_item_industria`) | `item_industria` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `item_industria_id_item_fkey` | `item_industria` | FK | **NOT DEFERRABLE** | Requiere `item` previo. |
| `item_industria_id_industria_fkey` | `item_industria` | FK | **NOT DEFERRABLE** | Requiere `industria` previa. |
| `item_industria_id_item_id_industria_key` | `item_industria` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `alternativa_pkey` (`id_alternativa`) | `alternativa` | PK | **NOT DEFERRABLE** | Inserción previa a respuestas. |
| `alternativa_id_item_fkey` | `alternativa` | FK | **NOT DEFERRABLE** | Requiere `item` previo. |
| `regla_condicional_pkey` (`id_regla`) | `regla_condicional` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `regla_id_item_origen_fkey` | `regla_condicional` | FK | **NOT DEFERRABLE** | Requiere `item` previo. |
| `regla_id_alternativa_fkey` | `regla_condicional` | FK | **NOT DEFERRABLE** | Requiere `alternativa` previa. |
| `regla_id_item_destino_fkey` | `regla_condicional` | FK | **NOT DEFERRABLE** | Requiere `item` previo. |
| `campania_pkey` (`id_campania`) | `campania` | PK | **NOT DEFERRABLE** | Inserción previa a evaluaciones. |
| `evaluacion_pkey` (`id_evaluacion`) | `evaluacion` | PK | **NOT DEFERRABLE** | Inserción previa a respuestas. |
| `evaluacion_id_campania_fkey` | `evaluacion` | FK | **NOT DEFERRABLE** | Requiere `campania` previa. |
| `evaluacion_id_proveedor_fkey` | `evaluacion` | FK | **NOT DEFERRABLE** | Requiere `proveedor` previo. |
| `evaluacion_token_key` (`token`) | `evaluacion` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `evaluacion_id_campania_id_proveedor_key` | `evaluacion` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `respuesta_pkey` (`id_respuesta`) | `respuesta` | PK | **NOT DEFERRABLE** | Inserción previa a evidencias. |
| `respuesta_id_evaluacion_fkey` | `respuesta` | FK | **NOT DEFERRABLE** | Requiere `evaluacion` previa. |
| `respuesta_id_item_fkey` | `respuesta` | FK | **NOT DEFERRABLE** | Requiere `item` previo. |
| `respuesta_id_alternativa_fkey` | `respuesta` | FK | **NOT DEFERRABLE** | Requiere `alternativa` previa. |
| `respuesta_id_evaluacion_id_item_key` | `respuesta` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `puntaje_dimension_pkey` (`id_puntaje`) | `puntaje_dimension` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `puntaje_id_evaluacion_fkey` | `puntaje_dimension` | FK | **NOT DEFERRABLE** | Requiere `evaluacion` previa. |
| `puntaje_id_dimension_fkey` | `puntaje_dimension` | FK | **NOT DEFERRABLE** | Requiere `dimension` previa. |
| `puntaje_id_evaluacion_id_dimension_key` | `puntaje_dimension` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `recomendacion_pkey` (`id_recomendacion`) | `recomendacion` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `recomendacion_id_dimension_fkey` | `recomendacion` | FK | **NOT DEFERRABLE** | Requiere `dimension` previa. |
| `evidencia_pkey` (`id_evidencia`) | `evidencia` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `evidencia_id_respuesta_fkey` | `evidencia` | FK | **NOT DEFERRABLE** | Requiere `respuesta` previa. |
| `evidencia_clave_r2_key` (`clave_r2`) | `evidencia` | UNIQUE | **NOT DEFERRABLE** | Verificación inmediata. |
| `auditoria_pkey` (`id_auditoria`) | `auditoria` | PK | **NOT DEFERRABLE** | Inserción directa. |
| `auditoria_id_usuario_fkey` | `auditoria` | FK | **NOT DEFERRABLE** | Requiere `usuario` o valor nulo. |
| `auditoria_id_evaluacion_fkey` | `auditoria` | FK | **NOT DEFERRABLE** | Requiere `evaluacion` o valor nulo. |

**Conclusión Metodológica:**  
El 100% de las restricciones son `NOT DEFERRABLE`. Por lo tanto, `SET CONSTRAINTS ALL DEFERRED;` **no difiere ninguna restricción** en PostgreSQL. Asimismo, en Neon Free la ejecución de `SET session_replication_role = 'replica';` genera un error de permisos (`permission denied to set parameter "session_replication_role"`). Por consiguiente, la restauración debe ejecutar las operaciones respetando rigurosamente el orden topológico y cronológico de dependencias.

### G. Prueba con FK Real (Padre e Hijo)
- Escenario: Inserción de padre (`proveedor`) seguida de hijo (`evaluacion`), y posterior eliminación de hijo seguida de padre.
- Resultado al reproducir en la base de recuperación: **✅ 0 violaciones de Foreign Key**.

### H. Prevención de Auto-Replay Durante la Restauración
- Se incorporó la variable de sesión `sostenibilidad.modo_recuperacion` en la función de trigger `fn_registrar_cambio_recuperacion()`:
  ```sql
  IF current_setting('sostenibilidad.modo_recuperacion', true) = 'true' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  ```
- Al iniciar la transacción de restauración en `restaurarPuntoTiempo.js`, se ejecuta:
  `SET LOCAL sostenibilidad.modo_recuperacion = 'true';`
- **Verificación empírica:** Conteo de eventos en `registro_recuperacion` en la base destino: 0 antes del replay $\to$ 0 después del replay (**✅ Cero eventos autogenerados**).

---

## 8. Análisis de Replicación Lógica (*Logical Replication*) en Neon Free
Se analizó si la replicación lógica nativa de PostgreSQL permitiría capturar `BEGIN`, `COMMIT` y commit timestamps:
- **Disponibilidad en Neon Free:** La replicación lógica puede estar disponible a nivel de funcionalidad de motor. Sin embargo, el uso de un *replication slot* con un consumidor conectado de forma continua impide que el cómputo de Neon se suspenda tras el tiempo de inactividad (*scale-to-zero*).
- **Ruptura de Escala a Cero (*Scale-to-Zero*):** Un consumidor continuamente conectado mantiene un WAL sender activo, bloqueando la suspensión automática del cómputo. Esto implica que el cómputo permanecería activo de forma permanente.
- **Impacto Económico Real:** Si el cómputo permaneciera activo permanentemente a la potencia mínima (0.25 CU), el consumo sería: $0.25 \times 24 \times 30 \approx 180$ CU-horas/mes, superando la cuota incluida de 100 CU-horas mensuales del plan Free. A partir de las 100 CU-horas/mes de cuota se aplicaría tarifa adicional, lo que viola la restricción de $0 USD.
- **Veredicto:** **DESCARTADA** porque un consumidor continuamente conectado impide *scale-to-zero* e impacta en el consumo de cómputo más allá de la cuota gratuita.


---

## 9. Política de Retención Ampliada: 9 Días ($0 USD)
Se evaluó ampliar la retención en Cloudflare R2 de 8 días a **9 días**:
- **Fundamento Técnico:** Otorga un margen de seguridad de 48 horas adicionales sobre la ventana de 7 días exigida por RNF09, absorbiendo posibles retrasos en la corrida nocturna de `pg_dump` y garantizando que siempre exista un respaldo base completo anterior al punto más antiguo de la ventana de 7 días.
- **Impacto en Almacenamiento:** Con 9 respaldos diarios base (~297 MB) y journals bi-horarios (~30 MB), el almacenamiento total estimado asciende a **~327 MB**, representando menos del **3.3% de la cuota gratuita de 10 GB** de Cloudflare R2 (**$0.00 USD**).

---

## 10. Delimitación de Exactitud y Alcance Técnico

- **Afirmación formal de la prueba de Fase 7B:**  
  *“7/7 verificaciones aprobadas en el escenario determinista evaluado”.*
- **Conclusión de la auditoría de Fase 7C:**  
  Ante transacciones concurrentes con commits retardados o desfasados respecto al orden de inicio, un journal basado exclusivamente en triggers DML ordinarios sin seguimiento de commit puede desalinearse del estado confirmado de PostgreSQL. Con triggers de restricción diferidos o boundaries basados en snapshots consistentes de PostgreSQL, es posible acotar la frontera transaccional en entornos controlados.
- **Clasificación del Prototipo:**  
  *“Recuperación temporal gestionada por la aplicación con limitaciones conocidas de concurrencia en PostgreSQL sin track_commit_timestamp”.*

---

## 11. Matriz de Cumplimiento Final de RNF09

- **Entorno de Producción Operativa:**  
  🔴 **NO CUMPLE ACTUALMENTE**  
  *(Neon Free mantiene History Window de 6 horas y backups programados bloqueados en la consola).*
- **Entorno de Pruebas Aislado (Prototipo Técnico $0 USD):**  
  🟡 **PROTOTIPO TÉCNICO EN EVALUACIÓN Y VALIDACIÓN CON LIMITACIONES CONOCIDAS EN ENTORNO TEST AISLADO**  
  *(Cifrado AES-256-GCM validado, supresión de auto-replay demostrada, preservación de integridad FK comprobada y fronteras de consistencia auditadas formalmente).*

---

## 12. Hallazgos Formales de Fase 7D — Frontera Backup/Journal y Precisión Temporal

### A. Terminología Corregida: `fecha_cierre_transaccion_aprox`

El campo de marcaje temporal del trigger diferido se denomina `fecha_cierre_transaccion_aprox` y no `fecha_commit`. La distinción es técnicamente crítica:

- Un `CONSTRAINT TRIGGER DEFERRABLE INITIALLY DEFERRED` se ejecuta al final de la transacción, justo antes de que el COMMIT quede definitivamente escrito en el WAL.
- El valor de `clock_timestamp()` en ese instante es una aproximación al cierre transaccional, no un timestamp exacto de COMMIT nativo de PostgreSQL.
- Si un cliente ejecuta `SET CONSTRAINTS <nombre> IMMEDIATE;`, el trigger diferido puede dispararse dentro de la transacción, antes del COMMIT real. Limitación demostrada empíricamente en la Prueba 1 de Fase 7D.

### B. Separación Formal: Frontera de Backup vs. Frontera de Tiempo Objetivo

| Frontera | Mecanismo | Precisión | Resultado |
|---|---|---|---|
| **BACKUP BOUNDARY** | `pg_export_snapshot()` + `pg_current_snapshot()` en `REPEATABLE READ` | Exacta vía visibilidad MVCC (xid8) | Determinista y reproducible |
| **TARGET TIME BOUNDARY** | `fecha_cierre_transaccion_aprox` del trigger diferido | Aproximada; puede adelantarse con `SET CONSTRAINTS IMMEDIATE` | Suficiente para entornos no hostiles |

El nombre formal del mecanismo es: recuperación point-in-time gestionada por la aplicación con frontera de backup basada en visibilidad MVCC y marca temporal de cierre transaccional aproximada. No denominarlo PITR nativo de PostgreSQL.

### C. Verificación de Visibilidad MVCC — Escenarios A-E

Se ejecutaron 5 escenarios deterministas usando `pg_visible_in_snapshot(xid8, pg_snapshot)` sobre PostgreSQL 18.4 embebido (puerto 5433):

| Escenario | Descripción | pg_visible_in_snapshot | Acción Correcta |
|---|---|---|---|
| A | Tx terminada con COMMIT antes del snapshot | true | Ya en dump — NO replay |
| B | Tx abierta durante snapshot, COMMIT posterior | false (antes y después de COMMIT) | NO en dump — SÍ replay |
| C | Tx inicia y termina después del snapshot | false | NO en dump — SÍ replay |
| D | Tx con ROLLBACK | false; 0 eventos en journal | NO en dump — NO replay |
| E | Múltiples UPDATE en misma Tx | Estado final correcto sin duplicación | Correcto |

Resultado de la suite Fase 7D: 17/17 verificaciones aprobadas.

### D. Manifest de Backup — Campos y Validación SHA-256

El módulo `servicioManifest.js` genera y valida manifests con los siguientes campos (sin credenciales):

| Campo | Descripción |
|---|---|
| `version` | Versión del formato del manifest |
| `fechaBackup` | ISO 8601 del momento de generación |
| `snapshot` | Snapshot MVCC de PostgreSQL (xmin:xmax:xip_list) |
| `postgresVersion` | Versión del motor PostgreSQL |
| `versionEsquema` | Versión del esquema de migración |
| `algoritmoCifrado` | Algoritmo usado (AES-256-GCM) |
| `sha256DumpCifrado` | Hash SHA-256 del dump cifrado (hex 64 chars) |
| `tamanoDumpCifradoBytes` | Tamaño en bytes del dump cifrado |

El hash SHA-256 del dump cifrado complementa el Auth Tag de AES-256-GCM: el Auth Tag verifica integridad durante el descifrado; el SHA-256 permite verificarla antes del descifrado y para auditoría externa.

### E. Limitaciones Conocidas Confirmadas en Fase 7D

1. `fecha_cierre_transaccion_aprox` no es un timestamp nativo de COMMIT; es una aproximación generada por trigger diferido.
2. `SET CONSTRAINTS <nombre> IMMEDIATE` puede adelantar el trigger diferido antes del COMMIT real.
3. `track_commit_timestamp = OFF` en ambos entornos (PostgreSQL 18.4 local y Neon Free 18.6); `pg_xact_commit_timestamp()` no disponible.
4. `session_replication_role = 'replica'` bloqueado en Neon Free; se usa `sostenibilidad.modo_recuperacion` como alternativa sin requerir superusuario.
5. Todas las restricciones del esquema son `NOT DEFERRABLE`; el restore exige orden topológico estricto de dependencias.

---

## 13. Preparación Operacional (Fase 7E)

### A. Scripts Operacionales Creados
Se han preparado los componentes operacionales para la ejecución en producción sin haberlos ejecutado contra recursos cloud (aislamiento estricto):

1. **`clienteR2Backup.js`:**
   - Cliente específico para backups basado en `@aws-sdk/client-s3`.
   - Espacio de claves exclusivo: `database-backups/`.
   - Métodos: `subirObjetoBackup`, `descargarObjetoBackup`, `listarObjetosBackup`, `eliminarObjetosVencidos`.
   - Protección estricta: lanza error si se intenta operar fuera del prefijo `database-backups/`.
   - Variables de entorno: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_BACKUP`.

2. **`crearBackupDiario.js`:**
   - Abre conexión coordinadora y ejecuta `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;`.
   - Captura `pg_export_snapshot()` y `pg_current_snapshot()`.
   - Ejecuta `pg_dump` con el parámetro `--snapshot`.
   - Cifra el contenido con AES-256-GCM.
   - Genera manifest JSON con SHA-256 del dump cifrado.
   - Elimina inmediatamente el archivo temporal plaintext.
   - Cierra la transacción coordinadora con `COMMIT;`.
   - Sube `backup.enc` y `manifest.json` a `database-backups/full/YYYY-MM-DD/`.

3. **`exportarJournal.js`:**
   - Consulta incremental de la tabla `registro_recuperacion` en una ventana de 2 horas.
   - Incluye `id_registro`, `nombre_tabla`, `operacion`, `xid_transaccion`, `fecha_cierre_transaccion_aprox`, `datos_anteriores`, `datos_nuevos`.
   - Cifra con AES-256-GCM.
   - Sube a `database-backups/journal/YYYY-MM-DD/HH.enc` y `manifest.json`.

### B. Condición Operativa sobre `SET CONSTRAINTS ... IMMEDIATE`
Las escrituras de producción son realizadas por la aplicación y sus servicios controlados, los cuales no ejecutan `SET CONSTRAINTS ... IMMEDIATE`. El uso de dicha instrucción mediante accesos directos administrativos queda fuera del procedimiento normal de operación.

### C. Aclaración de Integridad del Manifest
- **SHA-256:** Permite la verificación operativa del objeto cifrado (detecta corrupción o alteraciones del dump cuando el manifest permanece intacto).
- **AES-256-GCM Auth Tag:** Garantiza la integridad y autenticidad criptográfica del contenido cifrado frente a cualquier manipulación, validado durante el descifrado.

### D. Plantillas de GitHub Actions (No Activas)
Ubicadas en `servidor/pruebas/recuperacion/workflows/` (fuera de `.github/workflows/` para evitar ejecución accidental):
- `backup-diario.yml.template`: Programación diaria a las 02:00 UTC con `ubuntu-latest`.
- `journal-recuperacion.yml.template`: Programación bi-horaria (`0 */2 * * *`) con `ubuntu-latest`.
- Referencian exclusivamente secrets de repositorio: `NEON_BACKUP_DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_BACKUP`, `BACKUP_ENCRYPTION_KEY`.

### E. Resultados de la Suite Operacional (Entorno Local Aislado)
- Creación de backup cifrado: ✅
- Eliminación de archivo temporal plaintext: ✅
- Manifest SHA-256 validado: ✅
- Exportación incremental de journal: ✅
- Purga de objetos vencidos (>9 días): ✅ (0 eliminados para objetos recientes)
- Protección contra operaciones fuera del prefijo `database-backups/`: ✅
- Manejo de error en `pg_dump`: ✅
- Manejo de error en upload: ✅
- **Restore end-to-end operacional a punto en el tiempo:** ✅ (estado recuperado exactamente igual al valor confirmado en el TARGET_TIME: `'Proveedor Modificado'`).

### F. Estado Formal del Requisito RNF09
- **Entorno de Producción Operativa:** 🔴 **NO CUMPLE ACTUALMENTE** (Neon Free mantiene History Window de 6 horas; backups diarios programados bloqueados en la consola).
- **Componentes Operacionales de la Aplicación:** 🟡 **PREPARADOS Y VALIDADOS EN ENTORNO LOCAL AISLADO** (pendientes de despliegue controlado de infraestructura cloud: creación de bucket R2, configuración de secrets y activación de workflows).

---

## 14. Adaptación Operacional a GitHub Actions Artifacts (Fase 7F-B)

### A. Arquitectura Seleccionada Oficial ($0.00 USD)
Tras la auditoría en vivo de Cloudflare que confirmó la exigencia de un checkout de suscripción con posible registro de método de pago, se descartó formalmente Cloudflare R2 para RNF09. La arquitectura oficial se redefine exclusivamente sobre el ecosistema nativo de GitHub:

- **Repositorio Privado Exclusivo:** `sostenibilidad-retail-backups` (visibilidad PRIVATE).
- **Orquestación:** GitHub Actions sobre ejecutores estándar `ubuntu-latest`.
- **Almacenamiento de Respaldo:** GitHub Actions Artifacts cifrados mediante `actions/upload-artifact@v4`.
- **Retención Automatizada:** `retention-days: 9` nativo (GitHub purga automáticamente los artefactos al cumplir 9 días sin requerir scripts externos).
- **Base de Datos Operativa:** Neon PostgreSQL Free ($0.00 USD).

### B. Descarte Formal de Cloudflare R2
*«Alternativa descartada para RNF09 debido a requerir activación de suscripción / método de facturación, incompatible con la restricción operativa de costo adicional $0 del usuario.»*
- Cloudflare Pages continúa operativo sirviendo el frontend sin alteraciones.
- `clienteR2Backup.js` y `entradaPurgaBackup.js` permanecen en el repositorio clasificados formalmente como *backend de almacenamiento alternativo no utilizado*.

### C. Desacoplamiento de Scripts y Directorio de Salida
Los scripts de Node.js no realizan operaciones de red para subir archivos ni interactúan con APIs de almacenamiento. Su responsabilidad se delimita estrictamente a:
1. **`crearBackupDiario.js`:** Genera `backup.enc` y `manifest.json` en `BACKUP_OUTPUT_DIR`.
2. **`exportarJournal.js`:** Genera `journal.enc` y `manifest.json` en `BACKUP_OUTPUT_DIR`.
3. **Workflow de GitHub Actions:** Es el único componente responsable de invocar `actions/upload-artifact@v4` con `retention-days: 9`.
4. **Directorio configurable:** `BACKUP_OUTPUT_DIR` permite dirigir la salida a un directorio temporal seguro del runner (`${{ runner.temp }}/...`), garantizando que ningún archivo cifrado ni volcado se escriba dentro del árbol versionable del repositorio.

### D. Plantillas de Workflow para el Repositorio Privado
Ubicadas en `servidor/pruebas/recuperacion/workflows/` (no activas en el repositorio público):
- [`backup-diario-github.yml.template`](file:///d:/Backup/Descargas/Curso%20Integrador%20Ii%20Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/workflows/backup-diario-github.yml.template): Programación diaria a las 02:00 UTC; clona el repositorio público con `GITHUB_TOKEN` estándar (sin requerir Personal Access Tokens / PAT); ejecuta `entradaBackupDiario.js`; sube artefacto `backup-full-YYYY-MM-DD` con `retention-days: 9`.
- [`journal-recuperacion-github.yml.template`](file:///d:/Backup/Descargas/Curso%20Integrador%20Ii%20Sistemas/Software/plataforma-sostenibilidad-retail/servidor/pruebas/recuperacion/workflows/journal-recuperacion-github.yml.template): Programación bi-horaria (`0 */2 * * *`); clona repositorio público; ejecuta `entradaExportarJournal.js`; sube artefacto `journal-YYYY-MM-DD-HH` con `retention-days: 9`.

### E. Secretos de Repositorio Requeridos
El diseño simplificado elimina la totalidad de credenciales de Cloudflare R2, requiriendo únicamente dos secretos alojados en el repositorio privado:
1. `NEON_BACKUP_DATABASE_URL`: Cadena de conexión directa a PostgreSQL Neon (sin pooler).
2. `BACKUP_ENCRYPTION_KEY`: Clave simétrica de 32 bytes para cifrado AES-256-GCM.

### F. Análisis Conservador de Cuotas y Viabilidad a Largo Plazo
- **Almacenamiento de Artefactos:**
  - Valor mostrado en la cuenta auditada (GitHub Pro Edu): 2 GB (2,048 MB).
  - Valor general publicado en GitHub Docs: 1 GB (GitHub Pro) / 500 MB (GitHub Free).
  - Consumo proyectado para 9 días (9 backups full de ~33 MB + 108 journals bi-horarios): **~325 MB**.
  - Ocupación: 15.8% (sobre 2 GB), 32.5% (sobre 1 GB) y 65.0% (sobre 500 MB de GitHub Free).
  - **Independencia del beneficio Pro:** El mecanismo es plenamente viable incluso si la cuenta pasara al plan GitHub Free estándar (65% < 80% del umbral de alerta operacional).
- **Minutos de Cómputo Actions:**
  - Consumo proyectado: 1 backup + 12 journals diarios $\times$ 30 días $\approx$ 390 minutos/mes.
  - Ocupación: 13.0% de los 3,000 min de Pro; 19.5% de los 2,000 min de Free.
- **Garantía Económica:** Cuenta sin método de pago registrado y Spending Limit configurado en $0.00 con política *Stop usage*, impidiendo cualquier facturación imprevista.

### G. Especificaciones Técnicas y Validaciones Fase 7F-B3

1. **Requerimiento y Validación Estricta de `pg_dump` 18.x:**
   - La base de datos de producción corre PostgreSQL 18.6 (Neon Serverless). PostgreSQL exige que la herramienta de volcado no sea de una versión mayor anterior a la del servidor.
   - En la plantilla de workflow de respaldo se garantiza la versión 18 mediante la instalación de `postgresql-client-18` desde el repositorio oficial PGDG (`apt.postgresql.org`).
   - Los scripts de respaldo implementan validación programática en Node.js (`validarVersionPgDumpMinimo18`) que inspecciona la salida de `pg_dump --version` y rechaza versiones anteriores a la 18 o salidas con formato corrupto.
   - Se incorpora soporte para la variable de entorno `PG_DUMP_BIN`, permitiendo apuntar al binario exacto (`/usr/lib/postgresql/18/bin/pg_dump`).

2. **Versiones Alineadas y Entorno de Ejecución en GitHub Actions:**
   - `actions/checkout@v7`
   - `actions/setup-node@v7` con `node-version: 20` (alineado con la versión LTS de Node.js utilizada en CI y desarrollo).
   - `actions/upload-artifact@v4` (con política de retención nativa `retention-days: 9`).
   - Paths de ejecución estandarizados mediante `working-directory: servidor` e invocación limpia `node scripts/respaldo/...`.
   - Instalación de dependencias: `npm ci --omit=dev` en `working-directory: servidor` (instala las dependencias de producción declaradas en `servidor/package.json`, omitiendo devDependencies).
   - En el workflow de journal no se instala el cliente PostgreSQL, ya que opera exclusivamente vía Node.js (`pg`).

3. **Verificación de Herramientas de Construcción (Vite):**
   - Versión real de Vite instalada: **5.4.21** (confirmada en `cliente/node_modules/vite` y `cliente/package-lock.json`).
   - Resultado de compilación: `npm.cmd --prefix cliente run construir` finaliza con `EXIT_CODE=0`.
   - Advertencia registrada (warning no bloqueante): `Some chunks are larger than 500 kB after minification` (`dist/assets/index-BUrSb5r6.js: 576.76 kB`), propia de la empaquetación monolítica sin code-splitting dinámico.

4. **Resultados de la Suite Operacional Fase 7F (21 Verificaciones en 8 Escenarios Temáticos - 0 Fallos):**
   - **Escenario 1 (Backup Diario):** Generación exacta de `backup.enc` + `manifest.json` y eliminación inmediata de archivos temporales plaintext: ✅ **3/3 verificaciones**
   - **Escenario 2 (Journal Incremental):** Exportación incremental periódica de la bitácora transaccional en `journal.enc` + manifest: ✅ **2/2 verificaciones**
   - **Escenario 3 (Integridad Criptográfica):** Validación de hash SHA-256 en manifest y detección inmediata de alteraciones/tampering: ✅ **3/3 verificaciones**
   - **Escenario 4 (Autonomía de Almacenamiento):** Ejecución 100% exitosa sin variables de entorno ni dependencias de Cloudflare R2: ✅ **2/2 verificaciones**
   - **Escenario 5 (Directorio Configurable):** Aislamiento de artefactos en `BACKUP_OUTPUT_DIR` sin contaminar el árbol del repositorio: ✅ **2/2 verificaciones**
   - **Escenario 6 (Resiliencia ante Errores):** Manejo de fallos en volcado o cifrado garantizando cero fugas de archivos temporales: ✅ **3/3 verificaciones**
   - **Escenario 7 (Validación de `pg_dump` 18):** Detección y aceptación de versiones 18.0 y 18.4; rechazo estricto de versiones obsoletas (17.2, 16.4) y formatos corruptos; verificación de resolución mediante `PG_DUMP_BIN`: ✅ **5/5 verificaciones**
   - **Escenario 8 (Restauración End-to-End PITR):** Restauración completa a punto en el tiempo desde dump base + journal cifrado recuperando el estado exacto (`valorRestaurado = 'Proveedor 7F Modificado'`): ✅ **1/1 verificación**

### H. Matriz de Cumplimiento Actualizada
- **Entorno de Producción Operativa:**  
  🔴 **NO CUMPLE ACTUALMENTE**  
  *(Neon Free mantiene History Window nativa de 6 horas; el repositorio privado y los workflows aún no han sido creados ni activados).*
- **Arquitectura de Costo Cero ($0.00 USD):**  
  🟡 **PROTOTIPO OPERACIONAL ADAPTADO A GITHUB ARTIFACTS Y VALIDADO LOCALMENTE (21/21 verificaciones en 8 escenarios temáticos - 0 fallos)**.
