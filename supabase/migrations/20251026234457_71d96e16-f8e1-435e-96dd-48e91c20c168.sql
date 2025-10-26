-- Create storage bucket for visit credentials
INSERT INTO storage.buckets (id, name, public)
VALUES ('credenciales-visitas', 'credenciales-visitas', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for credential uploads
CREATE POLICY "Authenticated users can upload credentials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'credenciales-visitas');

CREATE POLICY "Authenticated users can view credentials"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'credenciales-visitas');

CREATE POLICY "Authenticated users can update their credentials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'credenciales-visitas');

CREATE POLICY "Authenticated users can delete credentials"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'credenciales-visitas');