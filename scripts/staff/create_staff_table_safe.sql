-- Script seguro para crear la tabla staff desde cero
-- Sin operaciones DROP que causen advertencias en Supabase

-- 1. Crear la tabla staff con estructura simple y funcional
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('M', 'F')),
  address TEXT,
  position TEXT NOT NULL,
  department TEXT,
  salary DECIMAL(10,2),
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
  emergency_contact TEXT,
  emergency_phone TEXT,
  qualifications TEXT[],
  certifications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_gender ON staff(gender);
CREATE INDEX IF NOT EXISTS idx_staff_hire_date ON staff(hire_date);
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON staff(created_at);

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
        WHERE tgname = 'update_staff_updated_at'
    ) THEN
        CREATE TRIGGER update_staff_updated_at
            BEFORE UPDATE ON staff
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Insertar datos de prueba
INSERT INTO staff (
  name, email, phone, age, gender, address, position, department, 
  salary, hire_date, status, emergency_contact, emergency_phone,
  qualifications, certifications
) VALUES 
-- Médicos
('Dr. María González', 'maria.gonzalez@hospital.com', '+51987654321', 35, 'F', 'Av. Principal 123, Lima', 'Médico General', 'Medicina General', 4500.00, '2023-01-15', 'Activo', 'Carlos González', '+51987654322', ARRAY['Medicina General', 'Cardiología'], ARRAY['Certificación Médica', 'ACLS']),

('Dr. Carlos Mendoza', 'carlos.mendoza@hospital.com', '+51987654323', 42, 'M', 'Jr. Los Olivos 456, Lima', 'Cardiólogo', 'Cardiología', 6500.00, '2022-08-20', 'Activo', 'Ana Mendoza', '+51987654324', ARRAY['Cardiología', 'Medicina Interna'], ARRAY['Certificación Cardiológica', 'BLS']),

('Dra. Ana Rodríguez', 'ana.rodriguez@hospital.com', '+51987654325', 38, 'F', 'Av. San Martín 789, Lima', 'Pediatra', 'Pediatría', 5200.00, '2023-03-10', 'Activo', 'Miguel Rodríguez', '+51987654326', ARRAY['Pediatría', 'Neonatología'], ARRAY['Certificación Pediátrica', 'PALS']),

-- Enfermeras
('Lic. Rosa Flores', 'rosa.flores@hospital.com', '+51987654327', 29, 'F', 'Calle Las Flores 321, Lima', 'Enfermera Jefe', 'Enfermería', 2800.00, '2023-05-15', 'Activo', 'José Flores', '+51987654328', ARRAY['Enfermería General', 'Cuidados Intensivos'], ARRAY['Licencia de Enfermería', 'ACLS']),

('Lic. Pedro Sánchez', 'pedro.sanchez@hospital.com', '+51987654329', 33, 'M', 'Av. Universitaria 654, Lima', 'Enfermero', 'Enfermería', 2500.00, '2023-07-20', 'Activo', 'Carmen Sánchez', '+51987654330', ARRAY['Enfermería General', 'Emergencias'], ARRAY['Licencia de Enfermería', 'BLS']),

('Lic. Carmen Torres', 'carmen.torres@hospital.com', '+51987654331', 31, 'F', 'Jr. La Paz 987, Lima', 'Enfermera', 'Enfermería', 2400.00, '2023-09-12', 'Activo', 'Luis Torres', '+51987654332', ARRAY['Enfermería General', 'Quirófano'], ARRAY['Licencia de Enfermería', 'ACLS']),

-- Personal Administrativo
('Sra. Elena Vargas', 'elena.vargas@hospital.com', '+51987654333', 45, 'F', 'Av. Brasil 147, Lima', 'Administradora', 'Administración', 3200.00, '2022-11-05', 'Activo', 'Roberto Vargas', '+51987654334', ARRAY['Administración Hospitalaria', 'Gestión de Recursos'], ARRAY['Certificación Administrativa']),

('Sr. Luis Herrera', 'luis.herrera@hospital.com', '+51987654335', 40, 'M', 'Calle Los Pinos 258, Lima', 'Contador', 'Contabilidad', 3000.00, '2023-02-18', 'Activo', 'Patricia Herrera', '+51987654336', ARRAY['Contabilidad', 'Finanzas'], ARRAY['Certificación Contable', 'CPA']),

('Sra. Patricia Morales', 'patricia.morales@hospital.com', '+51987654337', 36, 'F', 'Av. Arequipa 369, Lima', 'Secretaria Ejecutiva', 'Administración', 2200.00, '2023-06-25', 'Activo', 'Carlos Morales', '+51987654338', ARRAY['Secretariado', 'Atención al Cliente'], ARRAY['Certificación Secretarial']),

-- Personal Técnico
('Tec. Miguel Rojas', 'miguel.rojas@hospital.com', '+51987654339', 28, 'M', 'Jr. San Juan 741, Lima', 'Técnico de Laboratorio', 'Laboratorio', 2000.00, '2023-08-30', 'Activo', 'Sandra Rojas', '+51987654340', ARRAY['Técnico de Laboratorio', 'Análisis Clínicos'], ARRAY['Certificación Técnica']),

('Tec. Sandra Jiménez', 'sandra.jimenez@hospital.com', '+51987654341', 26, 'F', 'Av. Tacna 852, Lima', 'Técnica de Radiología', 'Radiología', 2100.00, '2023-10-15', 'Activo', 'Fernando Jiménez', '+51987654342', ARRAY['Técnico de Radiología', 'Imagenología'], ARRAY['Certificación Radiológica']),

('Tec. Fernando Castro', 'fernando.castro@hospital.com', '+51987654343', 30, 'M', 'Calle Las Palmas 963, Lima', 'Técnico de Farmacia', 'Farmacia', 1900.00, '2023-12-01', 'Activo', 'Lucía Castro', '+51987654344', ARRAY['Técnico de Farmacia', 'Dispensación'], ARRAY['Certificación Farmacéutica']),

-- Personal de Limpieza y Mantenimiento
('Sr. José Ramírez', 'jose.ramirez@hospital.com', '+51987654345', 50, 'M', 'Av. Venezuela 174, Lima', 'Supervisor de Limpieza', 'Limpieza', 1500.00, '2022-12-10', 'Activo', 'María Ramírez', '+51987654346', ARRAY['Supervisión', 'Limpieza Hospitalaria'], ARRAY['Certificación de Limpieza']),

('Sra. María López', 'maria.lopez@hospital.com', '+51987654347', 48, 'F', 'Jr. Los Laureles 285, Lima', 'Personal de Limpieza', 'Limpieza', 1200.00, '2023-01-20', 'Activo', 'Antonio López', '+51987654348', ARRAY['Limpieza Hospitalaria'], ARRAY['Certificación de Limpieza']),

('Sr. Antonio Silva', 'antonio.silva@hospital.com', '+51987654349', 52, 'M', 'Calle Las Orquídeas 396, Lima', 'Técnico de Mantenimiento', 'Mantenimiento', 1800.00, '2022-09-15', 'Activo', 'Rosa Silva', '+51987654350', ARRAY['Mantenimiento Eléctrico', 'Mantenimiento General'], ARRAY['Certificación de Mantenimiento']);

-- 6. Verificar que los datos se insertaron correctamente
SELECT 
    COUNT(*) as total_staff,
    COUNT(CASE WHEN status = 'Activo' THEN 1 END) as active_staff,
    COUNT(CASE WHEN gender = 'M' THEN 1 END) as male_staff,
    COUNT(CASE WHEN gender = 'F' THEN 1 END) as female_staff
FROM staff;

-- 7. Mostrar resumen por departamento
SELECT 
    department,
    COUNT(*) as staff_count,
    AVG(salary) as avg_salary
FROM staff 
WHERE status = 'Activo'
GROUP BY department 
ORDER BY staff_count DESC;
