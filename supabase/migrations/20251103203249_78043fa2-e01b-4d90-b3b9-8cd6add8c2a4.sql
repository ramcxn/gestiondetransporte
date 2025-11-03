-- Drop constraint if exists (ignore error if doesn't exist)
ALTER TABLE public.mantenimientos DROP CONSTRAINT IF EXISTS mantenimientos_equipo_id_fkey;

-- Add foreign key constraint from mantenimientos.equipo_id to unidades.id
ALTER TABLE public.mantenimientos
ADD CONSTRAINT mantenimientos_equipo_id_fkey
FOREIGN KEY (equipo_id)
REFERENCES public.unidades(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo_id ON public.mantenimientos(equipo_id);

-- Add comment
COMMENT ON COLUMN public.mantenimientos.equipo_id IS 'Foreign key reference to unidades table';