-- =====================================================
-- TABLA DE PAGOS DE PACIENTES
-- Basado en análisis de archivos Excel de Health At Home
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES patient_contracts(id) ON DELETE CASCADE,
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payments_contract ON patient_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON patient_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON patient_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON patient_payments(invoice_number);

-- Trigger para updated_at
CREATE TRIGGER trg_patient_payments_updated_at
  BEFORE UPDATE ON patient_payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE patient_payments IS 'Registro de pagos de contratos de pacientes';
COMMENT ON COLUMN patient_payments.payment_number IS 'Número secuencial del pago (1, 2, 3...)';
COMMENT ON COLUMN patient_payments.base_amount IS 'Monto base del período sin ajustes';
COMMENT ON COLUMN patient_payments.holiday_amount IS 'Monto adicional por días feriados';
COMMENT ON COLUMN patient_payments.pause_amount IS 'Descuento por pausas del servicio';
COMMENT ON COLUMN patient_payments.operation_number IS 'Número de operación bancaria o transferencia';
COMMENT ON COLUMN patient_payments.invoice_number IS 'Número de factura o boleta emitida';
