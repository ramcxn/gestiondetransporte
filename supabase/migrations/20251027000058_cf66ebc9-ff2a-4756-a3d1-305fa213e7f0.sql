-- Create liquidaciones table linked to viajes
CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viaje_id uuid NOT NULL REFERENCES public.viajes(id),
  folio text NOT NULL UNIQUE,
  monto_total numeric(10,2) NOT NULL,
  monto_operador numeric(10,2) NOT NULL,
  monto_diesel numeric(10,2) NOT NULL,
  monto_casetas numeric(10,2) NOT NULL,
  otros_gastos numeric(10,2) DEFAULT 0,
  deduccion numeric(10,2) DEFAULT 0,
  monto_neto numeric(10,2) NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'cancelada')),
  fecha_liquidacion date,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all liquidaciones"
ON public.liquidaciones
FOR SELECT
USING (true);

CREATE POLICY "Users can create liquidaciones"
ON public.liquidaciones
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update liquidaciones"
ON public.liquidaciones
FOR UPDATE
USING (true);

-- Create risk analysis table
CREATE TABLE IF NOT EXISTS public.analisis_riesgos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  tipo_riesgo text NOT NULL CHECK (tipo_riesgo IN ('operativo', 'seguridad', 'financiero', 'legal', 'ambiental')),
  nivel_riesgo text NOT NULL CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
  probabilidad text NOT NULL CHECK (probabilidad IN ('baja', 'media', 'alta')),
  impacto text NOT NULL CHECK (impacto IN ('bajo', 'medio', 'alto', 'critico')),
  medidas_mitigacion text,
  responsable text,
  fecha_identificacion date NOT NULL,
  fecha_revision date,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_tratamiento', 'mitigado', 'cerrado')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.analisis_riesgos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all analisis_riesgos"
ON public.analisis_riesgos
FOR SELECT
USING (true);

CREATE POLICY "Users can create analisis_riesgos"
ON public.analisis_riesgos
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update analisis_riesgos"
ON public.analisis_riesgos
FOR UPDATE
USING (true);

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidentes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  tipo_incidente text NOT NULL CHECK (tipo_incidente IN ('accidente', 'robo', 'averia', 'retraso', 'perdida', 'otro')),
  gravedad text NOT NULL CHECK (gravedad IN ('baja', 'media', 'alta', 'critica')),
  ubicacion text,
  unidad text,
  operador text,
  viaje_id uuid REFERENCES public.viajes(id),
  fecha_incidente timestamp with time zone NOT NULL,
  estado text NOT NULL DEFAULT 'reportado' CHECK (estado IN ('reportado', 'en_investigacion', 'resuelto', 'cerrado')),
  acciones_tomadas text,
  costo_estimado numeric(10,2),
  foto_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all incidentes"
ON public.incidentes
FOR SELECT
USING (true);

CREATE POLICY "Users can create incidentes"
ON public.incidentes
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update incidentes"
ON public.incidentes
FOR UPDATE
USING (true);

-- Create storage bucket for incidents photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-incidentes', 'fotos-incidentes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident photos
CREATE POLICY "Authenticated users can upload incident photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-incidentes');

CREATE POLICY "Authenticated users can view incident photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'fotos-incidentes');

-- Create security seals table
CREATE TABLE IF NOT EXISTS public.sellos_seguridad (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_sello text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'asignado', 'roto', 'perdido')),
  tipo text NOT NULL DEFAULT 'cable' CHECK (tipo IN ('cable', 'plastico', 'precinto', 'digital')),
  fecha_fabricacion date,
  fecha_vencimiento date,
  viaje_id uuid REFERENCES public.viajes(id),
  unidad text,
  fecha_asignacion timestamp with time zone,
  fecha_retiro timestamp with time zone,
  motivo_retiro text,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sellos_seguridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sellos_seguridad"
ON public.sellos_seguridad
FOR SELECT
USING (true);

CREATE POLICY "Users can create sellos_seguridad"
ON public.sellos_seguridad
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sellos_seguridad"
ON public.sellos_seguridad
FOR UPDATE
USING (true);

-- Create seal history table
CREATE TABLE IF NOT EXISTS public.historial_sellos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sello_id uuid NOT NULL REFERENCES public.sellos_seguridad(id),
  accion text NOT NULL CHECK (accion IN ('asignado', 'retirado', 'roto', 'perdido', 'reemplazado')),
  viaje_id uuid REFERENCES public.viajes(id),
  unidad text,
  descripcion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.historial_sellos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all historial_sellos"
ON public.historial_sellos
FOR SELECT
USING (true);

CREATE POLICY "Users can create historial_sellos"
ON public.historial_sellos
FOR INSERT
WITH CHECK (auth.uid() = created_by);