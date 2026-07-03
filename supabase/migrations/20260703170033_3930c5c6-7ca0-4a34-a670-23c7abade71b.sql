DROP POLICY IF EXISTS "Users can view inventario_equipos from their client" ON public.inventario_equipos;
DROP POLICY IF EXISTS "All authenticated users can view inventario_equipos" ON public.inventario_equipos;
CREATE POLICY "All authenticated users can view inventario_equipos"
ON public.inventario_equipos
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view operadores from their client" ON public.operadores;
DROP POLICY IF EXISTS "All authenticated users can view operadores" ON public.operadores;
CREATE POLICY "All authenticated users can view operadores"
ON public.operadores
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.inventario_equipos TO authenticated;
GRANT SELECT ON public.operadores TO authenticated;
GRANT ALL ON public.inventario_equipos TO service_role;
GRANT ALL ON public.operadores TO service_role;