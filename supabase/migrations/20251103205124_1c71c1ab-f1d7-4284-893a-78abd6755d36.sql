-- Add operacion column to inventario_equipos table
ALTER TABLE public.inventario_equipos 
ADD COLUMN operacion text NOT NULL DEFAULT 'HH Express';

-- Add check constraint for valid operations
ALTER TABLE public.inventario_equipos 
ADD CONSTRAINT inventario_equipos_operacion_check 
CHECK (operacion IN ('HH Express', 'Portecalesa'));

-- Create index for better query performance
CREATE INDEX idx_inventario_equipos_operacion ON public.inventario_equipos(operacion);