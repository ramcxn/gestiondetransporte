-- Modificar políticas RLS para que personal y operadores sean visibles para todos los usuarios autenticados
-- Ya que los empleados trabajan para ambas empresas

-- Actualizar política de visualización de personal
DROP POLICY IF EXISTS "Users can view personal from their client" ON public.personal;
CREATE POLICY "Users can view all personal"
ON public.personal
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Actualizar política de visualización de operadores
DROP POLICY IF EXISTS "Users can view operadores from their client" ON public.operadores;
CREATE POLICY "Users can view all operadores"
ON public.operadores
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Las políticas de creación y actualización se mantienen para que solo puedan modificar su propio cliente
-- pero todos pueden VER a todos los empleados