-- Eliminar la foreign key constraint incorrecta en mantenimientos.equipo_id
ALTER TABLE public.mantenimientos 
DROP CONSTRAINT IF EXISTS mantenimientos_equipo_id_fkey;

-- Agregar la foreign key correcta apuntando a inventario_equipos (opcional/nullable)
ALTER TABLE public.mantenimientos 
ADD CONSTRAINT mantenimientos_equipo_id_fkey 
FOREIGN KEY (equipo_id) 
REFERENCES public.inventario_equipos(id) 
ON DELETE SET NULL;