-- Create table for visits/suppliers history
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  area_visita TEXT NOT NULL,
  credencial_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for security rounds history
CREATE TABLE public.rondines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ubicacion TEXT NOT NULL,
  codigo_qr TEXT NOT NULL,
  incidente BOOLEAN DEFAULT FALSE,
  descripcion_incidente TEXT,
  foto_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for unit entry history
CREATE TABLE public.ingreso_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_movimiento TEXT NOT NULL,
  numero_unidad TEXT NOT NULL,
  operador TEXT NOT NULL,
  tipo_unidad TEXT NOT NULL,
  numero_economico TEXT NOT NULL,
  odometro INTEGER NOT NULL,
  requiere_mantenimiento BOOLEAN DEFAULT FALSE,
  incidente BOOLEAN DEFAULT FALSE,
  descripcion_incidente TEXT,
  foto_1_url TEXT,
  foto_2_url TEXT,
  puntos_seguridad JSONB,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for breathalyzer tests history
CREATE TABLE public.pruebas_alcoholimetro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_persona TEXT NOT NULL,
  resultado TEXT NOT NULL,
  nivel DECIMAL(4,3),
  observaciones TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rondines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingreso_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_alcoholimetro ENABLE ROW LEVEL SECURITY;

-- Policies for visitas
CREATE POLICY "Users can view all visitas"
  ON public.visitas FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own visitas"
  ON public.visitas FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policies for rondines
CREATE POLICY "Users can view all rondines"
  ON public.rondines FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own rondines"
  ON public.rondines FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policies for ingreso_unidades
CREATE POLICY "Users can view all ingreso_unidades"
  ON public.ingreso_unidades FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own ingreso_unidades"
  ON public.ingreso_unidades FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policies for pruebas_alcoholimetro
CREATE POLICY "Users can view all pruebas_alcoholimetro"
  ON public.pruebas_alcoholimetro FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own pruebas_alcoholimetro"
  ON public.pruebas_alcoholimetro FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create indexes for better query performance
CREATE INDEX idx_visitas_created_at ON public.visitas(created_at DESC);
CREATE INDEX idx_rondines_created_at ON public.rondines(created_at DESC);
CREATE INDEX idx_ingreso_unidades_created_at ON public.ingreso_unidades(created_at DESC);
CREATE INDEX idx_pruebas_alcoholimetro_created_at ON public.pruebas_alcoholimetro(created_at DESC);