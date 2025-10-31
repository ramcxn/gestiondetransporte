-- ==========================================
-- FASE 7: TABLAS RESTANTES (Almacén, Inventario, Análisis)
-- ==========================================

-- ALMACÉN (continuación)
-- 1. INVENTARIO_REFACCIONES
ALTER TABLE public.inventario_refacciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventario_refacciones_client_id ON public.inventario_refacciones(client_id);

DROP POLICY IF EXISTS "Users can view all inventario_refacciones" ON public.inventario_refacciones;
DROP POLICY IF EXISTS "Users can create inventario_refacciones" ON public.inventario_refacciones;
DROP POLICY IF EXISTS "Users can update their own inventario_refacciones or admins" ON public.inventario_refacciones;

CREATE POLICY "Users can view inventario_refacciones from their client" ON public.inventario_refacciones
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create inventario_refacciones for their client" ON public.inventario_refacciones
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update inventario_refacciones from their client or admins" ON public.inventario_refacciones
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 2. SOLICITUDES_REFACCIONES
ALTER TABLE public.solicitudes_refacciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_solicitudes_refacciones_client_id ON public.solicitudes_refacciones(client_id);

DROP POLICY IF EXISTS "Users can view all solicitudes_refacciones" ON public.solicitudes_refacciones;
DROP POLICY IF EXISTS "Users can create solicitudes_refacciones" ON public.solicitudes_refacciones;
DROP POLICY IF EXISTS "Users can update their own solicitudes_refacciones or admins" ON public.solicitudes_refacciones;

CREATE POLICY "Users can view solicitudes_refacciones from their client" ON public.solicitudes_refacciones
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create solicitudes_refacciones for their client" ON public.solicitudes_refacciones
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update solicitudes_refacciones from their client or admins" ON public.solicitudes_refacciones
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 3. DETALLE_SOLICITUDES_REFACCIONES
ALTER TABLE public.detalle_solicitudes_refacciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_detalle_solicitudes_refacciones_client_id ON public.detalle_solicitudes_refacciones(client_id);

DROP POLICY IF EXISTS "Users can view all detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones;
DROP POLICY IF EXISTS "Users can create detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones;
DROP POLICY IF EXISTS "Users can update detalle_solicitudes_refacciones" ON public.detalle_solicitudes_refacciones;

CREATE POLICY "Users can view detalle_solicitudes_refacciones from their client" ON public.detalle_solicitudes_refacciones
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create detalle_solicitudes_refacciones for their client" ON public.detalle_solicitudes_refacciones
FOR INSERT WITH CHECK (client_id = get_user_client_id());

CREATE POLICY "Users can update detalle_solicitudes_refacciones from their client" ON public.detalle_solicitudes_refacciones
FOR UPDATE USING (client_id = get_user_client_id() OR is_admin());

-- 4. MOVIMIENTOS_REFACCIONES
ALTER TABLE public.movimientos_refacciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_movimientos_refacciones_client_id ON public.movimientos_refacciones(client_id);

DROP POLICY IF EXISTS "Users can view all movimientos_refacciones" ON public.movimientos_refacciones;
DROP POLICY IF EXISTS "Users can create movimientos_refacciones" ON public.movimientos_refacciones;

CREATE POLICY "Users can view movimientos_refacciones from their client" ON public.movimientos_refacciones
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create movimientos_refacciones for their client" ON public.movimientos_refacciones
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- 5. REFACCIONES_MANTENIMIENTO
ALTER TABLE public.refacciones_mantenimiento 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_refacciones_mantenimiento_client_id ON public.refacciones_mantenimiento(client_id);

DROP POLICY IF EXISTS "Users can view all refacciones_mantenimiento" ON public.refacciones_mantenimiento;
DROP POLICY IF EXISTS "Users can create refacciones_mantenimiento" ON public.refacciones_mantenimiento;
DROP POLICY IF EXISTS "Admins can update refacciones_mantenimiento" ON public.refacciones_mantenimiento;

CREATE POLICY "Users can view refacciones_mantenimiento from their client" ON public.refacciones_mantenimiento
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create refacciones_mantenimiento for their client" ON public.refacciones_mantenimiento
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update refacciones_mantenimiento from their client" ON public.refacciones_mantenimiento
FOR UPDATE USING (is_admin() AND client_id = get_user_client_id());

-- INVENTARIO EQUIPOS
-- 6. INVENTARIO_EQUIPOS
ALTER TABLE public.inventario_equipos 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventario_equipos_client_id ON public.inventario_equipos(client_id);

DROP POLICY IF EXISTS "Users can view all inventario_equipos" ON public.inventario_equipos;
DROP POLICY IF EXISTS "Users can create inventario_equipos" ON public.inventario_equipos;
DROP POLICY IF EXISTS "Admins can update inventario_equipos" ON public.inventario_equipos;

CREATE POLICY "Users can view inventario_equipos from their client" ON public.inventario_equipos
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create inventario_equipos for their client" ON public.inventario_equipos
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update inventario_equipos from their client" ON public.inventario_equipos
FOR UPDATE USING (is_admin() AND (client_id = get_user_client_id() OR is_admin()));

-- ANÁLISIS Y ACCIONES
-- 7. ANALISIS_RIESGOS
ALTER TABLE public.analisis_riesgos 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_analisis_riesgos_client_id ON public.analisis_riesgos(client_id);

DROP POLICY IF EXISTS "Users can view all analisis_riesgos" ON public.analisis_riesgos;
DROP POLICY IF EXISTS "Users can create analisis_riesgos" ON public.analisis_riesgos;
DROP POLICY IF EXISTS "Users can update their own analisis_riesgos or admins" ON public.analisis_riesgos;

CREATE POLICY "Users can view analisis_riesgos from their client" ON public.analisis_riesgos
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create analisis_riesgos for their client" ON public.analisis_riesgos
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update analisis_riesgos from their client or admins" ON public.analisis_riesgos
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 8. ACCIONES_CORRECTIVAS
ALTER TABLE public.acciones_correctivas 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_acciones_correctivas_client_id ON public.acciones_correctivas(client_id);

DROP POLICY IF EXISTS "Users can view all acciones_correctivas" ON public.acciones_correctivas;
DROP POLICY IF EXISTS "Users can create acciones_correctivas" ON public.acciones_correctivas;
DROP POLICY IF EXISTS "Admins can update acciones_correctivas" ON public.acciones_correctivas;

CREATE POLICY "Users can view acciones_correctivas from their client" ON public.acciones_correctivas
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create acciones_correctivas for their client" ON public.acciones_correctivas
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update acciones_correctivas from their client" ON public.acciones_correctivas
FOR UPDATE USING (is_admin());

-- 9. INCIDENTES
ALTER TABLE public.incidentes 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_incidentes_client_id ON public.incidentes(client_id);

DROP POLICY IF EXISTS "Users can view all incidentes" ON public.incidentes;
DROP POLICY IF EXISTS "Users can create incidentes" ON public.incidentes;
DROP POLICY IF EXISTS "Users can update their own incidentes or admins" ON public.incidentes;

CREATE POLICY "Users can view incidentes from their client" ON public.incidentes
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create incidentes for their client" ON public.incidentes
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update incidentes from their client or admins" ON public.incidentes
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 10. RUTAS
ALTER TABLE public.rutas 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rutas_client_id ON public.rutas(client_id);

DROP POLICY IF EXISTS "Users can view all rutas" ON public.rutas;
DROP POLICY IF EXISTS "Users can create rutas" ON public.rutas;
DROP POLICY IF EXISTS "Users can update their own rutas or admins" ON public.rutas;

CREATE POLICY "Users can view rutas from their client" ON public.rutas
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create rutas for their client" ON public.rutas
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update rutas from their client or admins" ON public.rutas
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());