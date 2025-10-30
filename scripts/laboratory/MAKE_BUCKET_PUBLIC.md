# Hacer el Bucket Público en Supabase

## Pasos Rápidos:

1. Ve a **Storage** en tu Dashboard de Supabase
2. Haz clic en el bucket `lab-results`
3. Ve a la pestaña **Settings** (Configuración)
4. Busca la opción **"Public bucket"** o **"Bucket público"**
5. **Activa el toggle** para hacerlo público
6. Guarda los cambios

## Alternativa: Usando SQL

También puedes ejecutar este SQL si prefieres:

```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'lab-results';
```

## Nota:

- Los buckets públicos permiten acceso directo a los archivos sin autenticación
- Los buckets privados requieren URLs firmadas (que ya implementamos en el código)
- Con la implementación actual del código, funcionará con ambos tipos de bucket

