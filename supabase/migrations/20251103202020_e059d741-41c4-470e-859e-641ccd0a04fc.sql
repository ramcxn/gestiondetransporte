-- Agregar columnas para conectar ingreso de unidades con inventario de equipos
-- Permite hasta 2 remolques

ALTER TABLE ingreso_unidades
ADD COLUMN tracto_id uuid REFERENCES inventario_equipos(id),
ADD COLUMN dolly_id uuid REFERENCES inventario_equipos(id),
ADD COLUMN remolque_1_id uuid REFERENCES inventario_equipos(id),
ADD COLUMN remolque_2_id uuid REFERENCES inventario_equipos(id);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_ingreso_unidades_tracto ON ingreso_unidades(tracto_id);
CREATE INDEX idx_ingreso_unidades_dolly ON ingreso_unidades(dolly_id);
CREATE INDEX idx_ingreso_unidades_remolque_1 ON ingreso_unidades(remolque_1_id);
CREATE INDEX idx_ingreso_unidades_remolque_2 ON ingreso_unidades(remolque_2_id);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN ingreso_unidades.tracto_id IS 'Referencia al tracto del inventario de equipos';
COMMENT ON COLUMN ingreso_unidades.dolly_id IS 'Referencia al dolly del inventario de equipos (opcional)';
COMMENT ON COLUMN ingreso_unidades.remolque_1_id IS 'Referencia al primer remolque del inventario de equipos (opcional)';
COMMENT ON COLUMN ingreso_unidades.remolque_2_id IS 'Referencia al segundo remolque del inventario de equipos (opcional)';