-- Fix overly permissive RLS policies

-- 1. Restrict personal table to admins only for SELECT
DROP POLICY IF EXISTS "Users can view all personal" ON public.personal;
CREATE POLICY "Only admins can view personal"
ON public.personal
FOR SELECT
USING (is_admin());

-- 2. Restrict operadores table to admins only for SELECT
DROP POLICY IF EXISTS "Users can view all operadores" ON public.operadores;
CREATE POLICY "Only admins can view operadores"
ON public.operadores
FOR SELECT
USING (is_admin());

-- 3. Fix UPDATE policies to check ownership or admin role
-- personal table
DROP POLICY IF EXISTS "Users can update personal" ON public.personal;
CREATE POLICY "Users can update their own personal records or admins"
ON public.personal
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- operadores table
DROP POLICY IF EXISTS "Users can update operadores" ON public.operadores;
CREATE POLICY "Users can update their own operadores or admins"
ON public.operadores
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- liquidaciones table
DROP POLICY IF EXISTS "Users can update liquidaciones" ON public.liquidaciones;
CREATE POLICY "Users can update their own liquidaciones or admins"
ON public.liquidaciones
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- incidentes table
DROP POLICY IF EXISTS "Users can update incidentes" ON public.incidentes;
CREATE POLICY "Users can update their own incidentes or admins"
ON public.incidentes
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- mantenimientos table
DROP POLICY IF EXISTS "Users can update mantenimientos" ON public.mantenimientos;
CREATE POLICY "Users can update their own mantenimientos or admins"
ON public.mantenimientos
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- analisis_riesgos table
DROP POLICY IF EXISTS "Users can update analisis_riesgos" ON public.analisis_riesgos;
CREATE POLICY "Users can update their own analisis_riesgos or admins"
ON public.analisis_riesgos
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- unidades table
DROP POLICY IF EXISTS "Users can update unidades" ON public.unidades;
CREATE POLICY "Users can update their own unidades or admins"
ON public.unidades
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- viajes table
DROP POLICY IF EXISTS "Users can update viajes" ON public.viajes;
CREATE POLICY "Users can update their own viajes or admins"
ON public.viajes
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- visitas table
DROP POLICY IF EXISTS "Users can update visitas" ON public.visitas;
CREATE POLICY "Users can update visitas or admins"
ON public.visitas
FOR UPDATE
USING (is_admin());

-- sellos_seguridad table
DROP POLICY IF EXISTS "Users can update sellos_seguridad" ON public.sellos_seguridad;
CREATE POLICY "Users can update their own sellos_seguridad or admins"
ON public.sellos_seguridad
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- rutas table
DROP POLICY IF EXISTS "Users can update rutas" ON public.rutas;
CREATE POLICY "Users can update their own rutas or admins"
ON public.rutas
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- asistencia_personal table
DROP POLICY IF EXISTS "Users can update asistencia_personal" ON public.asistencia_personal;
CREATE POLICY "Users can update their own asistencia_personal or admins"
ON public.asistencia_personal
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());

-- zonas_seguridad table
DROP POLICY IF EXISTS "Users can update zonas_seguridad" ON public.zonas_seguridad;
CREATE POLICY "Users can update their own zonas_seguridad or admins"
ON public.zonas_seguridad
FOR UPDATE
USING (auth.uid() = created_by OR is_admin());