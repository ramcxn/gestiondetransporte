-- Crear función para verificar permisos de módulo
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_module_permissions
    WHERE user_id = _user_id
      AND module_name = _module_name
      AND can_access = true
  )
$$;

-- Actualizar política INSERT para asistencia_personal
DROP POLICY IF EXISTS "Users can create asistencia_personal for their client" ON public.asistencia_personal;
CREATE POLICY "Users can create asistencia_personal for their client"
ON public.asistencia_personal
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (is_admin() OR has_module_permission(auth.uid(), 'asistencia'))
);

-- Actualizar política UPDATE para asistencia_personal
DROP POLICY IF EXISTS "Users can update asistencia_personal from their client or admin" ON public.asistencia_personal;
CREATE POLICY "Users can update asistencia_personal from their client or admin"
ON public.asistencia_personal
FOR UPDATE
USING (
  is_admin() OR 
  has_module_permission(auth.uid(), 'asistencia') OR
  ((client_id = get_user_client_id()) AND (auth.uid() = created_by))
);

-- Verificar si existe tabla ingresos_unidades y actualizar políticas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingresos_unidades') THEN
    -- Actualizar política INSERT para ingresos_unidades
    DROP POLICY IF EXISTS "Users can create ingresos_unidades for their client" ON public.ingresos_unidades;
    CREATE POLICY "Users can create ingresos_unidades for their client"
    ON public.ingresos_unidades
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      (is_admin() OR has_module_permission(auth.uid(), 'unidades'))
    );

    -- Actualizar política UPDATE para ingresos_unidades
    EXECUTE 'DROP POLICY IF EXISTS "Users can update ingresos_unidades from their client or admin" ON public.ingresos_unidades';
    EXECUTE 'CREATE POLICY "Users can update ingresos_unidades from their client or admin"
    ON public.ingresos_unidades
    FOR UPDATE
    USING (
      is_admin() OR 
      has_module_permission(auth.uid(), ''unidades'') OR
      ((client_id = get_user_client_id()) AND (auth.uid() = created_by))
    )';
  END IF;
END $$;