-- Crear tabla para refacciones usadas en mantenimientos
CREATE TABLE public.refacciones_mantenimiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mantenimiento_id UUID NOT NULL REFERENCES public.mantenimientos(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES public.inventario_refacciones(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  costo_unitario NUMERIC NOT NULL,
  costo_total NUMERIC NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Crear tabla de permisos de módulos por usuario
CREATE TABLE public.user_module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- Habilitar RLS
ALTER TABLE public.refacciones_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para refacciones_mantenimiento
CREATE POLICY "Users can view all refacciones_mantenimiento" ON public.refacciones_mantenimiento
  FOR SELECT USING (true);

CREATE POLICY "Users can create refacciones_mantenimiento" ON public.refacciones_mantenimiento
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update refacciones_mantenimiento" ON public.refacciones_mantenimiento
  FOR UPDATE USING (is_admin());

-- Políticas para user_module_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_module_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions" ON public.user_module_permissions
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage permissions" ON public.user_module_permissions
  FOR ALL USING (is_admin());

-- Crear índices
CREATE INDEX idx_refacciones_mantenimiento_mantenimiento ON public.refacciones_mantenimiento(mantenimiento_id);
CREATE INDEX idx_refacciones_mantenimiento_inventario ON public.refacciones_mantenimiento(inventario_id);
CREATE INDEX idx_user_module_permissions_user ON public.user_module_permissions(user_id);

-- Crear función para verificar permisos de módulo
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