# Configuración de Supabase Storage para Resultados de Laboratorio

## Descripción

Este sistema permite subir y almacenar resultados de exámenes en formato PDF usando Supabase Storage, optimizando el espacio almacenando solo las URLs en la base de datos.

## Pasos de Configuración

### 1. Crear el Bucket en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**
4. Nombre del bucket: `lab-results`
5. Habilita **Public bucket** si quieres acceso público (o usa signed URLs)
6. Haz clic en **Create bucket**

### 2. Configurar Políticas de Acceso (RLS)

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Permitir lectura pública de resultados (opcional, ajusta según tus necesidades)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-results');

-- Permitir subida de archivos autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualización de archivos autenticados
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);

-- Permitir eliminación de archivos autenticados
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-results' 
  AND auth.role() = 'authenticated'
);
```

**Nota**: Ajusta estas políticas según tus necesidades de seguridad. Puedes hacerlas más restrictivas si es necesario.

### 3. Ejecutar el Script SQL de Base de Datos

Ejecuta el script `add_pdf_results_to_orders.sql` para agregar los campos necesarios:

```bash
# En Supabase SQL Editor, ejecuta:
scripts/laboratory/add_pdf_results_to_orders.sql
```

## Estructura de Archivos

Los PDFs se organizan así en el storage:
```
lab-results/
  └── ordenes/
      └── {order_id}/
          └── {item_id}/
              └── {timestamp}-{random}.pdf
```

## Optimización de Espacio

### Para Minimizar el Tamaño de los PDFs:

1. **Antes de subir**: Comprime los PDFs usando herramientas como:
   - Adobe Acrobat (Optimize PDF)
   - PDF Compressor online
   - Ghostscript (línea de comandos)

2. **Recomendaciones**:
   - Tamaño máximo recomendado: 5-10MB por PDF
   - Usar resolución de 150-200 DPI para imágenes en PDFs
   - Remover metadatos innecesarios

3. **En el futuro**: Se puede implementar compresión automática en el frontend usando bibliotecas como `pdf-lib` o `jspdf`.

## Uso en la Aplicación

El componente `UploadResultPdf` ya está integrado en la página de detalle de órdenes (`OrdenDetalle.tsx`). Los usuarios pueden:

- Subir un PDF de resultado para cada examen
- Ver el PDF subido
- Actualizar el PDF si es necesario
- Eliminar el PDF y sus datos asociados

## Limitaciones

- Tamaño máximo por archivo: 10MB (configurable en el componente)
- Formato: Solo PDFs
- El bucket debe existir antes de usar la funcionalidad

## Solución de Problemas

### Error: "Bucket not found"
- Verifica que el bucket `lab-results` existe en Supabase Storage
- Verifica que el nombre del bucket coincide exactamente

### Error: "Access denied"
- Verifica las políticas RLS del bucket
- Asegúrate de estar autenticado como usuario

### Archivo no se sube
- Verifica el tamaño del archivo (debe ser menor a 10MB)
- Verifica la conexión a internet
- Revisa la consola del navegador para más detalles

