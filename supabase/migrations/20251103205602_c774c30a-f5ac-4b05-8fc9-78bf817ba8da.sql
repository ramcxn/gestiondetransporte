-- Actualizar política de SELECT para mostrar todos los equipos del cliente
DROP POLICY IF EXISTS "Users can view inventario_equipos from their client" ON public.inventario_equipos;

CREATE POLICY "Users can view inventario_equipos from their client"
ON public.inventario_equipos
FOR SELECT
USING (
  client_id = get_user_client_id() OR 
  client_id IS NULL OR 
  is_admin()
);