-- Agregar campo qr_code a la tabla operadores
ALTER TABLE public.operadores 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Generar códigos QR para equipos existentes que no tengan
UPDATE public.inventario_equipos 
SET qr_code = 'EQUIPO-' || id::text
WHERE qr_code IS NULL;

-- Generar códigos QR para operadores existentes que no tengan
UPDATE public.operadores 
SET qr_code = 'OPERADOR-' || id::text
WHERE qr_code IS NULL;

-- Crear índice para búsquedas rápidas por QR en operadores
CREATE INDEX IF NOT EXISTS idx_operadores_qr_code 
ON public.operadores(qr_code);