-- ==========================================
-- FASE 1: INFRAESTRUCTURA MULTI-TENANT (CORREGIDO)
-- ==========================================

-- 1. Crear tabla de clientes (tenants)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rfc TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS en tabla clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 2. Agregar client_id a la tabla profiles (PRIMERO)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

-- 3. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);

-- 4. AHORA crear función para obtener el client_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id 
  FROM public.profiles 
  WHERE id = auth.uid()
$$;

-- 5. Políticas RLS para tabla clientes
-- Solo admins pueden ver todos los clientes
CREATE POLICY "Admins can view all clientes"
ON public.clientes
FOR SELECT
USING (is_admin());

-- Super admins pueden gestionar clientes
CREATE POLICY "Admins can manage clientes"
ON public.clientes
FOR ALL
USING (is_admin());

-- 6. Actualizar función handle_new_user para requerir client_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile con client_id desde metadata
  INSERT INTO public.profiles (id, email, full_name, puesto, client_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'puesto',
    (NEW.raw_user_meta_data->>'client_id')::uuid
  );
  
  -- Assign role from metadata or default to 'usuario'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario'));
  
  RETURN NEW;
END;
$$;