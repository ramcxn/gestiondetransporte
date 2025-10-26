-- Update visitas table to add exit tracking
ALTER TABLE public.visitas 
ADD COLUMN fecha_salida timestamp with time zone,
ADD COLUMN estado text NOT NULL DEFAULT 'en_instalaciones' CHECK (estado IN ('en_instalaciones', 'salio'));

-- Add file upload support to pruebas_alcoholimetro
ALTER TABLE public.pruebas_alcoholimetro
ADD COLUMN archivo_url text;

-- Create storage bucket for antidoping files
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-antidoping', 'archivos-antidoping', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for antidoping files
CREATE POLICY "Authenticated users can upload antidoping files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'archivos-antidoping');

CREATE POLICY "Authenticated users can view antidoping files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'archivos-antidoping');

-- Create trips table
CREATE TABLE IF NOT EXISTS public.viajes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operador text NOT NULL,
  unidad text NOT NULL,
  origen text NOT NULL,
  destino text NOT NULL,
  fecha_salida date NOT NULL,
  fecha_llegada_estimada date,
  fecha_llegada_real date,
  distancia_km integer NOT NULL,
  flete numeric(10,2) NOT NULL,
  cliente text NOT NULL,
  sucursal text NOT NULL,
  estado text NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'en_transito', 'completado', 'cancelado')),
  ubicacion_actual text,
  ultima_actualizacion_ubicacion timestamp with time zone,
  ruta_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on viajes
ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all viajes"
ON public.viajes
FOR SELECT
USING (true);

CREATE POLICY "Users can create viajes"
ON public.viajes
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update viajes"
ON public.viajes
FOR UPDATE
USING (true);

-- Create rutas table for route analysis
CREATE TABLE IF NOT EXISTS public.rutas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  origen text NOT NULL,
  destino text NOT NULL,
  distancia_km integer NOT NULL,
  tiempo_estimado_horas numeric(5,2) NOT NULL,
  costo_estimado numeric(10,2) NOT NULL,
  costo_combustible numeric(10,2),
  costo_casetas numeric(10,2),
  rentabilidad text CHECK (rentabilidad IN ('alta', 'media', 'baja')),
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on rutas
ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all rutas"
ON public.rutas
FOR SELECT
USING (true);

CREATE POLICY "Users can create rutas"
ON public.rutas
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update rutas"
ON public.rutas
FOR UPDATE
USING (true);

-- Create security zones table for QR codes
CREATE TABLE IF NOT EXISTS public.zonas_seguridad (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  codigo_qr text NOT NULL UNIQUE,
  ubicacion text NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on zonas_seguridad
ALTER TABLE public.zonas_seguridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all zonas_seguridad"
ON public.zonas_seguridad
FOR SELECT
USING (true);

CREATE POLICY "Users can create zonas_seguridad"
ON public.zonas_seguridad
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update zonas_seguridad"
ON public.zonas_seguridad
FOR UPDATE
USING (true);

-- Insert 10 default security zones
INSERT INTO public.zonas_seguridad (nombre, codigo_qr, ubicacion, created_by) 
SELECT 
  'Zona ' || num,
  'QR-ZONA-' || LPAD(num::text, 2, '0'),
  CASE num
    WHEN 1 THEN 'Entrada Principal'
    WHEN 2 THEN 'Almacén A'
    WHEN 3 THEN 'Almacén B'
    WHEN 4 THEN 'Patio de Maniobras'
    WHEN 5 THEN 'Oficinas Administrativas'
    WHEN 6 THEN 'Taller de Mantenimiento'
    WHEN 7 THEN 'Área de Carga/Descarga'
    WHEN 8 THEN 'Caseta de Vigilancia Norte'
    WHEN 9 THEN 'Caseta de Vigilancia Sur'
    WHEN 10 THEN 'Perímetro Exterior'
  END,
  (SELECT id FROM auth.users LIMIT 1)
FROM generate_series(1, 10) AS num
ON CONFLICT (codigo_qr) DO NOTHING;