
-- 1. Personal: aislar SELECT por cliente
DROP POLICY IF EXISTS "Users can view all personal" ON public.personal;
CREATE POLICY "Users can view personal from their client"
  ON public.personal FOR SELECT
  USING (can_view_all_data() OR client_id = get_user_client_id());

-- 2. Operadores: aislar SELECT por cliente
DROP POLICY IF EXISTS "Users can view all operadores" ON public.operadores;
CREATE POLICY "Users can view operadores from their client"
  ON public.operadores FOR SELECT
  USING (can_view_all_data() OR client_id = get_user_client_id());

-- 3. Inventario equipos: aislar SELECT por cliente
DROP POLICY IF EXISTS "All authenticated users can view inventario_equipos" ON public.inventario_equipos;
CREATE POLICY "Users can view inventario_equipos from their client"
  ON public.inventario_equipos FOR SELECT
  USING (can_view_all_data() OR client_id = get_user_client_id());

-- 4. Zonas seguridad: aislar SELECT por cliente
DROP POLICY IF EXISTS "All authenticated users can view zonas_seguridad" ON public.zonas_seguridad;
CREATE POLICY "Users can view zonas_seguridad from their client"
  ON public.zonas_seguridad FOR SELECT
  USING (can_view_all_data() OR client_id = get_user_client_id());

-- 5. Asistencia personal: validar client_id en INSERT
DROP POLICY IF EXISTS "Users can create asistencia_personal for their client" ON public.asistencia_personal;
CREATE POLICY "Users can create asistencia_personal for their client"
  ON public.asistencia_personal FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (is_admin() OR has_module_permission(auth.uid(), 'asistencia'))
    AND client_id = get_user_client_id()
  );

-- 6. Cerrar bypass de cliente en INSERT de refacciones / inventario
DROP POLICY IF EXISTS "Users can create detalle_solicitudes_refacciones for their clie" ON public.detalle_solicitudes_refacciones;
CREATE POLICY "Users can create detalle_solicitudes_refacciones for their clie"
  ON public.detalle_solicitudes_refacciones FOR INSERT
  WITH CHECK (client_id = get_user_client_id());

DROP POLICY IF EXISTS "Users can create inventario_refacciones for their client" ON public.inventario_refacciones;
CREATE POLICY "Users can create inventario_refacciones for their client"
  ON public.inventario_refacciones FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create movimientos_refacciones for their client" ON public.movimientos_refacciones;
CREATE POLICY "Users can create movimientos_refacciones for their client"
  ON public.movimientos_refacciones FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create refacciones_mantenimiento for their client" ON public.refacciones_mantenimiento;
CREATE POLICY "Users can create refacciones_mantenimiento for their client"
  ON public.refacciones_mantenimiento FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create solicitudes_refacciones for their client" ON public.solicitudes_refacciones;
CREATE POLICY "Users can create solicitudes_refacciones for their client"
  ON public.solicitudes_refacciones FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create inventario_equipos for their client" ON public.inventario_equipos;
CREATE POLICY "Users can create inventario_equipos for their client"
  ON public.inventario_equipos FOR INSERT
  WITH CHECK (client_id = get_user_client_id() AND auth.uid() = created_by);

-- 7. Bucket archivos-peritajes: exigir autenticación en SELECT/INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Authenticated users can view peritajes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view peritajes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view peritajes" ON storage.objects;
DROP POLICY IF EXISTS "Public can view peritajes" ON storage.objects;
CREATE POLICY "Authenticated users can view peritajes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'archivos-peritajes' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can upload peritajes" ON storage.objects;
CREATE POLICY "Authenticated users can upload peritajes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'archivos-peritajes' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update peritajes" ON storage.objects;
CREATE POLICY "Authenticated users can update peritajes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'archivos-peritajes' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete peritajes" ON storage.objects;
CREATE POLICY "Authenticated users can delete peritajes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'archivos-peritajes' AND auth.uid() IS NOT NULL);

-- 8. Fijar search_path en funciones pendientes
ALTER FUNCTION public.set_rondin_folio() SET search_path = public;
ALTER FUNCTION public.update_rondines_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_rondin_folio() SET search_path = public;
ALTER FUNCTION public.update_estado_documental() SET search_path = public;
