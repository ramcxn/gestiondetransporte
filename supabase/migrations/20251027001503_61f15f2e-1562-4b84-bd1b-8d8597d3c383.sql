-- Crear tabla de asistencia de personal
CREATE TABLE public.asistencia_personal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES public.personal(id),
  fecha_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_salida TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente', 'salio')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.asistencia_personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all asistencia_personal"
ON public.asistencia_personal FOR SELECT
USING (true);

CREATE POLICY "Users can create asistencia_personal"
ON public.asistencia_personal FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update asistencia_personal"
ON public.asistencia_personal FOR UPDATE
USING (true);

-- Actualizar tabla analisis_riesgos para peritajes completos
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS tipo_analisis TEXT DEFAULT 'riesgo' CHECK (tipo_analisis IN ('riesgo', 'peritaje'));

-- Datos del accidente
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS fecha_hora_accidente TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS lugar_exacto TEXT,
  ADD COLUMN IF NOT EXISTS descripcion_entorno TEXT,
  ADD COLUMN IF NOT EXISTS estudio_escena TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_via TEXT,
  ADD COLUMN IF NOT EXISTS iluminacion TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_meteorologicas TEXT;

-- Datos de vehículos
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS vehiculos JSONB;

-- Datos de personas
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS conductores JSONB,
  ADD COLUMN IF NOT EXISTS testigos JSONB,
  ADD COLUMN IF NOT EXISTS lesionados JSONB;

-- Análisis técnico
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS descripcion_impacto TEXT,
  ADD COLUMN IF NOT EXISTS velocidad_estimada TEXT,
  ADD COLUMN IF NOT EXISTS trayectoria TEXT,
  ADD COLUMN IF NOT EXISTS factores_externos TEXT;

-- Documentación
ALTER TABLE public.analisis_riesgos 
  ADD COLUMN IF NOT EXISTS fotografias JSONB,
  ADD COLUMN IF NOT EXISTS diagrama_url TEXT,
  ADD COLUMN IF NOT EXISTS informes_medicos JSONB,
  ADD COLUMN IF NOT EXISTS declaraciones TEXT;