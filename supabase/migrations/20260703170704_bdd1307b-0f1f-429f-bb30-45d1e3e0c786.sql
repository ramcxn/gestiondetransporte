ALTER TABLE public.user_module_permissions
  ADD COLUMN IF NOT EXISTS can_read boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_write boolean NOT NULL DEFAULT true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;

CREATE OR REPLACE FUNCTION public.module_names_for_table(_table_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _table_name
    WHEN 'acciones_correctivas' THEN ARRAY['acciones-correctivas','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'analisis_riesgos' THEN ARRAY['analisis-riesgos','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'asistencia_personal' THEN ARRAY['asistencia','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'clientes' THEN ARRAY['clientes','viajes','analisis-ruta','dashboard']::text[]
    WHEN 'departamentos' THEN ARRAY['personal','asistencia']::text[]
    WHEN 'detalle_solicitudes_refacciones' THEN ARRAY['almacen']::text[]
    WHEN 'historial_sellos' THEN ARRAY['sellos','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'incidentes' THEN ARRAY['analisis-riesgos','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'ingreso_unidades' THEN ARRAY['unidades','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'inspecciones_instalaciones' THEN ARRAY['instalaciones','mantenimiento','dashboard-cumplimiento']::text[]
    WHEN 'inventario_equipos' THEN ARRAY['inventario','unidades','mantenimiento','viajes','inventario-operador','revision-documental','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'inventario_operador' THEN ARRAY['inventario-operador','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'inventario_refacciones' THEN ARRAY['almacen','mantenimiento','dashboard']::text[]
    WHEN 'liquidaciones' THEN ARRAY['liquidaciones','dashboard']::text[]
    WHEN 'mantenimientos' THEN ARRAY['mantenimiento','dashboard']::text[]
    WHEN 'movimientos_refacciones' THEN ARRAY['almacen','mantenimiento','dashboard']::text[]
    WHEN 'operadores' THEN ARRAY['operadores','unidades','revision-documental','inventario-operador','viajes','liquidaciones','antidoping','alcoholimetro','vacaciones','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'personal' THEN ARRAY['personal','asistencia','antidoping','alcoholimetro','vacaciones','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'pruebas_alcoholimetro' THEN ARRAY['alcoholimetro','antidoping','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'refacciones' THEN ARRAY['almacen','mantenimiento','dashboard']::text[]
    WHEN 'refacciones_mantenimiento' THEN ARRAY['mantenimiento','almacen','dashboard']::text[]
    WHEN 'revision_documental' THEN ARRAY['revision-documental','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'rondines' THEN ARRAY['rondines','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'rutas' THEN ARRAY['analisis-ruta','viajes','dashboard']::text[]
    WHEN 'sellos_seguridad' THEN ARRAY['sellos','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'solicitudes_refacciones' THEN ARRAY['almacen','dashboard']::text[]
    WHEN 'ubicaciones_almacen' THEN ARRAY['almacen']::text[]
    WHEN 'unidades' THEN ARRAY['revision-documental','unidades','inventario','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'vacaciones' THEN ARRAY['vacaciones','personal','dashboard']::text[]
    WHEN 'vales_salida' THEN ARRAY['asistencia','personal','dashboard']::text[]
    WHEN 'viajes' THEN ARRAY['viajes','liquidaciones','sellos','dashboard']::text[]
    WHEN 'visitas' THEN ARRAY['visitas','dashboard','dashboard-cumplimiento']::text[]
    WHEN 'visitas_zonas' THEN ARRAY['visitas','rondines','dashboard-cumplimiento']::text[]
    WHEN 'zonas_seguridad' THEN ARRAY['zonas-seguridad','rondines','visitas','dashboard-cumplimiento']::text[]
    WHEN 'profiles' THEN ARRAY['dashboard','usuarios','personal','operadores','unidades','revision-documental','rondines','visitas','almacen','mantenimiento','viajes','liquidaciones','analisis-ruta','analisis-riesgos','acciones-correctivas','sellos','asistencia','antidoping','alcoholimetro','vacaciones','inventario','inventario-operador','instalaciones']::text[]
    ELSE ARRAY[_table_name]::text[]
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_any_module_permission(_user_id uuid, _module_names text[], _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN public.has_role(_user_id, 'admin'::public.app_role) THEN true
    WHEN NOT EXISTS (
      SELECT 1 FROM public.user_module_permissions ump
      WHERE ump.user_id = _user_id
    ) THEN true
    WHEN lower(coalesce(_permission, 'read')) IN ('write','insert','update') THEN EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      WHERE ump.user_id = _user_id
        AND ump.module_name = ANY(_module_names)
        AND ump.can_access = true
        AND coalesce(ump.can_write, ump.can_access, true) = true
    )
    ELSE EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      WHERE ump.user_id = _user_id
        AND ump.module_name = ANY(_module_names)
        AND ump.can_access = true
        AND coalesce(ump.can_read, ump.can_access, true) = true
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_module_permission(_user_id, ARRAY[_module_name]::text[], 'read')
$$;

CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module_name text, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_module_permission(_user_id, ARRAY[_module_name]::text[], _permission)
$$;

CREATE OR REPLACE FUNCTION public.has_table_module_permission(_user_id uuid, _table_name text, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_module_permission(_user_id, public.module_names_for_table(_table_name), _permission)
$$;

DO $$
DECLARE
  tbl text;
  app_tables text[] := ARRAY[
    'acciones_correctivas','analisis_riesgos','asistencia_personal','departamentos',
    'detalle_solicitudes_refacciones','historial_sellos','incidentes','ingreso_unidades',
    'inspecciones_instalaciones','inventario_equipos','inventario_operador','inventario_refacciones',
    'liquidaciones','mantenimientos','movimientos_refacciones','operadores','personal',
    'pruebas_alcoholimetro','refacciones','refacciones_mantenimiento','revision_documental',
    'rondines','rutas','sellos_seguridad','solicitudes_refacciones','ubicaciones_almacen',
    'unidades','vacaciones','vales_salida','viajes','visitas','visitas_zonas','zonas_seguridad'
  ];
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Module read access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Module read guard" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Module insert access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Module insert guard" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Module update access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Module update guard" ON public.%I', tbl);

    EXECUTE format('CREATE POLICY "Module read access" ON public.%I AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_table_module_permission(auth.uid(), %L, ''read''))', tbl, tbl);
    EXECUTE format('CREATE POLICY "Module read guard" ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.has_table_module_permission(auth.uid(), %L, ''read''))', tbl, tbl);
    EXECUTE format('CREATE POLICY "Module insert access" ON public.%I AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.has_table_module_permission(auth.uid(), %L, ''write''))', tbl, tbl);
    EXECUTE format('CREATE POLICY "Module insert guard" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.has_table_module_permission(auth.uid(), %L, ''write''))', tbl, tbl);
    EXECUTE format('CREATE POLICY "Module update access" ON public.%I AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_table_module_permission(auth.uid(), %L, ''write'')) WITH CHECK (public.has_table_module_permission(auth.uid(), %L, ''write''))', tbl, tbl, tbl);
    EXECUTE format('CREATE POLICY "Module update guard" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_table_module_permission(auth.uid(), %L, ''write'')) WITH CHECK (public.has_table_module_permission(auth.uid(), %L, ''write''))', tbl, tbl, tbl);
  END LOOP;
END $$;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
DROP POLICY IF EXISTS "Module read access" ON public.profiles;
DROP POLICY IF EXISTS "Module read guard" ON public.profiles;
CREATE POLICY "Module read access" ON public.profiles
AS PERMISSIVE FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_table_module_permission(auth.uid(), 'profiles', 'read'));
CREATE POLICY "Module read guard" ON public.profiles
AS RESTRICTIVE FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_table_module_permission(auth.uid(), 'profiles', 'read'));
