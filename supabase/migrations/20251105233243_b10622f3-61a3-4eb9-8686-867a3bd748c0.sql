-- Actualizar política SELECT para ubicaciones_almacen
DROP POLICY IF EXISTS "Users can view ubicaciones_almacen from their client" ON public.ubicaciones_almacen;

CREATE POLICY "Users can view ubicaciones_almacen from their client"
ON public.ubicaciones_almacen
FOR SELECT
USING (can_view_all_data() OR (client_id = get_client_id_by_email_domain()));