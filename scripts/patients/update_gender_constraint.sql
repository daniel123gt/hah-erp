-- Script para actualizar la restricción de género a solo F y M
-- Ejecutar en el SQL Editor de Supabase

-- 1. Eliminar la restricción existente
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;

-- 2. Agregar nueva restricción que solo permite F y M
ALTER TABLE patients ADD CONSTRAINT patients_gender_check 
CHECK (gender IN ('F', 'M'));

-- 3. Verificar que la restricción se aplicó correctamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patients'::regclass 
AND contype = 'c'
AND conname = 'patients_gender_check';

-- 4. Verificar que todos los registros existentes cumplen la nueva restricción
SELECT 
    gender,
    COUNT(*) as count
FROM patients 
GROUP BY gender;

-- 5. Si hay registros con género 'O', actualizarlos (opcional)
-- UPDATE patients SET gender = 'F' WHERE gender = 'O';
