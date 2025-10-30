-- Script seguro para crear la tabla patients desde cero
-- Sin operaciones DROP que causen advertencias en Supabase

-- 1. Crear la tabla patients con estructura simple y funcional
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  address TEXT,
  last_visit DATE,
  status TEXT DEFAULT 'Activo',
  blood_type TEXT,
  allergies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
-- (Solo si no existe ya)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_patients_updated_at'
    ) THEN
        CREATE TRIGGER update_patients_updated_at
            BEFORE UPDATE ON patients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Insertar datos de prueba
INSERT INTO patients (
  name,
  email,
  phone,
  age,
  gender,
  address,
  last_visit,
  status,
  blood_type,
  allergies
) VALUES 
-- Paciente 1: María González
(
  'María González',
  'maria.gonzalez@email.com',
  '+51 987 654 321',
  39,
  'F',
  'Av. Principal 123, Dpto 4B, Lima',
  '2024-12-15',
  'Activo',
  'O+',
  ARRAY['Penicilina', 'Polen']
),

-- Paciente 2: Juan Pérez
(
  'Juan Pérez',
  'juan.perez@email.com',
  '+51 987 123 456',
  46,
  'M',
  'Jr. Los Olivos 456, Arequipa',
  '2024-12-10',
  'Activo',
  'A+',
  ARRAY['Sulfamidas']
),

-- Paciente 3: Carmen Rodríguez
(
  'Carmen Rodríguez',
  'carmen.rodriguez@email.com',
  '+51 987 789 012',
  32,
  'F',
  'Calle Las Flores 789, Cusco',
  '2024-12-08',
  'Activo',
  'B+',
  ARRAY['Ácaros', 'Humedad']
),

-- Paciente 4: Roberto Silva
(
  'Roberto Silva',
  'roberto.silva@email.com',
  '+51 987 345 678',
  59,
  'M',
  'Av. Universitaria 321, Trujillo',
  '2024-12-05',
  'Activo',
  'AB+',
  ARRAY['Mariscos']
),

-- Paciente 5: Ana Martínez
(
  'Ana Martínez',
  'ana.martinez@email.com',
  '+51 987 567 890',
  36,
  'F',
  'Jr. San Martín 654, Piura',
  '2024-12-12',
  'Activo',
  'O-',
  ARRAY['Lactosa']
),

-- Paciente 6: Carlos López
(
  'Carlos López',
  'carlos.lopez@email.com',
  '+51 987 234 567',
  51,
  'M',
  'Av. Grau 987, Chiclayo',
  '2024-12-07',
  'Activo',
  'A-',
  ARRAY['Antiinflamatorios']
),

-- Paciente 7: Lucía Fernández
(
  'Lucía Fernández',
  'lucia.fernandez@email.com',
  '+51 987 678 901',
  29,
  'F',
  'Calle Real 147, Huancayo',
  '2024-12-14',
  'Activo',
  'B-',
  ARRAY['Chocolate', 'Cafeína']
),

-- Paciente 8: Miguel Torres
(
  'Miguel Torres',
  'miguel.torres@email.com',
  '+51 987 456 789',
  44,
  'M',
  'Jr. Bolognesi 258, Iquitos',
  '2024-12-09',
  'Activo',
  'AB-',
  ARRAY['Alcohol']
),

-- Paciente 9: Elena Vargas
(
  'Elena Vargas',
  'elena.vargas@email.com',
  '+51 987 345 123',
  54,
  'F',
  'Av. Ejército 369, Tacna',
  '2024-12-11',
  'Activo',
  'O+',
  ARRAY['Yodo']
),

-- Paciente 10: Diego Morales
(
  'Diego Morales',
  'diego.morales@email.com',
  '+51 987 567 234',
  26,
  'M',
  'Calle Lima 741, Cajamarca',
  '2024-12-16',
  'Activo',
  'A+',
  ARRAY[]::text[]
),

-- Paciente 11: Sofía Herrera
(
  'Sofía Herrera',
  'sofia.herrera@email.com',
  '+51 987 789 345',
  31,
  'F',
  'Jr. Ayacucho 852, Puno',
  '2024-12-13',
  'Activo',
  'B+',
  ARRAY['Polen']
),

-- Paciente 12: Fernando Castro
(
  'Fernando Castro',
  'fernando.castro@email.com',
  '+51 987 123 567',
  49,
  'M',
  'Av. Tacna 963, Lima',
  '2024-12-06',
  'Activo',
  'O-',
  ARRAY['Humo de tabaco']
),

-- Paciente 13: Gabriela Ruiz
(
  'Gabriela Ruiz',
  'gabriela.ruiz@email.com',
  '+51 987 456 123',
  31,
  'F',
  'Calle San Juan 147, Ayacucho',
  '2024-12-17',
  'Activo',
  'A-',
  ARRAY[]::text[]
),

-- Paciente 14: Antonio Jiménez
(
  'Antonio Jiménez',
  'antonio.jimenez@email.com',
  '+51 987 678 234',
  56,
  'M',
  'Jr. Huánuco 258, Huánuco',
  '2024-12-04',
  'Activo',
  'AB+',
  ARRAY['Contraste yodado']
),

-- Paciente 15: Valeria Mendoza
(
  'Valeria Mendoza',
  'valeria.mendoza@email.com',
  '+51 987 345 456',
  28,
  'F',
  'Av. La Marina 369, Callao',
  '2024-12-18',
  'Activo',
  'B-',
  ARRAY[]::text[]
);

-- 6. Verificar que todo se creó correctamente
SELECT 
  'Tabla creada exitosamente' as status,
  COUNT(*) as total_pacientes,
  COUNT(CASE WHEN gender = 'M' THEN 1 END) as pacientes_masculinos,
  COUNT(CASE WHEN gender = 'F' THEN 1 END) as pacientes_femeninos,
  COUNT(CASE WHEN status = 'Activo' THEN 1 END) as pacientes_activos
FROM patients;
