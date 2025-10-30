import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para determinar la categoría basada en el nombre del examen
function determineCategory(nombre) {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('hemograma') || nombreLower.includes('hematocrito') || nombreLower.includes('hemoglobina') || nombreLower.includes('ferritina')) {
    return 'Hematología';
  }
  if (nombreLower.includes('glucosa') || nombreLower.includes('colesterol') || nombreLower.includes('trigliceridos') || nombreLower.includes('creatinina') || nombreLower.includes('urea') || nombreLower.includes('albumina') || nombreLower.includes('bilirrubina') || nombreLower.includes('calcio') || nombreLower.includes('acido urico') || nombreLower.includes('amilasa') || nombreLower.includes('lipido') || nombreLower.includes('vitamina')) {
    return 'Bioquímica';
  }
  if (nombreLower.includes('cultivo') || nombreLower.includes('bacteria') || nombreLower.includes('helicobacter') || nombreLower.includes('antibiograma')) {
    return 'Microbiología';
  }
  if (nombreLower.includes('anticuerpo') || nombreLower.includes('inmuno') || nombreLower.includes('proteina c reactiva') || nombreLower.includes('pcr')) {
    return 'Inmunología';
  }
  if (nombreLower.includes('tiroides') || nombreLower.includes('tsh') || nombreLower.includes('t3') || nombreLower.includes('t4') || nombreLower.includes('insulina') || nombreLower.includes('aldosterona') || nombreLower.includes('cortisol') || nombreLower.includes('desoxicortisol') || nombreLower.includes('corticosterona')) {
    return 'Endocrinología';
  }
  if (nombreLower.includes('toxicologia') || nombreLower.includes('acetaminofen') || nombreLower.includes('alcohol') || nombreLower.includes('drogas')) {
    return 'Toxicología';
  }
  if (nombreLower.includes('genetic') || nombreLower.includes('cromosoma') || nombreLower.includes('adn')) {
    return 'Genética';
  }
  if (nombreLower.includes('parasito') || nombreLower.includes('copro') || nombreLower.includes('protozoo')) {
    return 'Parasitología';
  }
  if (nombreLower.includes('orina') || nombreLower.includes('psa') || nombreLower.includes('urologia')) {
    return 'Urología';
  }
  
  return 'Otros';
}

// Función para determinar el tiempo de resultado
function determineTimeResult(nombre) {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('cultivo') || nombreLower.includes('bacteria')) {
    return '48-72 horas';
  }
  if (nombreLower.includes('hormona') || nombreLower.includes('tiroides') || nombreLower.includes('insulina') || nombreLower.includes('cortisol') || nombreLower.includes('aldosterona')) {
    return '24 horas';
  }
  if (nombreLower.includes('vitamina') || nombreLower.includes('acido folico') || nombreLower.includes('b12')) {
    return '24 horas';
  }
  
  return '4 horas';
}

// Función para determinar la preparación
function determinePreparation(nombre) {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('glucosa') || nombreLower.includes('colesterol') || nombreLower.includes('trigliceridos') || nombreLower.includes('lipido')) {
    return 'Ayuno de 12 horas';
  }
  if (nombreLower.includes('cortisol') || nombreLower.includes('aldosterona') || nombreLower.includes('hormona')) {
    return 'Ayuno de 8 horas';
  }
  if (nombreLower.includes('orina')) {
    return 'Primera orina de la mañana';
  }
  
  return 'Sin preparación especial';
}

async function generateLaboratorySQL() {
  try {
    console.log('📖 Leyendo archivo output.json...');
    
    // Leer el archivo JSON
    const jsonPath = path.join(__dirname, '..', '..', 'public', 'output.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const exams = JSON.parse(jsonData);
    
    console.log(`✅ Se encontraron ${exams.length} exámenes`);
    
    // Generar SQL
    let sql = `-- =====================================================
-- INSERCIÓN MASIVA DE EXÁMENES DE LABORATORIO
-- Generado automáticamente desde output.json
-- Total de exámenes: ${exams.length}
-- =====================================================

-- Limpiar datos existentes (opcional)
-- DELETE FROM laboratory_exams;

-- Insertar todos los exámenes
INSERT INTO laboratory_exams (codigo, nombre, precio, categoria, descripcion, tiempo_resultado, preparacion) VALUES
`;

    // Procesar cada examen
    const sqlValues = exams.map((exam, index) => {
      const categoria = determineCategory(exam.nombre);
      const tiempoResultado = determineTimeResult(exam.nombre);
      const preparacion = determinePreparation(exam.nombre);
      
      // Escapar comillas simples en el nombre
      const nombreEscapado = exam.nombre.replace(/'/g, "''");
      
      return `('${exam.codigo}', '${nombreEscapado}', '${exam.precio}', '${categoria}', 'Examen de laboratorio ${categoria.toLowerCase()}', '${tiempoResultado}', '${preparacion}')`;
    });
    
    sql += sqlValues.join(',\n');
    sql += `;

-- Verificar inserción
SELECT 
    'Inserción completada' as status,
    COUNT(*) as total_examenes,
    COUNT(DISTINCT categoria) as total_categorias
FROM laboratory_exams;

-- Mostrar resumen por categoría
SELECT 
    categoria,
    COUNT(*) as cantidad_examenes,
    MIN(precio) as precio_minimo,
    MAX(precio) as precio_maximo
FROM laboratory_exams 
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY cantidad_examenes DESC;`;

    // Guardar el archivo SQL
    const outputPath = path.join(__dirname, 'insert_all_laboratory_exams.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    
    console.log(`✅ SQL generado exitosamente: ${outputPath}`);
    console.log(`📊 Total de exámenes: ${exams.length}`);
    
    // Mostrar estadísticas por categoría
    const categoryStats = {};
    exams.forEach(exam => {
      const categoria = determineCategory(exam.nombre);
      categoryStats[categoria] = (categoryStats[categoria] || 0) + 1;
    });
    
    console.log('\n📈 Estadísticas por categoría:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([categoria, cantidad]) => {
        console.log(`   ${categoria}: ${cantidad} exámenes`);
      });
    
  } catch (error) {
    console.error('❌ Error al generar SQL:', error);
  }
}

// Ejecutar la función
generateLaboratorySQL();
