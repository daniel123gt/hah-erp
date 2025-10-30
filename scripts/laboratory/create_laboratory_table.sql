-- =====================================================
-- CREAR TABLA DE EXÁMENES DE LABORATORIO
-- Script para crear la tabla antes de insertar los datos
-- =====================================================

-- Crear tabla de exámenes de laboratorio
CREATE TABLE IF NOT EXISTS laboratory_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    precio VARCHAR(20) NOT NULL,
    categoria VARCHAR(100),
    descripcion TEXT,
    tiempo_resultado VARCHAR(100),
    preparacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_codigo ON laboratory_exams(codigo);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_nombre ON laboratory_exams USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_categoria ON laboratory_exams(categoria);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_created_at ON laboratory_exams(created_at);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_laboratory_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_laboratory_exams_updated_at ON laboratory_exams;
CREATE TRIGGER trigger_update_laboratory_exams_updated_at
    BEFORE UPDATE ON laboratory_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_laboratory_exams_updated_at();

-- Comentarios sobre la tabla
COMMENT ON TABLE laboratory_exams IS 'Tabla para almacenar información de exámenes de laboratorio';
COMMENT ON COLUMN laboratory_exams.codigo IS 'Código único del examen';
COMMENT ON COLUMN laboratory_exams.nombre IS 'Nombre completo del examen';
COMMENT ON COLUMN laboratory_exams.precio IS 'Precio del examen en formato S/ 0.00';
COMMENT ON COLUMN laboratory_exams.categoria IS 'Categoría del examen (Hematología, Bioquímica, etc.)';
COMMENT ON COLUMN laboratory_exams.descripcion IS 'Descripción detallada del examen';
COMMENT ON COLUMN laboratory_exams.tiempo_resultado IS 'Tiempo estimado para obtener resultados';
COMMENT ON COLUMN laboratory_exams.preparacion IS 'Preparación requerida para el examen';

-- Verificar que la tabla se creó correctamente
SELECT 
    'Tabla laboratory_exams creada exitosamente' as status,
    'Lista para insertar datos' as next_step;
