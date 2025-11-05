-- Actualizar el trigger para asignar client_id automáticamente basado en el dominio del email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  assigned_client_id uuid;
BEGIN
  -- Determinar el client_id basado en el dominio del email
  IF NEW.email LIKE '%@portecalesa.com' THEN
    assigned_client_id := '27bcde1f-9aae-4643-9890-a975e8d8da45'::uuid;
  ELSIF NEW.email LIKE '%@hhexpress.com' THEN
    assigned_client_id := '4a4675f0-cf54-4a64-bc49-8f261aaca70c'::uuid;
  ELSE
    -- Si hay client_id en metadata, usarlo; si no, usar null
    assigned_client_id := (NEW.raw_user_meta_data->>'client_id')::uuid;
  END IF;

  -- Insert profile con client_id asignado
  INSERT INTO public.profiles (id, email, full_name, puesto, client_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'puesto',
    assigned_client_id
  );
  
  -- Assign role from metadata or default to 'usuario'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario'));
  
  RETURN NEW;
END;
$function$;