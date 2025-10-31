-- ==========================================
-- CORRECCIÓN: Functions sin search_path
-- ==========================================

-- Corregir generate_solicitud_folio
CREATE OR REPLACE FUNCTION public.generate_solicitud_folio()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_folio TEXT;
  folio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO folio_count FROM public.solicitudes_refacciones 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_folio := 'SOL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((folio_count + 1)::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$;

-- Corregir generate_accion_correctiva_folio
CREATE OR REPLACE FUNCTION public.generate_accion_correctiva_folio()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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