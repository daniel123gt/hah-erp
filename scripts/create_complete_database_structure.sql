-- =====================================================
-- ESTRUCTURA DE BASE DE DATOS PARA HEALTH AT HOME ERP
-- Basada en análisis real de archivos Excel
-- =====================================================

-- 1. TABLA DE PACIENTES (actualizada con campos reales)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('M', 'F')),
  address TEXT,
  district TEXT NOT NULL, -- SAN BORJAS, JESÚS MARÍA, etc.
  blood_type TEXT,
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  primary_physician TEXT,
  current_medications TEXT[],
  primary_diagnosis TEXT,
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CONTRATOS DE PACIENTES
CREATE TABLE IF NOT EXISTS patient_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  contract_date DATE NOT NULL,
  responsible_family_member TEXT NOT NULL, -- Familiar encargado
  service_type TEXT NOT NULL, -- 'Enfermería 24h', 'Cuidados 8h', etc.
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME, -- Hora de inicio (ej: 7:00 AM)
  monthly_amount DECIMAL(10,2) NOT NULL, -- Monto mensual (ej: 5000)
  hourly_rate DECIMAL(10,2),
  payment_method TEXT, -- TRANSFERENCIA, YAPE, PLIN
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido', 'Finalizado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PAGOS DE PACIENTES
CREATE TABLE IF NOT EXISTS patient_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES patient_contracts(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL, -- Número de pago (1, 2, 3...)
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL, -- Monto base (ej: 2500)
  holiday_dates TEXT, -- Fechas feriadas
  holiday_amount DECIMAL(10,2) DEFAULT 0, -- Monto por feriados
  service_pauses INTEGER DEFAULT 0, -- Pausas del servicio
  pause_amount DECIMAL(10,2) DEFAULT 0, -- Monto por pausas
  total_amount DECIMAL(10,2) NOT NULL, -- Monto total
  payment_method TEXT, -- TRANSFERENCIA, YAPE, PLIN
  operation_number TEXT, -- Número de operación
  invoice_number TEXT, -- Factura/Boleta (ej: EB01-87)
  status TEXT DEFAULT 'Pagado' CHECK (status IN ('Pagado', 'Pendiente', 'Vencido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE SERVICIOS EVENTUALES (Turnos eventuales)
CREATE TABLE IF NOT EXISTS eventual_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  patient_name TEXT NOT NULL,
  responsible_family_member TEXT NOT NULL,
  district TEXT NOT NULL,
  service_type TEXT NOT NULL, -- '24 HORAS', '8 HORAS'
  daily_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- TRANSFERENCIA, YAPE, PLIN
  operation_number TEXT,
  assigned_nurse TEXT NOT NULL,
  nurse_payment DECIMAL(10,2) NOT NULL,
  extra_expenses DECIMAL(10,2) DEFAULT 0,
  observations TEXT,
  profit DECIMAL(10,2), -- Utilidad para la empresa
  status TEXT DEFAULT 'Completado' CHECK (status IN ('Programado', 'En Progreso', 'Completado', 'Cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE ENFERMERAS/PERSONAL MÉDICO (actualizada)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('M', 'F')),
  address TEXT,
  position TEXT NOT NULL, -- 'Enfermera', 'Técnico en Enfermería', 'Cuidadora'
  department TEXT DEFAULT 'Enfermería',
  salary DECIMAL(10,2),
  hourly_rate DECIMAL(10,2), -- Tarifa por hora
  hire_date DATE,
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
  emergency_contact TEXT,
  emergency_phone TEXT,
  qualifications TEXT[],
  certifications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE DISTRITOS DE COBERTURA
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  zone TEXT, -- Norte, Sur, Este, Oeste, Centro
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar distritos identificados
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

-- 7. TABLA DE TIPOS DE SERVICIOS
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de servicios identificados
INSERT INTO service_types (name, description, duration_hours, base_rate) VALUES
('24 HORAS', 'Servicio de enfermería 24 horas', 24, 2500.00),
('8 HORAS', 'Servicio de enfermería 8 horas', 8, 100.00),
('12 HORAS', 'Servicio de enfermería 12 horas', 12, 150.00),
('PROCEDIMIENTO', 'Procedimiento médico específico', 1, 50.00),
('LABORATORIO', 'Toma de muestras de laboratorio', 1, 30.00),
('RX', 'Servicio de rayos X portátil', 1, 80.00),
('ECOGRAFÍA', 'Servicio de ecografía portátil', 1, 120.00)
ON CONFLICT (name) DO NOTHING;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_contracts_patient ON patient_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON patient_contracts(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON patient_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON patient_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_eventual_services_date ON eventual_services(service_date);
CREATE INDEX IF NOT EXISTS idx_eventual_services_district ON eventual_services(district);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('patients', 'patient_contracts', 'patient_payments', 'eventual_services', 'staff')
    LOOP
        EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
    END LOOP;
END $$;
