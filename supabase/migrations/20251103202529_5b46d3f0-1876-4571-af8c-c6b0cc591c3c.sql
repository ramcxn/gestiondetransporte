-- Agregar columna para conectar el operador con la base de datos
ALTER TABLE ingreso_unidades
ADD COLUMN operador_id uuid REFERENCES operadores(id);

-- Crear índice para mejorar el rendimiento
CREATE INDEX idx_ingreso_unidades_operador ON ingreso_unidades(operador_id);

-- Comentario para documentar
COMMENT ON COLUMN ingreso_unidades.operador_id IS 'Referencia al operador del inventario de operadores';