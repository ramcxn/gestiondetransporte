-- ==========================================
-- FASE 3: PERSONAL Y ASISTENCIA (client_id + RLS)
-- ==========================================

-- 1. PERSONAL
ALTER TABLE public.personal 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_personal_client_id ON public.personal(client_id);

-- Actualizar políticas RLS de personal
DROP POLICY IF EXISTS "Only admins can view personal" ON public.personal;
DROP POLICY IF EXISTS "Users can create personal" ON public.personal;
DROP POLICY IF EXISTS "Users can update their own personal records or admins" ON public.personal;

CREATE POLICY "Users can view personal from their client"
ON public.personal
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create personal for their client"
ON public.personal
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update personal from their client or admins"
ON public.personal
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 2. ASISTENCIA_PERSONAL
ALTER TABLE public.asistencia_personal 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_asistencia_personal_client_id ON public.asistencia_personal(client_id);

-- Actualizar políticas RLS de asistencia_personal
DROP POLICY IF EXISTS "Users can view all asistencia_personal" ON public.asistencia_personal;
DROP POLICY IF EXISTS "Users can create asistencia_personal" ON public.asistencia_personal;
DROP POLICY IF EXISTS "Users can update their own asistencia_personal or admins" ON public.asistencia_personal;

CREATE POLICY "Users can view asistencia_personal from their client"
ON public.asistencia_personal
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create asistencia_personal for their client"
ON public.asistencia_personal
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update asistencia_personal from their client or admins"
ON public.asistencia_personal
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());