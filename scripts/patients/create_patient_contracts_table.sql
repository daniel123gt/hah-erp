-- =====================================================
-- TABLA DE CONTRATOS DE PACIENTES
-- Basado en análisis de archivos Excel de Health At Home
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_contracts_patient ON patient_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON patient_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON patient_contracts(contract_number);

-- Trigger para updated_at
CREATE TRIGGER trg_patient_contracts_updated_at
  BEFORE UPDATE ON patient_contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE patient_contracts IS 'Contratos de servicios médicos domiciliarios para pacientes';
COMMENT ON COLUMN patient_contracts.responsible_family_member IS 'Nombre del familiar responsable del paciente';
COMMENT ON COLUMN patient_contracts.service_type IS 'Tipo de servicio contratado (24h, 8h, etc.)';
COMMENT ON COLUMN patient_contracts.monthly_amount IS 'Monto mensual del contrato en soles';
COMMENT ON COLUMN patient_contracts.payment_method IS 'Método de pago preferido del cliente';
