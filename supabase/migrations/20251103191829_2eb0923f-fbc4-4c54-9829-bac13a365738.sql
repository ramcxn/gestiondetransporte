-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create vacaciones table for tracking employee and operator vacation schedules
CREATE TABLE public.vacaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_empleado TEXT NOT NULL CHECK (tipo_empleado IN ('personal', 'operador')),
  empleado_id UUID NOT NULL,
  empleado_nombre TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_totales INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'en_curso', 'completado', 'cancelado')),
  motivo TEXT,
  observaciones TEXT,
  aprobado_por UUID,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  client_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vacaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view vacaciones from their client"
ON public.vacaciones
FOR SELECT
TO authenticated
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create vacaciones for their client"
ON public.vacaciones
FOR INSERT
TO authenticated
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update vacaciones from their client or admins"
ON public.vacaciones
FOR UPDATE
TO authenticated
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

CREATE POLICY "Admins can delete vacaciones"
ON public.vacaciones
FOR DELETE
TO authenticated
USING (is_admin());

-- Create index for better performance
CREATE INDEX idx_vacaciones_empleado ON public.vacaciones(empleado_id);
CREATE INDEX idx_vacaciones_fecha_inicio ON public.vacaciones(fecha_inicio);
CREATE INDEX idx_vacaciones_estado ON public.vacaciones(estado);

-- Add trigger for updated_at
CREATE TRIGGER update_vacaciones_updated_at
  BEFORE UPDATE ON public.vacaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();