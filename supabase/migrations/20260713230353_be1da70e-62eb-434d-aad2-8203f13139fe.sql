
DROP POLICY IF EXISTS "Users can create operadores for their client" ON public.operadores;
DROP POLICY IF EXISTS "Users can update operadores from their client or admins" ON public.operadores;

CREATE POLICY "Users can create operadores for their client"
ON public.operadores
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    is_admin()
    OR client_id = get_user_client_id()
    OR client_id = get_client_id_by_email_domain()
  )
);

CREATE POLICY "Users can update operadores from their client or admins"
ON public.operadores
FOR UPDATE
TO authenticated
USING (
  is_admin()
  OR client_id = get_user_client_id()
  OR client_id = get_client_id_by_email_domain()
)
WITH CHECK (
  is_admin()
  OR client_id = get_user_client_id()
  OR client_id = get_client_id_by_email_domain()
);
