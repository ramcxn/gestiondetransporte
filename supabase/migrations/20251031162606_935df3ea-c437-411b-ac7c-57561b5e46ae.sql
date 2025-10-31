-- ==========================================
-- FASES 4-5-6: SEGURIDAD, MANTENIMIENTO Y ALMACÉN
-- ==========================================

-- FASE 4: SEGURIDAD
-- 1. VISITAS
ALTER TABLE public.visitas 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_visitas_client_id ON public.visitas(client_id);

DROP POLICY IF EXISTS "Users can view all visitas" ON public.visitas;
DROP POLICY IF EXISTS "Users can create their own visitas" ON public.visitas;
DROP POLICY IF EXISTS "Users can update visitas or admins" ON public.visitas;

CREATE POLICY "Users can view visitas from their client" ON public.visitas
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create visitas for their client" ON public.visitas
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Admins can update visitas" ON public.visitas
FOR UPDATE USING (is_admin());

-- 2. RONDINES
ALTER TABLE public.rondines 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rondines_client_id ON public.rondines(client_id);

DROP POLICY IF EXISTS "Users can view all rondines" ON public.rondines;
DROP POLICY IF EXISTS "Users can create their own rondines" ON public.rondines;

CREATE POLICY "Users can view rondines from their client" ON public.rondines
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create rondines for their client" ON public.rondines
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- 3. ZONAS_SEGURIDAD
ALTER TABLE public.zonas_seguridad 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_zonas_seguridad_client_id ON public.zonas_seguridad(client_id);

DROP POLICY IF EXISTS "Users can view all zonas_seguridad" ON public.zonas_seguridad;
DROP POLICY IF EXISTS "Users can create zonas_seguridad" ON public.zonas_seguridad;
DROP POLICY IF EXISTS "Users can update their own zonas_seguridad or admins" ON public.zonas_seguridad;

CREATE POLICY "Users can view zonas_seguridad from their client" ON public.zonas_seguridad
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create zonas_seguridad for their client" ON public.zonas_seguridad
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update zonas_seguridad from their client or admins" ON public.zonas_seguridad
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 4. SELLOS_SEGURIDAD
ALTER TABLE public.sellos_seguridad 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sellos_seguridad_client_id ON public.sellos_seguridad(client_id);

DROP POLICY IF EXISTS "Users can view all sellos_seguridad" ON public.sellos_seguridad;
DROP POLICY IF EXISTS "Users can create sellos_seguridad" ON public.sellos_seguridad;
DROP POLICY IF EXISTS "Users can update their own sellos_seguridad or admins" ON public.sellos_seguridad;

CREATE POLICY "Users can view sellos_seguridad from their client" ON public.sellos_seguridad
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create sellos_seguridad for their client" ON public.sellos_seguridad
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update sellos_seguridad from their client or admins" ON public.sellos_seguridad
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 5. HISTORIAL_SELLOS
ALTER TABLE public.historial_sellos 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_historial_sellos_client_id ON public.historial_sellos(client_id);

DROP POLICY IF EXISTS "Users can view all historial_sellos" ON public.historial_sellos;
DROP POLICY IF EXISTS "Users can create historial_sellos" ON public.historial_sellos;

CREATE POLICY "Users can view historial_sellos from their client" ON public.historial_sellos
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create historial_sellos for their client" ON public.historial_sellos
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- 6. PRUEBAS_ALCOHOLIMETRO
ALTER TABLE public.pruebas_alcoholimetro 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_pruebas_alcoholimetro_client_id ON public.pruebas_alcoholimetro(client_id);

DROP POLICY IF EXISTS "Users can view all pruebas_alcoholimetro" ON public.pruebas_alcoholimetro;
DROP POLICY IF EXISTS "Users can create their own pruebas_alcoholimetro" ON public.pruebas_alcoholimetro;

CREATE POLICY "Users can view pruebas_alcoholimetro from their client" ON public.pruebas_alcoholimetro
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create pruebas_alcoholimetro for their client" ON public.pruebas_alcoholimetro
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- FASE 5: MANTENIMIENTO
-- 7. MANTENIMIENTOS
ALTER TABLE public.mantenimientos 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_mantenimientos_client_id ON public.mantenimientos(client_id);

DROP POLICY IF EXISTS "Users can view all mantenimientos" ON public.mantenimientos;
DROP POLICY IF EXISTS "Users can create mantenimientos" ON public.mantenimientos;
DROP POLICY IF EXISTS "Users can update their own mantenimientos or admins" ON public.mantenimientos;

CREATE POLICY "Users can view mantenimientos from their client" ON public.mantenimientos
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create mantenimientos for their client" ON public.mantenimientos
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update mantenimientos from their client or admins" ON public.mantenimientos
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 8. INGRESO_UNIDADES
ALTER TABLE public.ingreso_unidades 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ingreso_unidades_client_id ON public.ingreso_unidades(client_id);

DROP POLICY IF EXISTS "Users can view all ingreso_unidades" ON public.ingreso_unidades;
DROP POLICY IF EXISTS "Users can create their own ingreso_unidades" ON public.ingreso_unidades;

CREATE POLICY "Users can view ingreso_unidades from their client" ON public.ingreso_unidades
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create ingreso_unidades for their client" ON public.ingreso_unidades
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- FASE 6: ALMACÉN
-- 9. REFACCIONES
ALTER TABLE public.refacciones 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_refacciones_client_id ON public.refacciones(client_id);

DROP POLICY IF EXISTS "Users can view all refacciones" ON public.refacciones;
DROP POLICY IF EXISTS "Users can create refacciones" ON public.refacciones;
DROP POLICY IF EXISTS "Users can update their own refacciones or admins" ON public.refacciones;

CREATE POLICY "Users can view refacciones from their client" ON public.refacciones
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create refacciones for their client" ON public.refacciones
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update refacciones from their client or admins" ON public.refacciones
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());

-- 10. UBICACIONES_ALMACEN
ALTER TABLE public.ubicaciones_almacen 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ubicaciones_almacen_client_id ON public.ubicaciones_almacen(client_id);

DROP POLICY IF EXISTS "Users can view all ubicaciones_almacen" ON public.ubicaciones_almacen;
DROP POLICY IF EXISTS "Users can create ubicaciones_almacen" ON public.ubicaciones_almacen;
DROP POLICY IF EXISTS "Users can update their own ubicaciones_almacen or admins" ON public.ubicaciones_almacen;

CREATE POLICY "Users can view ubicaciones_almacen from their client" ON public.ubicaciones_almacen
FOR SELECT USING (client_id = get_user_client_id() OR is_admin());

CREATE POLICY "Users can create ubicaciones_almacen for their client" ON public.ubicaciones_almacen
FOR INSERT WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

CREATE POLICY "Users can update ubicaciones_almacen from their client or admins" ON public.ubicaciones_almacen
FOR UPDATE USING ((client_id = get_user_client_id() AND auth.uid() = created_by) OR is_admin());