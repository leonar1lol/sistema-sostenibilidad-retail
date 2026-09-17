# Plataforma de Evaluación de Sostenibilidad de Proveedores - Intercorp Retail

Proyecto desarrollado para el curso **Curso Integrador II. Sistemas** en la **Universidad Tecnológica del Perú (UTP)**, ciclo 2026.

## 👥 Integrantes

* **Leonardo Raul Solano Pio Huaman** (U22210128)
* **Carloman Coronel Cruz** (U22234047)
* **Carlos Juniors Chiroque Silva** (U21322900)
* **Frank Alex Beltran Ponce** (U22238182)
* **Gianfranco Daniel Navarro Flores** (U21304958)

**Docente:** Denny John Fuentes Adrianzen

---

## 📌 Descripción

Este sistema web centraliza y automatiza el proceso de evaluación de sostenibilidad (criterios ambientales, sociales y de gobernanza - ESG) para los proveedores de las empresas del grupo Intercorp Retail: Supermercados Peruanos, Promart, Oechsle, Real Plaza, Farmacias Peruanas, SIP e Intercorp Retail Sucursal China.

Implementación **real, desplegada en producción** (no demo/mock): base de datos, autenticación, correo transaccional, almacenamiento de archivos y monitoreo son servicios reales, no simulados.

La plataforma tiene dos accesos, separados por ruta para que el portal público del proveedor nunca exponga ni un botón hacia el panel administrativo:

1. **Portal del Proveedor** (`/`) — acceso por correo + código OTP de un solo uso, registro societario, cuestionario dinámico por industria con motor de reglas condicionales, carga opcional de evidencia documental por ítem (RF25), cálculo automático del puntaje ponderado y correo de resultado con recomendaciones.
2. **Panel Corporativo** (`/admin`, ruta no enlazada desde el portal público) — autenticación propia (bcrypt + JWT), dashboard con KPIs reales, gestión de proveedores/banco de ítems/campañas/usuarios y roles, bitácora de auditoría, exportación a Excel.

---

## 🌐 Producción

| Componente | URL |
|---|---|
| Frontend (Cloudflare Pages) | https://plataforma-sostenibilidad.pages.dev |
| Backend / API (Google Cloud Run) | https://plataforma-sostenibilidad-api-42337725028.us-east1.run.app |
| Base de datos (Neon PostgreSQL) | privada, ver `servidor/.env` (gitignored) |

---

## 🛠️ Tecnologías

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React — desplegado en Cloudflare Pages
* **Backend:** Node.js, Express — contenedor en Google Cloud Run
* **Base de datos:** PostgreSQL serverless (Neon)
* **Almacenamiento de archivos:** Cloudflare R2 (evidencia documental, RF25)
* **Correo transaccional:** Resend (OTP, recordatorios, resultados)
* **Observabilidad:** Sentry (errores de aplicación, backend y frontend por separado) + UptimeRobot (disponibilidad, ping cada 5 min)

Ver `documentacion/ARQUITECTURA_DATOS.md` para el modelo de datos completo (diagrama entidad-relación, normalización en 3FN, claves primarias y foráneas).

---

## 🚀 Instalación y ejecución local (solo para desarrollo del código)

> Nota: la validación de este proyecto se hace contra producción (ver tabla de arriba), no localmente. Estos pasos son solo para quien vaya a modificar el código.

### Prerrequisitos
* Node.js v18 o superior
* npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/leonar1lol/plataforma-sostenibilidad-retail.git
cd plataforma-sostenibilidad-retail
```

### 2. Instalar dependencias
```bash
npm install
npm --prefix cliente install
npm --prefix servidor install
```

### 3. Variables de entorno del backend

Crea `servidor/.env` (no se versiona, ver `.gitignore`) con, como mínimo:

```
URL_BASE_DATOS=<cadena de conexión pooled de Neon>
URL_BASE_DATOS_DIRECTA=<cadena de conexión directa de Neon, para migraciones>
CLAVE_SECRETA_JWT=<cualquier cadena aleatoria larga>
MINUTOS_VIGENCIA_OTP=10
URL_BASE_APP=http://localhost:5173
```

`CLAVE_API_RESEND`, `CORREO_REMITENTE_RESEND`, `SENTRY_DSN` y las variables `R2_*` son opcionales: sin ellas, el backend sigue funcionando (correo cae a "modo demo" con el código visible en pantalla, sin bloquear el flujo — ver `provider-portal/SKILL.md`).

### 4. Inicializar el esquema de base de datos

```bash
node servidor/src/scripts/inicializarBaseDatos.js
```

Es idempotente (`CREATE TABLE IF NOT EXISTS`) — se puede volver a correr sin duplicar datos ni perder lo existente.

### 5. Iniciar el sistema

```bash
npm run cliente:desarrollo   # http://localhost:5173
npm run servidor:desarrollo  # http://localhost:4000
```

---

## 🔑 Credenciales de prueba (contra producción)

* **Panel Corporativo** (`/admin`) — autenticación real (bcrypt + JWT):
  * `admin@intercorpretail.pe` — Administrador Corporativo
  * `ccoronel@intercorpretail.pe` — Gerente de Unidad de Negocio (Supermercados Peruanos)
  * `cchiroque@intercorpretail.pe` — Analista de Unidad de Negocio (Promart)
  * `fbeltran@intercorpretail.pe` — Gerente de Unidad de Negocio (Oechsle)
  * `gnavarro@intercorpretail.pe` — Consulta (solo lectura)
  * Contraseña para los cinco: `Admin2026`
* **Portal del Proveedor** (`/`) — sin contraseña, acceso por OTP real. Ingresa cualquier correo; el código de un solo uso se envía por Resend, o se muestra en pantalla como "Modo demo" si el correo de destino no está verificado en el proveedor de correo (limitación de la cuenta de prueba de Resend, no un bug).

---

## 📁 Estructura del proyecto

* `cliente/` — Aplicación frontend en React (portal del proveedor, panel corporativo, componentes y estilos).
* `servidor/` — API REST en Node.js/Express (rutas, controladores, servicios de correo/R2, conexión a PostgreSQL). `Dockerfile` para el despliegue en Cloud Run.
* `base-datos/` — Esquema SQL ejecutable (`esquema_inicial.sql`) y su script de inicialización.
* `documentacion/` — Arquitectura de datos, diagrama entidad-relación y especificaciones técnicas del proyecto.
