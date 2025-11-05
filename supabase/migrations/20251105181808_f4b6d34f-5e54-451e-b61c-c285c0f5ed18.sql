-- Agregar campo qr_code a la tabla personal si no existe
ALTER TABLE public.personal 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Generar códigos QR para personal existente que no tenga
UPDATE public.personal 
SET qr_code = 'PERSONAL-' || id::text
WHERE qr_code IS NULL;

-- Crear índice para búsquedas rápidas por QR en personal
CREATE INDEX IF NOT EXISTS idx_personal_qr_code 
ON public.personal(qr_code);