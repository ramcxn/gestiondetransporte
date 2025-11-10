-- Permitir que todos los usuarios autenticados puedan leer inventario de equipos (para escaneo QR)
DROP POLICY IF EXISTS "Users can view inventario_equipos from their client" ON public.inventario_equipos;

CREATE POLICY "All authenticated users can view inventario_equipos"
ON public.inventario_equipos
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Permitir que todos los usuarios autenticados puedan leer zonas de seguridad (para escaneo QR)
DROP POLICY IF EXISTS "Users can view zonas_seguridad from their client" ON public.zonas_seguridad;

CREATE POLICY "All authenticated users can view zonas_seguridad"
ON public.zonas_seguridad
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);