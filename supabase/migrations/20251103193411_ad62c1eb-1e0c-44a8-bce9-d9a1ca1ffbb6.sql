-- Create table for user module permissions
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- Enable RLS
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Create function to check module permissions
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Si es admin, tiene acceso a todo
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN true
    -- Si no hay registro de permisos, permitir por defecto (compatibilidad)
    WHEN NOT EXISTS (SELECT 1 FROM public.user_module_permissions WHERE user_id = _user_id AND module_name = _module_name) THEN true
    -- Si existe registro, verificar permiso
    ELSE EXISTS (SELECT 1 FROM public.user_module_permissions WHERE user_id = _user_id AND module_name = _module_name AND can_access = true)
  END
$$;

-- Policies: Users can view their own permissions
CREATE POLICY "Users can view their own module permissions"
ON public.user_module_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policies: Admins can view all permissions
CREATE POLICY "Admins can view all module permissions"
ON public.user_module_permissions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policies: Admins can insert permissions
CREATE POLICY "Admins can insert module permissions"
ON public.user_module_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policies: Admins can update permissions
CREATE POLICY "Admins can update module permissions"
ON public.user_module_permissions
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Policies: Admins can delete permissions
CREATE POLICY "Admins can delete module permissions"
ON public.user_module_permissions
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Trigger to update updated_at
CREATE TRIGGER update_user_module_permissions_updated_at
BEFORE UPDATE ON public.user_module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();