-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Create a helper function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$;

-- Recreate admin policies using the helper function
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
ON user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON user_roles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON user_roles
FOR DELETE
USING (public.is_admin());

-- Create operators table
CREATE TABLE IF NOT EXISTS public.operadores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  numero_empleado text NOT NULL UNIQUE,
  fecha_alta date NOT NULL,
  fecha_vencimiento_contrato date NOT NULL,
  direccion text NOT NULL,
  numero_licencia text,
  fecha_vencimiento_licencia date,
  pdf_url text,
  estado text NOT NULL DEFAULT 'activo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all operadores"
ON public.operadores
FOR SELECT
USING (true);

CREATE POLICY "Users can create operadores"
ON public.operadores
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update operadores"
ON public.operadores
FOR UPDATE
USING (true);

-- Create storage bucket for operator documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-operadores', 'documentos-operadores', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for operator documents
CREATE POLICY "Authenticated users can upload operator documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos-operadores');

CREATE POLICY "Authenticated users can view operator documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos-operadores');

CREATE POLICY "Authenticated users can update operator documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos-operadores');

-- Create storage bucket for unit entry photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-unidades', 'fotos-unidades', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for unit photos
CREATE POLICY "Authenticated users can upload unit photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-unidades');

CREATE POLICY "Authenticated users can view unit photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'fotos-unidades');

-- Create storage bucket for security rounds photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-rondines', 'fotos-rondines', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for security rounds photos
CREATE POLICY "Authenticated users can upload rounds photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-rondines');

CREATE POLICY "Authenticated users can view rounds photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'fotos-rondines');