-- =====================================================
-- TABLA DE SERVICIOS EVENTUALES
-- Basado en análisis de archivos Excel de Health At Home
-- =====================================================

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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_eventual_services_date ON eventual_services(service_date);
CREATE INDEX IF NOT EXISTS idx_eventual_services_district ON eventual_services(district);
CREATE INDEX IF NOT EXISTS idx_eventual_services_nurse ON eventual_services(assigned_nurse);
CREATE INDEX IF NOT EXISTS idx_eventual_services_status ON eventual_services(status);

-- Trigger para updated_at
CREATE TRIGGER trg_eventual_services_updated_at
  BEFORE UPDATE ON eventual_services
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE eventual_services IS 'Registro de servicios eventuales (turnos no contratados)';
COMMENT ON COLUMN eventual_services.patient_name IS 'Nombre del paciente que recibe el servicio';
COMMENT ON COLUMN eventual_services.responsible_family_member IS 'Familiar responsable del pago';
COMMENT ON COLUMN eventual_services.daily_amount IS 'Monto cobrado por el servicio';
COMMENT ON COLUMN eventual_services.assigned_nurse IS 'Nombre de la enfermera asignada';
COMMENT ON COLUMN eventual_services.nurse_payment IS 'Monto pagado a la enfermera';
COMMENT ON COLUMN eventual_services.profit IS 'Utilidad obtenida por la empresa';
