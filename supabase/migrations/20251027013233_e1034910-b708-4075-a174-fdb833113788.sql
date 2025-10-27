-- 1. Limpiar datos históricos (mantenimientos y análisis de rutas predefinidos)
DELETE FROM public.refacciones_mantenimiento;
DELETE FROM public.mantenimientos;
DELETE FROM public.rutas WHERE activa = true;

-- 2. Crear tabla de acciones correctivas con formato 8D's
CREATE TABLE IF NOT EXISTS public.acciones_correctivas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descripcion_problema TEXT NOT NULL,
  
  -- D1: Equipo
  equipo_responsable TEXT NOT NULL,
  lider_equipo TEXT NOT NULL,
  miembros_equipo JSONB,
  
  -- D2: Descripción del problema
  descripcion_detallada TEXT NOT NULL,
  fecha_deteccion DATE NOT NULL,
  area_afectada TEXT NOT NULL,
  
  -- D3: Acciones de contención inmediata
  acciones_contencion TEXT,
  fecha_contencion DATE,
  responsable_contencion TEXT,
  
  -- D4: Causa raíz
  analisis_causa_raiz TEXT,
  herramientas_utilizadas TEXT, -- 5 Porqués, Ishikawa, etc.
  
  -- D5: Acciones correctivas permanentes
  acciones_correctivas TEXT NOT NULL,
  responsable_accion TEXT NOT NULL,
  fecha_compromiso DATE NOT NULL,
  
  -- D6: Implementación
  fecha_implementacion DATE,
  evidencia_implementacion TEXT,
  
  -- D7: Prevención de recurrencia
  acciones_preventivas TEXT,
  actualizacion_procedimientos TEXT,
  
  -- D8: Reconocimiento del equipo
  reconocimiento TEXT,
  lecciones_aprendidas TEXT,
  
  estado TEXT NOT NULL DEFAULT 'abierto', -- abierto, en_progreso, cerrado
  prioridad TEXT NOT NULL DEFAULT 'media', -- baja, media, alta, critica
  
  archivos_adjuntos JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.acciones_correctivas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para acciones correctivas
CREATE POLICY "Users can view all acciones_correctivas"
  ON public.acciones_correctivas
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create acciones_correctivas"
  ON public.acciones_correctivas
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update acciones_correctivas"
  ON public.acciones_correctivas
  FOR UPDATE
  USING (is_admin());

-- 5. Agregar columna de estado de compra a solicitudes_refacciones
ALTER TABLE public.solicitudes_refacciones 
ADD COLUMN IF NOT EXISTS estado_compra TEXT DEFAULT 'pendiente_compra',
ADD COLUMN IF NOT EXISTS fecha_compra TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS comprador_id UUID,
ADD COLUMN IF NOT EXISTS monto_compra NUMERIC,
ADD COLUMN IF NOT EXISTS proveedor_compra TEXT;

-- 6. Función para generar folio de acción correctiva
CREATE OR REPLACE FUNCTION public.generate_accion_correctiva_folio()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_folio TEXT;
  folio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO folio_count 
  FROM public.acciones_correctivas 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_folio := '8D-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((folio_count + 1)::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$;

-- 7. Índices para mejorar rendimiento
CREATE INDEX idx_acciones_correctivas_estado ON public.acciones_correctivas(estado);
CREATE INDEX idx_acciones_correctivas_prioridad ON public.acciones_correctivas(prioridad);
CREATE INDEX idx_acciones_correctivas_created_at ON public.acciones_correctivas(created_at);

-- 8. Agregar columnas de archivos a analisis_riesgos si no existen
ALTER TABLE public.analisis_riesgos 
ADD COLUMN IF NOT EXISTS archivos_adjuntos JSONB DEFAULT '[]'::jsonb;

COMMENT ON TABLE public.acciones_correctivas IS 'Tabla para gestionar acciones correctivas con metodología 8D';
COMMENT ON COLUMN public.solicitudes_refacciones.estado_compra IS 'Estado de compra: pendiente_compra, comprado, recibido';