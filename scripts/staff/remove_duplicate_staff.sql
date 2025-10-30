-- Script para eliminar personal duplicado
-- Ejecutar en el SQL Editor de Supabase

-- 1. Identificar personal duplicado por email
SELECT 
    email,
    COUNT(*) as duplicate_count,
    array_agg(id) as staff_ids
FROM staff 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Identificar personal duplicado por nombre y teléfono
SELECT 
    name,
    phone,
    COUNT(*) as duplicate_count,
    array_agg(id) as staff_ids
FROM staff 
WHERE phone IS NOT NULL 
GROUP BY name, phone 
HAVING COUNT(*) > 1;

-- 3. Eliminar duplicados (mantener el más reciente por created_at)
-- CUIDADO: Ejecutar solo después de revisar los resultados anteriores

-- Para duplicados por email:
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY created_at DESC
        ) as rn
    FROM staff 
    WHERE email IS NOT NULL
)
DELETE FROM staff 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- Para duplicados por nombre y teléfono:
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY name, phone 
            ORDER BY created_at DESC
        ) as rn
    FROM staff 
    WHERE phone IS NOT NULL
)
DELETE FROM staff 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 4. Verificar que no quedan duplicados
SELECT 
    email,
    COUNT(*) as count
FROM staff 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

SELECT 
    name,
    phone,
    COUNT(*) as count
FROM staff 
WHERE phone IS NOT NULL 
GROUP BY name, phone 
HAVING COUNT(*) > 1;
