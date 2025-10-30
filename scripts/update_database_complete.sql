-- =====================================================
-- SCRIPT MAESTRO PARA ACTUALIZAR BASE DE DATOS
-- Health At Home ERP - Actualización completa
-- =====================================================

-- Este script actualiza la base de datos existente con la estructura real
-- identificada en el análisis de archivos Excel

-- 0. CREAR FUNCIÓN set_updated_at() PRIMERO
\echo 'Creando función set_updated_at...'
\i scripts/create_updated_at_function.sql

-- 1. ACTUALIZAR TABLA PATIENTS
\echo 'Actualizando tabla patients...'
\i scripts/patients/update_patients_table.sql

-- 2. CREAR TABLA DE CONTRATOS
\echo 'Creando tabla patient_contracts...'
\i scripts/patients/create_patient_contracts_table.sql

-- 3. CREAR TABLA DE PAGOS
\echo 'Creando tabla patient_payments...'
\i scripts/patients/create_patient_payments_table.sql

-- 4. CREAR TABLA DE SERVICIOS EVENTUALES
\echo 'Creando tabla eventual_services...'
\i scripts/services/create_eventual_services_table.sql

-- 5. CREAR TABLAS DE SOPORTE
\echo 'Creando tablas de soporte...'
\i scripts/support/create_support_tables.sql

-- 6. VERIFICAR ESTRUCTURA FINAL
\echo 'Verificando estructura final...'

-- Mostrar todas las tablas creadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'patients', 
        'staff', 
        'patient_history',
        'patient_contracts',
        'patient_payments', 
        'eventual_services',
        'districts',
        'service_types'
    )
ORDER BY tablename;

-- Mostrar conteo de registros en tablas de soporte
SELECT 'districts' as tabla, COUNT(*) as registros FROM districts
UNION ALL
SELECT 'service_types' as tabla, COUNT(*) as registros FROM service_types;

\echo '✅ Actualización de base de datos completada exitosamente!'
\echo '📊 Estructura actualizada con datos reales de Health At Home'
