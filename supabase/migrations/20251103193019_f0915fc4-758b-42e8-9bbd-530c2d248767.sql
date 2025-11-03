-- 1. Remove the constraint on personal.departamento to allow custom departments
ALTER TABLE public.personal DROP CONSTRAINT IF EXISTS personal_departamento_check;

-- 2. Add equipment_id foreign key to mantenimientos table to link with inventario_equipos
ALTER TABLE public.mantenimientos
ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES public.inventario_equipos(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo_id ON public.mantenimientos(equipo_id);

-- 3. Create a table for custom departments (optional - for better management)
CREATE TABLE IF NOT EXISTS public.departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  client_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on departamentos
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departamentos
CREATE POLICY "Users can view departamentos from their client"
ON public.departamentos
FOR SELECT
TO authenticated
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Admins can create departamentos for their client"
ON public.departamentos
FOR INSERT
TO authenticated
WITH CHECK (is_admin() AND client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update departamentos from their client"
ON public.departamentos
FOR UPDATE
TO authenticated
USING (is_admin() AND client_id = get_user_client_id());

-- Insert default departments
INSERT INTO public.departamentos (nombre, descripcion, client_id, created_by)
SELECT 'Administrativo', 'Personal de oficina y administración', '00000000-0000-0000-0000-000000000001', 'a1b9f976-0a92-4ff0-9662-5544fc1f6ade'
WHERE NOT EXISTS (SELECT 1 FROM public.departamentos WHERE nombre = 'Administrativo');

INSERT INTO public.departamentos (nombre, descripcion, client_id, created_by)
SELECT 'Taller', 'Personal de mantenimiento y reparación', '00000000-0000-0000-0000-000000000001', 'a1b9f976-0a92-4ff0-9662-5544fc1f6ade'
WHERE NOT EXISTS (SELECT 1 FROM public.departamentos WHERE nombre = 'Taller');

INSERT INTO public.departamentos (nombre, descripcion, client_id, created_by)
SELECT 'Operaciones', 'Personal operativo y logística', '00000000-0000-0000-0000-000000000001', 'a1b9f976-0a92-4ff0-9662-5544fc1f6ade'
WHERE NOT EXISTS (SELECT 1 FROM public.departamentos WHERE nombre = 'Operaciones');

INSERT INTO public.departamentos (nombre, descripcion, client_id, created_by)
SELECT 'Seguridad', 'Personal de seguridad y vigilancia', '00000000-0000-0000-0000-000000000001', 'a1b9f976-0a92-4ff0-9662-5544fc1f6ade'
WHERE NOT EXISTS (SELECT 1 FROM public.departamentos WHERE nombre = 'Seguridad');