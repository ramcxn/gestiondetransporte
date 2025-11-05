-- Agregar campo qr_code a la tabla inventario_equipos
ALTER TABLE public.inventario_equipos 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Crear índice para búsquedas rápidas por QR
CREATE INDEX IF NOT EXISTS idx_inventario_equipos_qr_code 
ON public.inventario_equipos(qr_code);