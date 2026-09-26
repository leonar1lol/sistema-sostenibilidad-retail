CREATE TABLE IF NOT EXISTS registro_recuperacion (
  id_registro                   BIGSERIAL PRIMARY KEY,
  nombre_tabla                  VARCHAR(80) NOT NULL,
  operacion                     VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  clave_primaria                JSONB NOT NULL,
  datos_anteriores              JSONB,
  datos_nuevos                  JSONB,
  fecha_evento                  TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  fecha_cierre_transaccion_aprox TIMESTAMPTZ,
  xid_transaccion               BIGINT NOT NULL DEFAULT 0,
  id_transaccion                BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reg_recup_fecha ON registro_recuperacion(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_reg_recup_tx ON registro_recuperacion(id_transaccion);
CREATE INDEX IF NOT EXISTS idx_reg_recup_cierre ON registro_recuperacion(fecha_cierre_transaccion_aprox);

CREATE OR REPLACE FUNCTION fn_registrar_cambio_recuperacion()
RETURNS TRIGGER AS $$
DECLARE
  v_columna_pk TEXT := TG_ARGV[0];
  v_clave JSONB;
  v_anteriores JSONB := NULL;
  v_nuevos JSONB := NULL;
  v_xid BIGINT;
BEGIN
  IF current_setting('sostenibilidad.modo_recuperacion', true) = 'true' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  v_xid := pg_current_xact_id()::text::bigint;

  IF TG_OP = 'INSERT' THEN
    v_nuevos := to_jsonb(NEW);
    v_clave := jsonb_build_object(v_columna_pk, v_nuevos->v_columna_pk);
  ELSIF TG_OP = 'UPDATE' THEN
    v_anteriores := to_jsonb(OLD);
    v_nuevos := to_jsonb(NEW);
    v_clave := jsonb_build_object(v_columna_pk, v_nuevos->v_columna_pk);
  ELSIF TG_OP = 'DELETE' THEN
    v_anteriores := to_jsonb(OLD);
    v_clave := jsonb_build_object(v_columna_pk, v_anteriores->v_columna_pk);
  END IF;

  INSERT INTO registro_recuperacion (
    nombre_tabla,
    operacion,
    clave_primaria,
    datos_anteriores,
    datos_nuevos,
    fecha_evento,
    xid_transaccion,
    id_transaccion
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_clave,
    v_anteriores,
    v_nuevos,
    clock_timestamp(),
    v_xid,
    v_xid
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_marcar_cierre_transaccion()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('sostenibilidad.modo_recuperacion', true) = 'true' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  UPDATE registro_recuperacion
  SET fecha_cierre_transaccion_aprox = clock_timestamp()
  WHERE id_transaccion = pg_current_xact_id()::text::bigint
    AND fecha_cierre_transaccion_aprox IS NULL;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recup_proveedor ON proveedor;
CREATE TRIGGER trg_recup_proveedor
AFTER INSERT OR UPDATE OR DELETE ON proveedor
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_proveedor');

DROP TRIGGER IF EXISTS trg_cierre_proveedor ON proveedor;
CREATE CONSTRAINT TRIGGER trg_cierre_proveedor
AFTER INSERT OR UPDATE OR DELETE ON proveedor
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_marcar_cierre_transaccion();

DROP TRIGGER IF EXISTS trg_recup_evaluacion ON evaluacion;
CREATE TRIGGER trg_recup_evaluacion
AFTER INSERT OR UPDATE OR DELETE ON evaluacion
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_evaluacion');

DROP TRIGGER IF EXISTS trg_cierre_evaluacion ON evaluacion;
CREATE CONSTRAINT TRIGGER trg_cierre_evaluacion
AFTER INSERT OR UPDATE OR DELETE ON evaluacion
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_marcar_cierre_transaccion();

DROP TRIGGER IF EXISTS trg_recup_respuesta ON respuesta;
CREATE TRIGGER trg_recup_respuesta
AFTER INSERT OR UPDATE OR DELETE ON respuesta
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_respuesta');

DROP TRIGGER IF EXISTS trg_recup_puntaje_dim ON puntaje_dimension;
CREATE TRIGGER trg_recup_puntaje_dim
AFTER INSERT OR UPDATE OR DELETE ON puntaje_dimension
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_puntaje');

DROP TRIGGER IF EXISTS trg_recup_campania ON campania;
CREATE TRIGGER trg_recup_campania
AFTER INSERT OR UPDATE OR DELETE ON campania
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_campania');

DROP TRIGGER IF EXISTS trg_recup_item ON item;
CREATE TRIGGER trg_recup_item
AFTER INSERT OR UPDATE OR DELETE ON item
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_item');

DROP TRIGGER IF EXISTS trg_recup_alternativa ON alternativa;
CREATE TRIGGER trg_recup_alternativa
AFTER INSERT OR UPDATE OR DELETE ON alternativa
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_alternativa');

DROP TRIGGER IF EXISTS trg_recup_regla ON regla_condicional;
CREATE TRIGGER trg_recup_regla
AFTER INSERT OR UPDATE OR DELETE ON regla_condicional
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_regla');

DROP TRIGGER IF EXISTS trg_recup_usuario ON usuario;
CREATE TRIGGER trg_recup_usuario
AFTER INSERT OR UPDATE OR DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_usuario');

DROP TRIGGER IF EXISTS trg_recup_evidencia ON evidencia;
CREATE TRIGGER trg_recup_evidencia
AFTER INSERT OR UPDATE OR DELETE ON evidencia
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_evidencia');

DROP TRIGGER IF EXISTS trg_recup_recomendacion ON recomendacion;
CREATE TRIGGER trg_recup_recomendacion
AFTER INSERT OR UPDATE OR DELETE ON recomendacion
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_recomendacion');

DROP TRIGGER IF EXISTS trg_recup_auditoria ON auditoria;
CREATE TRIGGER trg_recup_auditoria
AFTER INSERT OR UPDATE OR DELETE ON auditoria
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_auditoria');

DROP TRIGGER IF EXISTS trg_recup_rol ON rol;
CREATE TRIGGER trg_recup_rol
AFTER INSERT OR UPDATE OR DELETE ON rol
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_rol');

DROP TRIGGER IF EXISTS trg_recup_permiso ON permiso;
CREATE TRIGGER trg_recup_permiso
AFTER INSERT OR UPDATE OR DELETE ON permiso
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_permiso');

DROP TRIGGER IF EXISTS trg_recup_rol_permiso ON rol_permiso;
CREATE TRIGGER trg_recup_rol_permiso
AFTER INSERT OR UPDATE OR DELETE ON rol_permiso
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_rol_permiso');

DROP TRIGGER IF EXISTS trg_recup_unidad_negocio ON unidad_negocio;
CREATE TRIGGER trg_recup_unidad_negocio
AFTER INSERT OR UPDATE OR DELETE ON unidad_negocio
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_unidad');

DROP TRIGGER IF EXISTS trg_recup_industria ON industria;
CREATE TRIGGER trg_recup_industria
AFTER INSERT OR UPDATE OR DELETE ON industria
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_industria');

DROP TRIGGER IF EXISTS trg_recup_dimension ON dimension;
CREATE TRIGGER trg_recup_dimension
AFTER INSERT OR UPDATE OR DELETE ON dimension
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_dimension');

DROP TRIGGER IF EXISTS trg_recup_item_industria ON item_industria;
CREATE TRIGGER trg_recup_item_industria
AFTER INSERT OR UPDATE OR DELETE ON item_industria
FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_recuperacion('id_item_industria');
