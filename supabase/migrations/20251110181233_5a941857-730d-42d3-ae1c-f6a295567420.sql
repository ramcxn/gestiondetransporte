-- Agregar política para que los admins puedan eliminar visitas
CREATE POLICY "Admins can delete visitas"
ON public.visitas
FOR DELETE
USING (is_admin());