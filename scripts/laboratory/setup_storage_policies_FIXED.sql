-- Configurar políticas RLS (Row Level Security) para el bucket lab-results
-- EJECUTA ESTE SCRIPT COMPLETO EN EL SQL EDITOR DE SUPABASE

-- 1. Política para PERMITIR LECTURA pública de archivos
CREATE POLICY "Allow public read access to lab-results"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-results');

-- 2. Política para PERMITIR SUBIDA de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to upload lab-results"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- 3. Política para PERMITIR ACTUALIZACIÓN de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to update lab-results"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- 4. Política para PERMITIR ELIMINACIÓN de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to delete lab-results"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

