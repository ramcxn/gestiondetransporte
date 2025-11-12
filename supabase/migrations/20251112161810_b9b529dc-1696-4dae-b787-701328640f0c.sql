-- Crear bucket para fotos de inspecciones de instalaciones
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-instalaciones', 'fotos-instalaciones', true);

-- Políticas RLS para el bucket
CREATE POLICY "Users can view fotos-instalaciones"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-instalaciones');

CREATE POLICY "Users can upload fotos-instalaciones"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-instalaciones' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their fotos-instalaciones"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos-instalaciones' AND auth.uid() IS NOT NULL);