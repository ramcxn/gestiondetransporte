-- Add QR code columns to personal and operadores tables
ALTER TABLE public.personal
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS dias_vacaciones_disponibles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_vacaciones_tomados INTEGER DEFAULT 0;

ALTER TABLE public.operadores
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS dias_vacaciones_disponibles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_vacaciones_tomados INTEGER DEFAULT 0;

-- Update vacaciones table to include approval and days tracking
ALTER TABLE public.vacaciones
ADD COLUMN IF NOT EXISTS requiere_aprobacion BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dias_disponibles_antes INTEGER,
ADD COLUMN IF NOT EXISTS excede_dias_disponibles BOOLEAN DEFAULT false;

-- Create function to calculate vacation days based on Mexican law
-- Mexican law: 
-- 1st year: 12 days
-- 2nd year: 14 days
-- 3rd year: 16 days
-- 4th year: 18 days
-- After 4 years: +2 days every 5 years
CREATE OR REPLACE FUNCTION public.calcular_dias_vacaciones(fecha_alta DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anos_servicio INTEGER;
  dias_vacaciones INTEGER;
BEGIN
  -- Calculate years of service
  anos_servicio := EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_alta));
  
  -- Apply Mexican labor law vacation formula
  IF anos_servicio < 1 THEN
    dias_vacaciones := 12; -- First year (proportional)
  ELSIF anos_servicio = 1 THEN
    dias_vacaciones := 14;
  ELSIF anos_servicio = 2 THEN
    dias_vacaciones := 16;
  ELSIF anos_servicio = 3 THEN
    dias_vacaciones := 18;
  ELSIF anos_servicio = 4 THEN
    dias_vacaciones := 20;
  ELSE
    -- After 5 years: 20 days + 2 days every 5 years
    dias_vacaciones := 20 + (FLOOR((anos_servicio - 4) / 5.0) * 2);
  END IF;
  
  RETURN dias_vacaciones;
END;
$$;

-- Create function to update available vacation days for all employees
CREATE OR REPLACE FUNCTION public.actualizar_dias_vacaciones()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update personal
  UPDATE public.personal
  SET dias_vacaciones_disponibles = calcular_dias_vacaciones(fecha_alta) - dias_vacaciones_tomados
  WHERE estado = 'activo';
  
  -- Update operadores
  UPDATE public.operadores
  SET dias_vacaciones_disponibles = calcular_dias_vacaciones(fecha_alta) - dias_vacaciones_tomados
  WHERE estado = 'activo';
END;
$$;

-- Add index for QR codes for faster lookups
CREATE INDEX IF NOT EXISTS idx_personal_qr_code ON public.personal(qr_code);
CREATE INDEX IF NOT EXISTS idx_operadores_qr_code ON public.operadores(qr_code);