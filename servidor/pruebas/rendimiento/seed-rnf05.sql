-- Datos sinteticos minimos para reproducibilidad de pruebas de rendimiento RNF05
-- Requiere aplicacion previa de base-datos/esquema_inicial.sql

INSERT INTO item (codigo, enunciado, peso, id_dimension) VALUES
('ITM-AMB-01', '¿Cuenta con politica documentada de gestion de residuos?', 1.0, 1),
('ITM-SOC-01', '¿Cuenta con programa activo de apoyo a la comunidad?', 1.0, 2),
('ITM-ETI-01', '¿Dispone de canal etico anonimo de denuncias?', 1.0, 3),
('ITM-LAB-01', '¿Mantiene contratos formales para el 100% de colaboradores?', 1.0, 4),
('ITM-CAD-01', '¿Evalua criterios ESG en sus proveedores de segundo nivel?', 1.0, 5)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO alternativa (id_item, texto, puntaje, orden)
SELECT i.id_item, v.texto, v.puntaje, v.orden
FROM item i
CROSS JOIN (VALUES
  ('Implementado y auditado externamente', 100.0, 1),
  ('Implementado internamente', 70.0, 2),
  ('En proceso de implementacion', 40.0, 3),
  ('No implementado', 0.0, 4)
) AS v(texto, puntaje, orden)
WHERE NOT EXISTS (SELECT 1 FROM alternativa a WHERE a.id_item = i.id_item AND a.texto = v.texto);

INSERT INTO usuario (correo, nombre, clave_hash, estado, id_rol, id_unidad) VALUES
('admin.test@intercorpretail.pe', 'Administrador Corporativo Test', '$2a$10$wT8v0y6YhN6Y9j3Y7.sF0u3M.y8eN2sX3pW1yZ5xQ4vB9mC2rD7eK', true, 1, null)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO proveedor (ruc, razon_social, nombre_comercial, representante, correo, tipo, es_critico, id_unidad, id_industria) VALUES
('20900000001', 'Proveedor Sintetico Alimentos Alfa S.A.C.', 'Alimentos Alfa', 'Representante Sintetico 1', 'contacto@sintetico1.test', 'Retail', true, 1, 1),
('20900000002', 'Proveedor Sintetico Logistica Beta S.A.C.', 'Logistica Beta', 'Representante Sintetico 2', 'contacto@sintetico2.test', 'Retail', true, 2, 2),
('20900000003', 'Proveedor Sintetico Textil Gamma S.A.C.', 'Textil Gamma', 'Representante Sintetico 3', 'contacto@sintetico3.test', 'No retail', false, 3, 3),
('20900000004', 'Proveedor Sintetico Servicios Delta S.A.C.', 'Servicios Delta', 'Representante Sintetico 4', 'contacto@sintetico4.test', 'Retail', false, 4, 4),
('20900000005', 'Proveedor Sintetico Farmacia Epsilon S.A.C.', 'Farmacia Epsilon', 'Representante Sintetico 5', 'contacto@sintetico5.test', 'Retail', true, 5, 5),
('20900000006', 'Proveedor Sintetico Inmobiliario Zeta S.A.C.', 'Inmobiliario Zeta', 'Representante Sintetico 6', 'contacto@sintetico6.test', 'No retail', true, 6, 4),
('20900000007', 'Proveedor Sintetico Importaciones Eta S.A.C.', 'Importaciones Eta', 'Representante Sintetico 7', 'contacto@sintetico7.test', 'Retail', true, 7, 2),
('20900000008', 'Proveedor Sintetico Comercial Theta S.A.C.', 'Comercial Theta', 'Representante Sintetico 8', 'contacto@sintetico8.test', 'Retail', false, 1, 1),
('20900000009', 'Proveedor Sintetico Empaques Iota S.A.C.', 'Empaques Iota', 'Representante Sintetico 9', 'contacto@sintetico9.test', 'No retail', false, 2, 8),
('20900000010', 'Proveedor Sintetico Quimica Kappa S.A.C.', 'Quimica Kappa', 'Representante Sintetico 10', 'contacto@sintetico10.test', 'Retail', true, 5, 6)
ON CONFLICT (ruc) DO NOTHING;

INSERT INTO evaluacion (id_campania, id_proveedor, token, estado, fecha_envio, puntaje_total) VALUES
(1, 1, 'tok_sintetico_001', 'Finalizado', now(), 88.50),
(1, 2, 'tok_sintetico_002', 'Finalizado', now(), 79.20),
(1, 3, 'tok_sintetico_003', 'En proceso', now(), null),
(1, 4, 'tok_sintetico_004', 'Finalizado', now(), 92.00),
(1, 5, 'tok_sintetico_005', 'Pendiente', null, null)
ON CONFLICT (id_campania, id_proveedor) DO NOTHING;

INSERT INTO puntaje_dimension (id_evaluacion, id_dimension, valor) VALUES
(1, 1, 90.00), (1, 2, 85.00), (1, 3, 92.00), (1, 4, 88.00), (1, 5, 84.00),
(2, 1, 80.00), (2, 2, 75.00), (2, 3, 82.00), (2, 4, 78.00), (2, 5, 81.00),
(4, 1, 95.00), (4, 2, 90.00), (4, 3, 94.00), (4, 4, 91.00), (4, 5, 90.00)
ON CONFLICT (id_evaluacion, id_dimension) DO NOTHING;
