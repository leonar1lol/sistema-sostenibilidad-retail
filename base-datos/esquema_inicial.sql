CREATE TABLE IF NOT EXISTS rol (
  id_rol        SERIAL PRIMARY KEY,
  nombre        VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permiso (
  id_permiso    SERIAL PRIMARY KEY,
  codigo        VARCHAR(60) NOT NULL UNIQUE,
  descripcion   VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol_permiso (
  id_rol_permiso SERIAL PRIMARY KEY,
  id_rol        INT NOT NULL REFERENCES rol(id_rol),
  id_permiso    INT NOT NULL REFERENCES permiso(id_permiso),
  UNIQUE (id_rol, id_permiso)
);

CREATE TABLE IF NOT EXISTS unidad_negocio (
  id_unidad     SERIAL PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,
  nombre        VARCHAR(120) NOT NULL,
  gerente       VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    SERIAL PRIMARY KEY,
  correo        VARCHAR(160) NOT NULL UNIQUE,
  nombre        VARCHAR(160) NOT NULL,
  clave_hash    VARCHAR(255) NOT NULL,
  estado        BOOLEAN NOT NULL DEFAULT TRUE,
  id_rol        INT NOT NULL REFERENCES rol(id_rol),
  id_unidad     INT REFERENCES unidad_negocio(id_unidad)
);

CREATE TABLE IF NOT EXISTS industria (
  id_industria  SERIAL PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,
  nombre        VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS proveedor (
  id_proveedor  SERIAL PRIMARY KEY,
  ruc           VARCHAR(11) NOT NULL UNIQUE,
  razon_social  VARCHAR(200) NOT NULL,
  representante VARCHAR(160),
  correo        VARCHAR(160) NOT NULL,
  tipo          VARCHAR(20) NOT NULL CHECK (tipo IN ('Retail','No retail')),
  es_critico    BOOLEAN NOT NULL DEFAULT FALSE,
  id_unidad     INT NOT NULL REFERENCES unidad_negocio(id_unidad),
  id_industria  INT REFERENCES industria(id_industria),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dimension (
  id_dimension  SERIAL PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,
  nombre        VARCHAR(80) NOT NULL,
  peso          NUMERIC(4,3) NOT NULL
);

CREATE TABLE IF NOT EXISTS item (
  id_item       SERIAL PRIMARY KEY,
  codigo        VARCHAR(20) NOT NULL UNIQUE,
  enunciado     TEXT NOT NULL,
  peso          NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  id_dimension  INT NOT NULL REFERENCES dimension(id_dimension)
);

CREATE TABLE IF NOT EXISTS item_industria (
  id_item_industria SERIAL PRIMARY KEY,
  id_item       INT NOT NULL REFERENCES item(id_item),
  id_industria  INT NOT NULL REFERENCES industria(id_industria),
  obligatorio   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (id_item, id_industria)
);

CREATE TABLE IF NOT EXISTS alternativa (
  id_alternativa SERIAL PRIMARY KEY,
  id_item       INT NOT NULL REFERENCES item(id_item),
  texto         VARCHAR(300) NOT NULL,
  puntaje       NUMERIC(5,2) NOT NULL CHECK (puntaje BETWEEN 0 AND 100),
  orden         INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regla_condicional (
  id_regla         SERIAL PRIMARY KEY,
  id_item_origen   INT NOT NULL REFERENCES item(id_item),
  id_alternativa_disparadora INT NOT NULL REFERENCES alternativa(id_alternativa),
  accion           VARCHAR(20) NOT NULL CHECK (accion IN ('mostrar','ocultar','deshabilitar')),
  id_item_destino  INT NOT NULL REFERENCES item(id_item)
);

CREATE TABLE IF NOT EXISTS campania (
  id_campania   SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  periodo       VARCHAR(40) NOT NULL,
  estado        VARCHAR(20) NOT NULL CHECK (estado IN ('Borrador','Publicada','Cerrada')),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS codigo_otp (
  id_codigo     SERIAL PRIMARY KEY,
  correo        VARCHAR(160) NOT NULL,
  id_proveedor  INT REFERENCES proveedor(id_proveedor),
  valor         CHAR(6) NOT NULL,
  expiracion    TIMESTAMPTZ NOT NULL,
  usado         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS evaluacion (
  id_evaluacion SERIAL PRIMARY KEY,
  id_campania   INT NOT NULL REFERENCES campania(id_campania),
  id_proveedor  INT NOT NULL REFERENCES proveedor(id_proveedor),
  token         VARCHAR(80) NOT NULL UNIQUE,
  estado        VARCHAR(20) NOT NULL CHECK (estado IN ('Pendiente','En proceso','Finalizado')),
  fecha_envio   TIMESTAMPTZ,
  puntaje_total NUMERIC(5,2),
  UNIQUE (id_campania, id_proveedor)
);

CREATE TABLE IF NOT EXISTS respuesta (
  id_respuesta   SERIAL PRIMARY KEY,
  id_evaluacion  INT NOT NULL REFERENCES evaluacion(id_evaluacion),
  id_item        INT NOT NULL REFERENCES item(id_item),
  id_alternativa INT NOT NULL REFERENCES alternativa(id_alternativa),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_evaluacion, id_item)
);

CREATE TABLE IF NOT EXISTS puntaje_dimension (
  id_puntaje    SERIAL PRIMARY KEY,
  id_evaluacion INT NOT NULL REFERENCES evaluacion(id_evaluacion),
  id_dimension  INT NOT NULL REFERENCES dimension(id_dimension),
  valor         NUMERIC(5,2) NOT NULL,
  UNIQUE (id_evaluacion, id_dimension)
);

CREATE TABLE IF NOT EXISTS recomendacion (
  id_recomendacion SERIAL PRIMARY KEY,
  id_dimension     INT NOT NULL REFERENCES dimension(id_dimension),
  umbral           NUMERIC(5,2) NOT NULL,
  texto            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidencia (
  id_evidencia   SERIAL PRIMARY KEY,
  id_respuesta   INT NOT NULL REFERENCES respuesta(id_respuesta),
  nombre_archivo VARCHAR(255) NOT NULL,
  clave_r2       VARCHAR(500) NOT NULL UNIQUE,
  tipo_mime      VARCHAR(100) NOT NULL,
  tamano_bytes   INT NOT NULL,
  subido_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria  SERIAL PRIMARY KEY,
  id_usuario    INT REFERENCES usuario(id_usuario),
  id_evaluacion INT REFERENCES evaluacion(id_evaluacion),
  accion        VARCHAR(120) NOT NULL,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO rol (nombre) VALUES
('Administrador Corporativo'),
('Gerente de Unidad de Negocio'),
('Analista de Unidad de Negocio'),
('Consulta')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO permiso (codigo, descripcion) VALUES
('actualizar_razon_social', 'Actualizar razón social de un proveedor'),
('marcar_critico', 'Marcar/desmarcar proveedor como crítico'),
('configurar_banco_items', 'Configurar banco de ítems / dimensiones / reglas'),
('crear_publicar_campanias', 'Crear y publicar campañas'),
('asignar_evaluaciones', 'Asignar evaluaciones / generar enlace de campaña'),
('ver_dashboard_corporativo', 'Visualizar dashboard corporativo (7 unidades)'),
('ver_dashboard_unidad', 'Visualizar dashboard de su propia unidad'),
('exportar_reportes', 'Exportar reportes a Excel'),
('administrar_usuarios_roles', 'Administrar usuarios, roles y permisos')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM rol r CROSS JOIN permiso p
WHERE
  (r.nombre = 'Administrador Corporativo')
  OR (r.nombre = 'Gerente de Unidad de Negocio' AND p.codigo IN ('actualizar_razon_social','marcar_critico','asignar_evaluaciones','ver_dashboard_unidad','exportar_reportes'))
  OR (r.nombre = 'Analista de Unidad de Negocio' AND p.codigo IN ('asignar_evaluaciones','ver_dashboard_unidad','exportar_reportes'))
  OR (r.nombre = 'Consulta' AND p.codigo IN ('ver_dashboard_unidad'))
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO unidad_negocio (codigo, nombre, gerente) VALUES
('SPSA', 'Supermercados Peruanos', 'Mariella Prado'),
('PRO', 'Promart', 'Juan Carlos Vallejo'),
('OEC', 'Oechsle', 'Edurne Benito'),
('RPZ', 'Real Plaza', 'Misael Shimizu'),
('FAR', 'Farmacias Peruanas', 'Marcelo Ramos'),
('SIP', 'SIP', 'Trinidad Camarasa'),
('IRC', 'Intercorp Retail Sucursal China', 'Directorio Asia')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO industria (codigo, nombre) VALUES
('AGR', 'Productos agrícolas'),
('ALE', 'Alimentos envasados'),
('TEX', 'Textil y confecciones'),
('LOG', 'Transporte y almacén'),
('SGE', 'Servicios generales'),
('FAR', 'Farmacéutico'),
('EE', 'Equipos y electrónica'),
('ESS', 'Envases y suministros')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dimension (codigo, nombre, peso) VALUES
('AMB', 'Ambiental', 0.25),
('SOC', 'Social', 0.20),
('ETI', 'Ética y Gobernanza', 0.25),
('LAB', 'Laboral', 0.20),
('CAD', 'Cadena de Suministro', 0.10)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO campania (nombre, periodo, estado) VALUES
('Evaluación de Sostenibilidad 2026-I', '2026-I', 'Publicada')
ON CONFLICT DO NOTHING;

INSERT INTO recomendacion (id_dimension, umbral, texto)
SELECT d.id_dimension, v.umbral, v.texto
FROM (VALUES
  ('AMB', 70.00, 'Formalizar e implementar la política documentada de gestión integral de residuos y reciclaje.'),
  ('AMB', 75.00, 'Iniciar la medición y reporte anual auditado de la huella de carbono operacional.'),
  ('SOC', 70.00, 'Establecer un programa permanente con presupuesto e indicadores de impacto comunitario.'),
  ('ETI', 80.00, 'Implementar un canal formalizado y anónimo de denuncias gestionado de forma independiente.'),
  ('LAB', 85.00, 'Asegurar la plena formalización laboral y un sistema de control de jornadas seguras.'),
  ('CAD', 70.00, 'Extender los criterios de sostenibilidad a los proveedores de segundo nivel de la cadena de suministro.')
) AS v(codigo_dimension, umbral, texto)
JOIN dimension d ON d.codigo = v.codigo_dimension
WHERE NOT EXISTS (SELECT 1 FROM recomendacion r WHERE r.texto = v.texto);
