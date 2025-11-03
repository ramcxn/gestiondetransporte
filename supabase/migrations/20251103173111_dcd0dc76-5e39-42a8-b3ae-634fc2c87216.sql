-- Tabla para inventario del operador
CREATE TABLE IF NOT EXISTS public.inventario_operador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  operador_nombre TEXT NOT NULL,
  numero_unidad TEXT NOT NULL,
  tipo_revision TEXT NOT NULL CHECK (tipo_revision IN ('ingreso', 'salida')),
  
  -- Equipo obligatorio
  chaleco_reflejante BOOLEAN NOT NULL DEFAULT false,
  casco BOOLEAN NOT NULL DEFAULT false,
  botas_seguridad BOOLEAN NOT NULL DEFAULT false,
  extintor BOOLEAN NOT NULL DEFAULT false,
  gato_hidraulico BOOLEAN NOT NULL DEFAULT false,
  triangulos_emergencia BOOLEAN NOT NULL DEFAULT false,
  herramienta_basica BOOLEAN NOT NULL DEFAULT false,
  cinturones_seguridad BOOLEAN NOT NULL DEFAULT false,
  lampara BOOLEAN NOT NULL DEFAULT false,
  
  observaciones TEXT,
  firma_operador_url TEXT,
  firma_supervisor_url TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('aprobado', 'requiere_correccion', 'pendiente')),
  supervisor_id UUID,
  
  client_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventario_operador ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can create inventario_operador for their client"
ON public.inventario_operador
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can view inventario_operador from their client"
ON public.inventario_operador
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can update inventario_operador from their client"
ON public.inventario_operador
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- Tabla para revisión documental
CREATE TABLE IF NOT EXISTS public.revision_documental (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_economico TEXT NOT NULL,
  placas TEXT,
  operador_nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  fecha_revision TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- URLs de fotografías
  foto_tarjeta_circulacion TEXT,
  foto_poliza_seguro TEXT,
  foto_analisis_fisicoquimico TEXT,
  foto_dictamen_humos TEXT,
  foto_licencia_operador TEXT,
  
  -- Fechas de vigencia
  vigencia_licencia DATE,
  vigencia_analisis_fisicoquimico DATE,
  vigencia_dictamen_humos DATE,
  vigencia_poliza_seguro DATE,
  
  estado_general TEXT NOT NULL DEFAULT 'vigente' CHECK (estado_general IN ('vigente', 'proximo_vencer', 'vencido')),
  observaciones TEXT,
  
  client_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.revision_documental ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can create revision_documental for their client"
ON public.revision_documental
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can view revision_documental from their client"
ON public.revision_documental
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can update revision_documental from their client"
ON public.revision_documental
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- Función para actualizar estado automáticamente
CREATE OR REPLACE FUNCTION public.update_estado_documental()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si algún documento está vencido
  IF (NEW.vigencia_licencia < CURRENT_DATE) OR 
     (NEW.vigencia_analisis_fisicoquimico < CURRENT_DATE) OR 
     (NEW.vigencia_dictamen_humos < CURRENT_DATE) OR
     (NEW.vigencia_poliza_seguro < CURRENT_DATE) THEN
    NEW.estado_general := 'vencido';
  -- Verificar si algún documento vence en los próximos 15 días
  ELSIF (NEW.vigencia_licencia <= CURRENT_DATE + INTERVAL '15 days') OR 
        (NEW.vigencia_analisis_fisicoquimico <= CURRENT_DATE + INTERVAL '15 days') OR 
        (NEW.vigencia_dictamen_humos <= CURRENT_DATE + INTERVAL '15 days') OR
        (NEW.vigencia_poliza_seguro <= CURRENT_DATE + INTERVAL '15 days') THEN
    NEW.estado_general := 'proximo_vencer';
  ELSE
    NEW.estado_general := 'vigente';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado automáticamente
CREATE TRIGGER update_estado_documental_trigger
BEFORE INSERT OR UPDATE ON public.revision_documental
FOR EACH ROW
EXECUTE FUNCTION public.update_estado_documental();

-- Crear buckets de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('firmas-inventario', 'firmas-inventario', true),
  ('documentos-unidades', 'documentos-unidades', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para firmas
CREATE POLICY "Users can upload firmas for their client"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'firmas-inventario' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view firmas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'firmas-inventario');

-- Políticas de storage para documentos
CREATE POLICY "Users can upload documentos for their client"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos-unidades' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view documentos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos-unidades');