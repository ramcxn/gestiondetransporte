-- Add DELETE policies for admins across all tables

-- acciones_correctivas
CREATE POLICY "Admins can delete acciones_correctivas"
ON public.acciones_correctivas
FOR DELETE
USING (is_admin());

-- analisis_riesgos
CREATE POLICY "Admins can delete analisis_riesgos"
ON public.analisis_riesgos
FOR DELETE
USING (is_admin());

-- asistencia_personal
CREATE POLICY "Admins can delete asistencia_personal"
ON public.asistencia_personal
FOR DELETE
USING (is_admin());

-- departamentos
CREATE POLICY "Admins can delete departamentos"
ON public.departamentos
FOR DELETE
USING (is_admin());

-- detalle_solicitudes_refacciones
CREATE POLICY "Admins can delete detalle_solicitudes_refacciones"
ON public.detalle_solicitudes_refacciones
FOR DELETE
USING (is_admin());

-- historial_sellos
CREATE POLICY "Admins can delete historial_sellos"
ON public.historial_sellos
FOR DELETE
USING (is_admin());

-- incidentes
CREATE POLICY "Admins can delete incidentes"
ON public.incidentes
FOR DELETE
USING (is_admin());

-- ingreso_unidades
CREATE POLICY "Admins can delete ingreso_unidades"
ON public.ingreso_unidades
FOR DELETE
USING (is_admin());

-- inventario_equipos
CREATE POLICY "Admins can delete inventario_equipos"
ON public.inventario_equipos
FOR DELETE
USING (is_admin());

-- inventario_operador
CREATE POLICY "Admins can delete inventario_operador"
ON public.inventario_operador
FOR DELETE
USING (is_admin());

-- inventario_refacciones
CREATE POLICY "Admins can delete inventario_refacciones"
ON public.inventario_refacciones
FOR DELETE
USING (is_admin());

-- liquidaciones
CREATE POLICY "Admins can delete liquidaciones"
ON public.liquidaciones
FOR DELETE
USING (is_admin());

-- mantenimientos
CREATE POLICY "Admins can delete mantenimientos"
ON public.mantenimientos
FOR DELETE
USING (is_admin());

-- movimientos_refacciones
CREATE POLICY "Admins can delete movimientos_refacciones"
ON public.movimientos_refacciones
FOR DELETE
USING (is_admin());

-- operadores
CREATE POLICY "Admins can delete operadores"
ON public.operadores
FOR DELETE
USING (is_admin());

-- personal
CREATE POLICY "Admins can delete personal"
ON public.personal
FOR DELETE
USING (is_admin());

-- pruebas_alcoholimetro
CREATE POLICY "Admins can delete pruebas_alcoholimetro"
ON public.pruebas_alcoholimetro
FOR DELETE
USING (is_admin());

-- refacciones
CREATE POLICY "Admins can delete refacciones"
ON public.refacciones
FOR DELETE
USING (is_admin());

-- refacciones_mantenimiento
CREATE POLICY "Admins can delete refacciones_mantenimiento"
ON public.refacciones_mantenimiento
FOR DELETE
USING (is_admin());

-- revision_documental
CREATE POLICY "Admins can delete revision_documental"
ON public.revision_documental
FOR DELETE
USING (is_admin());

-- rondines
CREATE POLICY "Admins can delete rondines"
ON public.rondines
FOR DELETE
USING (is_admin());

-- rutas
CREATE POLICY "Admins can delete rutas"
ON public.rutas
FOR DELETE
USING (is_admin());

-- sellos_seguridad
CREATE POLICY "Admins can delete sellos_seguridad"
ON public.sellos_seguridad
FOR DELETE
USING (is_admin());

-- solicitudes_refacciones
CREATE POLICY "Admins can delete solicitudes_refacciones"
ON public.solicitudes_refacciones
FOR DELETE
USING (is_admin());