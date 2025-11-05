-- Función para determinar si un usuario puede ver todos los datos
-- Reglas:
-- - rh@portecalesa.com puede ver todo
-- - seguridad@portecalesa.com puede ver todo  
-- - Cualquier @gestiondetransporte.com puede ver todo
CREATE OR REPLACE FUNCTION public.can_view_all_data()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() 
    AND (
      email = 'rh@portecalesa.com' 
      OR email = 'seguridad@portecalesa.com'
      OR email LIKE '%@gestiondetransporte.com'
    )
  ) OR is_admin();
$$;

-- Función para obtener el client_id basado en el dominio del email
-- Reglas:
-- - @portecalesa.com → PORTECALESA (27bcde1f-9aae-4643-9890-a975e8d8da45)
-- - @hhexpress.com → HH EXPRESS (4a4675f0-cf54-4a64-bc49-8f261aaca70c)
-- - Si puede ver todo, retorna NULL (sin filtro)
CREATE OR REPLACE FUNCTION public.get_client_id_by_email_domain()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN can_view_all_data() THEN NULL
      WHEN p.email LIKE '%@portecalesa.com' THEN '27bcde1f-9aae-4643-9890-a975e8d8da45'::uuid
      WHEN p.email LIKE '%@hhexpress.com' THEN '4a4675f0-cf54-4a64-bc49-8f261aaca70c'::uuid
      ELSE p.client_id
    END
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Función mejorada para filtrar por client_id considerando el dominio del email
CREATE OR REPLACE FUNCTION public.matches_user_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    can_view_all_data() OR 
    get_client_id_by_email_domain() = get_user_client_id();
$$;

-- Actualizar políticas RLS para usar el nuevo filtrado por dominio
-- Comenzamos con las tablas principales

-- Tabla: viajes
DROP POLICY IF EXISTS "Users can view viajes from their client" ON public.viajes;
CREATE POLICY "Users can view viajes from their client" 
ON public.viajes 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

DROP POLICY IF EXISTS "Users can create viajes for their client" ON public.viajes;
CREATE POLICY "Users can create viajes for their client" 
ON public.viajes 
FOR INSERT 
WITH CHECK (can_view_all_data() OR client_id = get_client_id_by_email_domain());

DROP POLICY IF EXISTS "Users can update viajes from their client or admins" ON public.viajes;
CREATE POLICY "Users can update viajes from their client or admins" 
ON public.viajes 
FOR UPDATE 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: inventario_equipos
DROP POLICY IF EXISTS "Users can view inventario_equipos from their client" ON public.inventario_equipos;
CREATE POLICY "Users can view inventario_equipos from their client" 
ON public.inventario_equipos 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain() OR client_id IS NULL);

-- Tabla: mantenimientos
DROP POLICY IF EXISTS "Users can view mantenimientos from their client" ON public.mantenimientos;
CREATE POLICY "Users can view mantenimientos from their client" 
ON public.mantenimientos 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: operadores
DROP POLICY IF EXISTS "Users can view operadores from their client" ON public.operadores;
CREATE POLICY "Users can view operadores from their client" 
ON public.operadores 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: personal
DROP POLICY IF EXISTS "Users can view personal from their client" ON public.personal;
CREATE POLICY "Users can view personal from their client" 
ON public.personal 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: rondines
DROP POLICY IF EXISTS "Users can view rondines from their client" ON public.rondines;
CREATE POLICY "Users can view rondines from their client" 
ON public.rondines 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: revision_documental
DROP POLICY IF EXISTS "Users can view revision_documental from their client" ON public.revision_documental;
CREATE POLICY "Users can view revision_documental from their client" 
ON public.revision_documental 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: incidentes
DROP POLICY IF EXISTS "Users can view incidentes from their client" ON public.incidentes;
CREATE POLICY "Users can view incidentes from their client" 
ON public.incidentes 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: analisis_riesgos
DROP POLICY IF EXISTS "Users can view analisis_riesgos from their client" ON public.analisis_riesgos;
CREATE POLICY "Users can view analisis_riesgos from their client" 
ON public.analisis_riesgos 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: acciones_correctivas
DROP POLICY IF EXISTS "Users can view acciones_correctivas from their client" ON public.acciones_correctivas;
CREATE POLICY "Users can view acciones_correctivas from their client" 
ON public.acciones_correctivas 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: solicitudes_refacciones
DROP POLICY IF EXISTS "Users can view solicitudes_refacciones from their client" ON public.solicitudes_refacciones;
CREATE POLICY "Users can view solicitudes_refacciones from their client" 
ON public.solicitudes_refacciones 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: refacciones
DROP POLICY IF EXISTS "Users can view refacciones from their client" ON public.refacciones;
CREATE POLICY "Users can view refacciones from their client" 
ON public.refacciones 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: inventario_refacciones
DROP POLICY IF EXISTS "Users can view inventario_refacciones from their client" ON public.inventario_refacciones;
CREATE POLICY "Users can view inventario_refacciones from their client" 
ON public.inventario_refacciones 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: liquidaciones
DROP POLICY IF EXISTS "Users can view liquidaciones from their client" ON public.liquidaciones;
CREATE POLICY "Users can view liquidaciones from their client" 
ON public.liquidaciones 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: asistencia_personal
DROP POLICY IF EXISTS "Users can view asistencia_personal from their client" ON public.asistencia_personal;
CREATE POLICY "Users can view asistencia_personal from their client" 
ON public.asistencia_personal 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: pruebas_alcoholimetro
DROP POLICY IF EXISTS "Users can view pruebas_alcoholimetro from their client" ON public.pruebas_alcoholimetro;
CREATE POLICY "Users can view pruebas_alcoholimetro from their client" 
ON public.pruebas_alcoholimetro 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: ingreso_unidades
DROP POLICY IF EXISTS "Users can view ingreso_unidades from their client" ON public.ingreso_unidades;
CREATE POLICY "Users can view ingreso_unidades from their client" 
ON public.ingreso_unidades 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: sellos_seguridad
DROP POLICY IF EXISTS "Users can view sellos_seguridad from their client" ON public.sellos_seguridad;
CREATE POLICY "Users can view sellos_seguridad from their client" 
ON public.sellos_seguridad 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: inventario_operador
DROP POLICY IF EXISTS "Users can view inventario_operador from their client" ON public.inventario_operador;
CREATE POLICY "Users can view inventario_operador from their client" 
ON public.inventario_operador 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());

-- Tabla: rutas
DROP POLICY IF EXISTS "Users can view rutas from their client" ON public.rutas;
CREATE POLICY "Users can view rutas from their client" 
ON public.rutas 
FOR SELECT 
USING (can_view_all_data() OR client_id = get_client_id_by_email_domain());