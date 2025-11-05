-- Add unidad_negocio column to viajes table
ALTER TABLE public.viajes 
ADD COLUMN unidad_negocio text NOT NULL DEFAULT 'HH Express' 
CHECK (unidad_negocio IN ('HH Express', 'PORTECALESA'));