-- =====================================================
-- SCRIPT COMPLETO PARA ACTUALIZAR BASE DE DATOS
-- Health At Home ERP - Ejecutar directamente en Supabase
-- =====================================================

-- 0. CREAR FUNCIÓN set_updated_at()
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. ACTUALIZAR TABLA PATIENTS
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS primary_physician TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT[],
ADD COLUMN IF NOT EXISTS primary_diagnosis TEXT;

-- Actualizar constraint de gender
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;
ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('M', 'F'));

-- Crear índice para district
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district);

-- 2. CREAR TABLA DE CONTRATOS
CREATE TABLE IF NOT EXISTS patient_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  contract_date DATE NOT NULL,
  responsible_family_member TEXT NOT NULL,
  service_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  monthly_amount DECIMAL(10,2) NOT NULL,
  hourly_rate DECIMAL(10,2),
  payment_method TEXT,
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido', 'Finalizado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_patient ON patient_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON patient_contracts(status);

CREATE TRIGGER trg_patient_contracts_updated_at
  BEFORE UPDATE ON patient_contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. CREAR TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS patient_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES patient_contracts(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  holiday_dates TEXT,
  holiday_amount DECIMAL(10,2) DEFAULT 0,
  service_pauses INTEGER DEFAULT 0,
  pause_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  operation_number TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'Pagado' CHECK (status IN ('Pagado', 'Pendiente', 'Vencido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON patient_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON patient_payments(payment_date);

CREATE TRIGGER trg_patient_payments_updated_at
  BEFORE UPDATE ON patient_payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. CREAR TABLA DE SERVICIOS EVENTUALES
CREATE TABLE IF NOT EXISTS eventual_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  patient_name TEXT NOT NULL,
  responsible_family_member TEXT NOT NULL,
  district TEXT NOT NULL,
  service_type TEXT NOT NULL,
  daily_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  operation_number TEXT,
  assigned_nurse TEXT NOT NULL,
  nurse_payment DECIMAL(10,2) NOT NULL,
  extra_expenses DECIMAL(10,2) DEFAULT 0,
  observations TEXT,
  profit DECIMAL(10,2),
  status TEXT DEFAULT 'Completado' CHECK (status IN ('Programado', 'En Progreso', 'Completado', 'Cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventual_services_date ON eventual_services(service_date);
CREATE INDEX IF NOT EXISTS idx_eventual_services_district ON eventual_services(district);

CREATE TRIGGER trg_eventual_services_updated_at
  BEFORE UPDATE ON eventual_services
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 5. CREAR TABLAS DE SOPORTE
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  zone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos de distritos
INSERT INTO districts (name, zone) VALUES
('SAN BORJAS', 'Sur'),
('JESÚS MARÍA', 'Centro'),
('SURCO', 'Sur'),
('MIRAFLORES', 'Sur'),
('SAN ISIDRO', 'Centro'),
('LINCE', 'Centro'),
('SAN MIGUEL', 'Norte'),
('BARRANCO', 'Sur'),
('CALLAO', 'Oeste'),
('INDEPENDENCIA', 'Norte'),
('CERCADO DE LIMA', 'Centro'),
('VENTANILLA', 'Norte'),
('PUNTA HERMOSA', 'Sur'),
('SALAMANCA', 'Norte')
ON CONFLICT (name) DO NOTHING;

-- Insertar tipos de servicios
INSERT INTO service_types (name, description, duration_hours, base_rate) VALUES
('24 HORAS', 'Servicio de enfermería 24 horas', 24, 2500.00),
('8 HORAS', 'Servicio de enfermería 8 horas', 8, 100.00),
('12 HORAS', 'Servicio de enfermería 12 horas', 12, 150.00),
('PROCEDIMIENTO', 'Procedimiento médico específico', 1, 50.00),
('LABORATORIO', 'Toma de muestras de laboratorio', 1, 30.00),
('RX', 'Servicio de rayos X portátil', 1, 80.00),
('ECOGRAFÍA', 'Servicio de ecografía portátil', 1, 120.00)
ON CONFLICT (name) DO NOTHING;

-- Verificar estructura final
SELECT 'Tablas creadas exitosamente' as resultado;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'patients', 'staff', 'patient_history', 'patient_contracts', 
  'patient_payments', 'eventual_services', 'districts', 'service_types'
) ORDER BY tablename;
