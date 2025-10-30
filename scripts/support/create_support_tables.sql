-- =====================================================
-- TABLAS DE SOPORTE PARA HEALTH AT HOME
-- Distritos y tipos de servicios
-- =====================================================

-- 1. TABLA DE DISTRITOS DE COBERTURA
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  zone TEXT, -- Norte, Sur, Este, Oeste, Centro
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar distritos identificados en los archivos Excel
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

-- 2. TABLA DE TIPOS DE SERVICIOS
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de servicios identificados en los archivos Excel
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
CREATE INDEX IF NOT EXISTS idx_districts_zone ON districts(zone);
CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_duration ON service_types(duration_hours);

-- Comentarios para documentar las tablas
COMMENT ON TABLE districts IS 'Distritos de Lima donde Health At Home presta servicios';
COMMENT ON TABLE service_types IS 'Tipos de servicios médicos disponibles con sus tarifas';
COMMENT ON COLUMN districts.zone IS 'Zona geográfica de Lima (Norte, Sur, Centro, Este, Oeste)';
COMMENT ON COLUMN service_types.base_rate IS 'Tarifa base del servicio en soles peruanos';
