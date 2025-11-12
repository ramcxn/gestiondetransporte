-- Crear tabla para inspecciones de instalaciones
CREATE TABLE public.inspecciones_instalaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  fecha_inspeccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  inspector_nombre TEXT NOT NULL,
  inspector_id UUID REFERENCES auth.users(id),
  categoria TEXT NOT NULL,
  puntos_verificacion JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'en_proceso',
  observaciones_generales TEXT,
  acciones_correctivas JSONB DEFAULT '[]'::jsonb,
  evidencia_fotografica JSONB DEFAULT '[]'::jsonb,
  client_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspecciones_instalaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view inspecciones from their client"
ON public.inspecciones_instalaciones
FOR SELECT
USING (can_view_all_data() OR (client_id = get_client_id_by_email_domain()));

CREATE POLICY "Users can create inspecciones for their client"
ON public.inspecciones_instalaciones
FOR INSERT
WITH CHECK ((client_id = get_user_client_id()) AND (auth.uid() = created_by));

CREATE POLICY "Users can update inspecciones from their client"
ON public.inspecciones_instalaciones
FOR UPDATE
USING (((client_id = get_user_client_id()) AND (auth.uid() = created_by)) OR is_admin());

CREATE POLICY "Admins can delete inspecciones"
ON public.inspecciones_instalaciones
FOR DELETE
USING (is_admin());

-- Trigger para actualizar updated_at
CREATE TRIGGER update_inspecciones_instalaciones_updated_at
BEFORE UPDATE ON public.inspecciones_instalaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar folio
CREATE OR REPLACE FUNCTION public.generate_inspeccion_instalaciones_folio()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_folio TEXT;
  folio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO folio_count 
  FROM public.inspecciones_instalaciones 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_folio := 'INST-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((folio_count + 1)::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$;