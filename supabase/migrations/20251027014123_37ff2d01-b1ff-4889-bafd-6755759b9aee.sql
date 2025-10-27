-- Crear tabla de inventario de equipos (tractos, dollies, remolques)
CREATE TABLE IF NOT EXISTS public.inventario_equipos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_economico TEXT NOT NULL UNIQUE,
  tipo_equipo TEXT NOT NULL, -- tracto, dolly, remolque
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  año INTEGER,
  placas TEXT,
  numero_serie TEXT,
  color TEXT,
  capacidad_carga NUMERIC,
  estado TEXT NOT NULL DEFAULT 'disponible', -- disponible, en_uso, mantenimiento, fuera_servicio
  ubicacion TEXT,
  observaciones TEXT,
  ultima_inspeccion DATE,
  proximo_mantenimiento DATE,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventario_equipos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inventario de equipos
CREATE POLICY "Users can view all inventario_equipos"
  ON public.inventario_equipos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create inventario_equipos"
  ON public.inventario_equipos
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update inventario_equipos"
  ON public.inventario_equipos
  FOR UPDATE
  USING (is_admin());

-- Índices para rendimiento
CREATE INDEX idx_inventario_equipos_tipo ON public.inventario_equipos(tipo_equipo);
CREATE INDEX idx_inventario_equipos_estado ON public.inventario_equipos(estado);
CREATE INDEX idx_inventario_equipos_numero_economico ON public.inventario_equipos(numero_economico);

-- Agregar bucket para archivos de peritajes
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-peritajes', 'archivos-peritajes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para archivos de peritajes
CREATE POLICY "Users can upload peritaje files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'archivos-peritajes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view peritaje files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'archivos-peritajes');

CREATE POLICY "Admins can delete peritaje files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'archivos-peritajes' AND is_admin());

COMMENT ON TABLE public.inventario_equipos IS 'Inventario de equipos: tractos, dollies, remolques';