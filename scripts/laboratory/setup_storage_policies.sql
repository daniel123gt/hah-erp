-- Configurar políticas RLS (Row Level Security) para el bucket lab-results
-- Esto permite que los usuarios autenticados suban, lean, actualicen y eliminen archivos

-- IMPORTANTE: Este script debe ejecutarse en el SQL Editor de Supabase
-- Asegúrate de que el bucket "lab-results" ya esté creado

-- 1. Habilitar RLS en el storage.objects (si no está habilitado ya)
-- Nota: RLS normalmente ya está habilitado por defecto en Supabase Storage

-- 2. Política para PERMITIR LECTURA pública de archivos
CREATE POLICY "Allow public read access to lab-results"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-results');

-- 3. Política para PERMITIR SUBIDA de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to upload lab-results"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- 4. Política para PERMITIR ACTUALIZACIÓN de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to update lab-results"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- 5. Política para PERMITIR ELIMINACIÓN de archivos por usuarios autenticados
CREATE POLICY "Allow authenticated users to delete lab-results"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- Si ya existen políticas anteriores para este bucket, puedes eliminarlas primero:
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

