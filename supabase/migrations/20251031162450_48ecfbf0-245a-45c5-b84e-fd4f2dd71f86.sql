-- ==========================================
-- FASE 2: TABLAS DE OPERACIONES (client_id + RLS)
-- ==========================================

-- 1. VIAJES
ALTER TABLE public.viajes 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_viajes_client_id ON public.viajes(client_id);

-- Actualizar políticas RLS de viajes
DROP POLICY IF EXISTS "Users can view all viajes" ON public.viajes;
DROP POLICY IF EXISTS "Users can create viajes" ON public.viajes;
DROP POLICY IF EXISTS "Users can update their own viajes or admins" ON public.viajes;

CREATE POLICY "Users can view viajes from their client"
ON public.viajes
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create viajes for their client"
ON public.viajes
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update viajes from their client or admins"
ON public.viajes
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 2. OPERADORES
ALTER TABLE public.operadores 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_operadores_client_id ON public.operadores(client_id);

-- Actualizar políticas RLS de operadores
DROP POLICY IF EXISTS "Only admins can view operadores" ON public.operadores;
DROP POLICY IF EXISTS "Users can create operadores" ON public.operadores;
DROP POLICY IF EXISTS "Users can update their own operadores or admins" ON public.operadores;

CREATE POLICY "Users can view operadores from their client"
ON public.operadores
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create operadores for their client"
ON public.operadores
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update operadores from their client or admins"
ON public.operadores
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 3. UNIDADES
ALTER TABLE public.unidades 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_unidades_client_id ON public.unidades(client_id);

-- Actualizar políticas RLS de unidades
DROP POLICY IF EXISTS "Users can view all unidades" ON public.unidades;
DROP POLICY IF EXISTS "Users can create unidades" ON public.unidades;
DROP POLICY IF EXISTS "Users can update their own unidades or admins" ON public.unidades;

CREATE POLICY "Users can view unidades from their client"
ON public.unidades
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create unidades for their client"
ON public.unidades
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update unidades from their client or admins"
ON public.unidades
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 4. LIQUIDACIONES
ALTER TABLE public.liquidaciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_liquidaciones_client_id ON public.liquidaciones(client_id);

-- Actualizar políticas RLS de liquidaciones
DROP POLICY IF EXISTS "Users can view all liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "Users can create liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "Users can update their own liquidaciones or admins" ON public.liquidaciones;

CREATE POLICY "Users can view liquidaciones from their client"
ON public.liquidaciones
FOR SELECT
USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create liquidaciones for their client"
ON public.liquidaciones
FOR INSERT
WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update liquidaciones from their client or admins"
ON public.liquidaciones
FOR UPDATE
USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());