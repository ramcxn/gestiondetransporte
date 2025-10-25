-- Add puesto column to profiles
ALTER TABLE public.profiles ADD COLUMN puesto TEXT;

-- Update handle_new_user function to include puesto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, puesto)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'puesto');
  
  -- Assign role from metadata or default to 'usuario'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario'));
  
  RETURN NEW;
END;
$$;