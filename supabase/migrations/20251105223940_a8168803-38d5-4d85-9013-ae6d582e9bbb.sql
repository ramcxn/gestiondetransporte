-- Actualizar políticas INSERT para usar el filtrado por dominio de email

-- Tabla: inventario_equipos
DROP POLICY IF EXISTS "Users can create inventario_equipos for their client" ON public.inventario_equipos;
CREATE POLICY "Users can create inventario_equipos for their client" 
ON public.inventario_equipos 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Tabla: refacciones
DROP POLICY IF EXISTS "Users can create refacciones for their client" ON public.refacciones;
CREATE POLICY "Users can create refacciones for their client" 
ON public.refacciones 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Tabla: inventario_refacciones
DROP POLICY IF EXISTS "Users can create inventario_refacciones for their client" ON public.inventario_refacciones;
CREATE POLICY "Users can create inventario_refacciones for their client" 
ON public.inventario_refacciones 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Tabla: solicitudes_refacciones
DROP POLICY IF EXISTS "Users can create solicitudes_refacciones for their client" ON public.solicitudes_refacciones;
CREATE POLICY "Users can create solicitudes_refacciones for their client" 
ON public.solicitudes_refacciones 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Tabla: detalle_solicitudes_refacciones
DROP POLICY IF EXISTS "Users can create detalle_solicitudes_refacciones for their clie" ON public.detalle_solicitudes_refacciones;
CREATE POLICY "Users can create detalle_solicitudes_refacciones for their client" 
ON public.detalle_solicitudes_refacciones 
FOR INSERT 
WITH CHECK (
  client_id = get_client_id_by_email_domain() OR get_client_id_by_email_domain() IS NULL
);

-- Tabla: movimientos_refacciones
DROP POLICY IF EXISTS "Users can create movimientos_refacciones for their client" ON public.movimientos_refacciones;
CREATE POLICY "Users can create movimientos_refacciones for their client" 
ON public.movimientos_refacciones 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Tabla: refacciones_mantenimiento
DROP POLICY IF EXISTS "Users can create refacciones_mantenimiento for their client" ON public.refacciones_mantenimiento;
CREATE POLICY "Users can create refacciones_mantenimiento for their client" 
ON public.refacciones_mantenimiento 
FOR INSERT 
WITH CHECK (
  (client_id = get_client_id_by_email_domain() OR (get_client_id_by_email_domain() IS NULL AND client_id IS NOT NULL))
  AND (auth.uid() = created_by)
);

-- Actualizar políticas UPDATE también

-- Tabla: inventario_equipos
DROP POLICY IF EXISTS "Admins can update inventario_equipos from their client" ON public.inventario_equipos;
CREATE POLICY "Admins can update inventario_equipos from their client" 
ON public.inventario_equipos 
FOR UPDATE 
USING (
  is_admin() AND (can_view_all_data() OR client_id = get_client_id_by_email_domain() OR client_id IS NULL)
);

-- Tabla: refacciones
DROP POLICY IF EXISTS "Users can update refacciones from their client or admins" ON public.refacciones;
CREATE POLICY "Users can update refacciones from their client or admins" 
ON public.refacciones 
FOR UPDATE 
USING (
  can_view_all_data() OR client_id = get_client_id_by_email_domain()
);

-- Tabla: inventario_refacciones
DROP POLICY IF EXISTS "Users can update inventario_refacciones from their client or ad" ON public.inventario_refacciones;
CREATE POLICY "Users can update inventario_refacciones from their client" 
ON public.inventario_refacciones 
FOR UPDATE 
USING (
  can_view_all_data() OR client_id = get_client_id_by_email_domain()
);

-- Tabla: solicitudes_refacciones
DROP POLICY IF EXISTS "Users can update solicitudes_refacciones from their client or a" ON public.solicitudes_refacciones;
CREATE POLICY "Users can update solicitudes_refacciones from their client" 
ON public.solicitudes_refacciones 
FOR UPDATE 
USING (
  can_view_all_data() OR client_id = get_client_id_by_email_domain()
);

-- Tabla: detalle_solicitudes_refacciones
DROP POLICY IF EXISTS "Users can update detalle_solicitudes_refacciones from their cli" ON public.detalle_solicitudes_refacciones;
CREATE POLICY "Users can update detalle_solicitudes_refacciones from their client" 
ON public.detalle_solicitudes_refacciones 
FOR UPDATE 
USING (
  can_view_all_data() OR client_id = get_client_id_by_email_domain()
);

-- Tabla: refacciones_mantenimiento
DROP POLICY IF EXISTS "Admins can update refacciones_mantenimiento from their client" ON public.refacciones_mantenimiento;
CREATE POLICY "Admins can update refacciones_mantenimiento from their client" 
ON public.refacciones_mantenimiento 
FOR UPDATE 
USING (
  is_admin() AND (can_view_all_data() OR client_id = get_client_id_by_email_domain())
);