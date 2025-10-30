-- =====================================================
-- SCRIPT COMPLETO PARA MÓDULO DE LABORATORIO
-- Ejecutar este script en Supabase para crear la tabla
-- =====================================================

-- 1. Crear tabla de exámenes de laboratorio
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

-- 2. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_codigo ON laboratory_exams(codigo);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_nombre ON laboratory_exams USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_categoria ON laboratory_exams(categoria);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_created_at ON laboratory_exams(created_at);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_laboratory_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_laboratory_exams_updated_at ON laboratory_exams;
CREATE TRIGGER trigger_update_laboratory_exams_updated_at
    BEFORE UPDATE ON laboratory_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_laboratory_exams_updated_at();

-- 5. Insertar datos de ejemplo
INSERT INTO laboratory_exams (codigo, nombre, precio, categoria, descripcion, tiempo_resultado, preparacion) VALUES
('2592', '11 DESOXI CORTICOSTERONA SUERO', 'S/ 150.00', 'Endocrinología', 'Determinación de 11-desoxicorticosterona en suero', '24 horas', 'Ayuno de 8 horas'),
('4502', '11 DESOXICORTISOL (60'') SUERO', 'S/ 68.00', 'Endocrinología', 'Determinación de 11-desoxicortisol en suero', '24 horas', 'Ayuno de 8 horas'),
('4501', '11 DESOXICORTISOL ESTIMULACION (3¦ Muestra) SUERO', 'S/ 68.00', 'Endocrinología', 'Determinación de 11-desoxicortisol con estimulación', '24 horas', 'Ayuno de 8 horas'),
('4504', '11-Desoxicortisol (120'') suero', 'S/ 68.00', 'Endocrinología', 'Determinación de 11-desoxicortisol en suero', '24 horas', 'Ayuno de 8 horas'),
('4503', '11-Desoxicortisol (180'') suero', 'S/ 68.00', 'Endocrinología', 'Determinación de 11-desoxicortisol en suero', '24 horas', 'Ayuno de 8 horas'),
('1001', 'ACETAMINOFEN SUERO', 'S/ 100.01', 'Toxicología', 'Determinación de acetaminofén en suero', '4 horas', 'Sin preparación especial'),
('2001', 'ACIDO FOLICO SUERO', 'S/ 54.00', 'Bioquímica', 'Determinación de ácido fólico en suero', '24 horas', 'Ayuno de 8 horas'),
('2002', 'ACIDO URICO SUERO', 'S/ 54.00', 'Bioquímica', 'Determinación de ácido úrico en suero', '4 horas', 'Ayuno de 8 horas'),
('3001', 'ALBUMINA SUERO', 'S/ 45.00', 'Bioquímica', 'Determinación de albúmina en suero', '4 horas', 'Ayuno de 8 horas'),
('4001', 'AMILASA SUERO', 'S/ 65.00', 'Bioquímica', 'Determinación de amilasa en suero', '4 horas', 'Ayuno de 8 horas'),
('6001', 'BILIRRUBINA TOTAL SUERO', 'S/ 55.00', 'Bioquímica', 'Determinación de bilirrubina total en suero', '4 horas', 'Ayuno de 8 horas'),
('7001', 'CALCIO SUERO', 'S/ 50.00', 'Bioquímica', 'Determinación de calcio en suero', '4 horas', 'Ayuno de 8 horas'),
('8001', 'COLESTEROL TOTAL SUERO', 'S/ 60.00', 'Bioquímica', 'Determinación de colesterol total en suero', '4 horas', 'Ayuno de 12 horas'),
('9001', 'CREATININA SUERO', 'S/ 45.00', 'Bioquímica', 'Determinación de creatinina en suero', '4 horas', 'Sin preparación especial'),
('11001', 'GLUCOSA SUERO', 'S/ 40.00', 'Bioquímica', 'Determinación de glucosa en suero', '4 horas', 'Ayuno de 8 horas'),
('14001', 'LIPIDOGRAMA COMPLETO', 'S/ 120.00', 'Bioquímica', 'Perfil lipídico completo', '4 horas', 'Ayuno de 12 horas'),
('17001', 'TRIGLICERIDOS SUERO', 'S/ 55.00', 'Bioquímica', 'Determinación de triglicéridos en suero', '4 horas', 'Ayuno de 12 horas'),
('18001', 'UREA SUERO', 'S/ 45.00', 'Bioquímica', 'Determinación de urea en suero', '4 horas', 'Sin preparación especial'),
('19001', 'VITAMINA B12 SUERO', 'S/ 110.00', 'Bioquímica', 'Determinación de vitamina B12 en suero', '24 horas', 'Sin preparación especial'),
('20001', 'VITAMINA D SUERO', 'S/ 130.00', 'Bioquímica', 'Determinación de vitamina D en suero', '24 horas', 'Sin preparación especial'),
('22001', 'PERFIL HEPATICO COMPLETO', 'S/ 95.00', 'Bioquímica', 'Perfil hepático completo', '4 horas', 'Ayuno de 8 horas'),
('23001', 'PERFIL RENAL COMPLETO', 'S/ 75.00', 'Bioquímica', 'Perfil renal completo', '4 horas', 'Sin preparación especial'),
('3002', 'ALDOSTERONA SUERO', 'S/ 120.00', 'Endocrinología', 'Determinación de aldosterona en suero', '24 horas', 'Ayuno de 8 horas'),
('13001', 'INSULINA SUERO', 'S/ 95.00', 'Endocrinología', 'Determinación de insulina en suero', '24 horas', 'Ayuno de 8 horas'),
('16001', 'TIROXINA LIBRE (T4)', 'S/ 80.00', 'Endocrinología', 'Determinación de tiroxina libre', '24 horas', 'Sin preparación especial'),
('5001', 'ANTICUERPOS ANTI-TPO', 'S/ 180.00', 'Inmunología', 'Determinación de anticuerpos anti-TPO', '24 horas', 'Sin preparación especial'),
('15001', 'PROTEINA C REACTIVA', 'S/ 70.00', 'Inmunología', 'Determinación de proteína C reactiva', '4 horas', 'Sin preparación especial'),
('10001', 'FERRITINA SUERO', 'S/ 85.00', 'Hematología', 'Determinación de ferritina en suero', '24 horas', 'Sin preparación especial'),
('12001', 'HEMOGLOBINA GLICOSILADA', 'S/ 90.00', 'Hematología', 'Determinación de hemoglobina glicosilada', '24 horas', 'Sin preparación especial'),
('21001', 'HEMOGRAMA COMPLETO', 'S/ 35.00', 'Hematología', 'Hemograma completo con diferencial', '4 horas', 'Sin preparación especial'),
('24001', 'CULTIVO DE ORINA', 'S/ 85.00', 'Microbiología', 'Cultivo de orina con antibiograma', '48 horas', 'Recolección de primera orina de la mañana'),
('25001', 'EXAMEN GENERAL DE ORINA', 'S/ 25.00', 'Urología', 'Examen general de orina', '4 horas', 'Sin preparación especial'),
('26001', 'COPROPARASITARIO', 'S/ 30.00', 'Parasitología', 'Examen coproparasitario', '24 horas', 'Sin preparación especial'),
('27001', 'HELICOBACTER PYLORI', 'S/ 95.00', 'Microbiología', 'Determinación de Helicobacter pylori', '24 horas', 'Ayuno de 8 horas'),
('28001', 'PSA TOTAL', 'S/ 75.00', 'Urología', 'Antígeno prostático específico total', '24 horas', 'Sin preparación especial'),
('29001', 'TSH', 'S/ 70.00', 'Endocrinología', 'Hormona estimulante del tiroides', '24 horas', 'Sin preparación especial'),
('30001', 'T3 LIBRE', 'S/ 85.00', 'Endocrinología', 'Triyodotironina libre', '24 horas', 'Sin preparación especial');

-- 6. Verificar que la tabla se creó correctamente
SELECT 
    'Tabla laboratory_exams creada exitosamente' as status,
    COUNT(*) as total_exams,
    COUNT(DISTINCT categoria) as total_categories
FROM laboratory_exams;

-- 7. Mostrar resumen por categoría
SELECT 
    categoria,
    COUNT(*) as cantidad_examenes,
    MIN(precio) as precio_minimo,
    MAX(precio) as precio_maximo
FROM laboratory_exams 
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY cantidad_examenes DESC;
