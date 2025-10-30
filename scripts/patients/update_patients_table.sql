-- =====================================================
-- ACTUALIZACIÓN DE TABLA PATIENTS CON CAMPOS REALES
-- Basado en análisis de archivos Excel de Health At Home
-- =====================================================

-- Agregar nuevos campos a la tabla patients existente
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS primary_physician TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT[],
ADD COLUMN IF NOT EXISTS primary_diagnosis TEXT;

-- Actualizar constraint de gender para incluir solo M y F
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;
ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('M', 'F'));

-- Crear índice para district
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN patients.district IS 'Distrito de residencia del paciente (ej: SAN BORJAS, JESÚS MARÍA)';
COMMENT ON COLUMN patients.emergency_contact_name IS 'Nombre del contacto de emergencia';
COMMENT ON COLUMN patients.emergency_contact_phone IS 'Teléfono del contacto de emergencia';
COMMENT ON COLUMN patients.primary_physician IS 'Médico tratante principal';
COMMENT ON COLUMN patients.current_medications IS 'Array de medicamentos actuales';
COMMENT ON COLUMN patients.primary_diagnosis IS 'Diagnóstico principal del paciente';
