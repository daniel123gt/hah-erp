import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para convertir Excel a CSV
function convertExcelToCSV(excelPath, outputDir) {
  try {
    console.log(`Procesando: ${excelPath}`);
    
    // Leer el archivo Excel
    const workbook = XLSX.readFile(excelPath);
    
    // Obtener el nombre del archivo sin extensión
    const fileName = path.basename(excelPath, path.extname(excelPath));
    
    // Procesar cada hoja
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a CSV
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      
      // Crear nombre de archivo CSV
      const csvFileName = workbook.SheetNames.length > 1 
        ? `${fileName}_${sheetName}.csv`
        : `${fileName}.csv`;
      
      const csvPath = path.join(outputDir, csvFileName);
      
      // Escribir archivo CSV
      fs.writeFileSync(csvPath, csvData, 'utf8');
      console.log(`  ✓ Convertido: ${csvFileName}`);
    });
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error procesando ${excelPath}:`, error.message);
    return false;
  }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath, outputDir) {
  const items = fs.readdirSync(dirPath);
  let totalProcessed = 0;
  let totalErrors = 0;
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Crear subdirectorio en output
      const subOutputDir = path.join(outputDir, item);
      if (!fs.existsSync(subOutputDir)) {
        fs.mkdirSync(subOutputDir, { recursive: true });
      }
      
      // Procesar subdirectorio recursivamente
      const result = processDirectory(itemPath, subOutputDir);
      totalProcessed += result.processed;
      totalErrors += result.errors;
    } else if (item.toLowerCase().endsWith('.xlsx') || item.toLowerCase().endsWith('.xls')) {
      // Convertir archivo Excel
      const success = convertExcelToCSV(itemPath, outputDir);
      if (success) {
        totalProcessed++;
      } else {
        totalErrors++;
      }
    }
  });
  
  return { processed: totalProcessed, errors: totalErrors };
}

// Directorio de entrada y salida
const inputDir = path.join(__dirname, '..', '..', 'DOCUMENTACION OFICIAL', 'DETALLES DE SERVICIO POR CLIENTE_');
const outputDir = path.join(__dirname, 'csv_output', 'detalles_servicio_cliente');

// Crear directorio de salida si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔄 Iniciando conversión de archivos Excel a CSV...');
console.log(`📁 Directorio de entrada: ${inputDir}`);
console.log(`📁 Directorio de salida: ${outputDir}`);
console.log('');

// Procesar directorio
const result = processDirectory(inputDir, outputDir);

console.log('');
console.log('📊 RESUMEN DE CONVERSIÓN:');
console.log(`✅ Archivos procesados exitosamente: ${result.processed}`);
console.log(`❌ Archivos con errores: ${result.errors}`);
console.log(`📁 Archivos CSV guardados en: ${outputDir}`);

// Crear archivo de resumen
const summaryPath = path.join(outputDir, 'conversion_summary.txt');
const summary = `RESUMEN DE CONVERSIÓN DE EXCEL A CSV
Fecha: ${new Date().toLocaleString()}
Directorio procesado: ${inputDir}
Archivos procesados exitosamente: ${result.processed}
Archivos con errores: ${result.errors}
Directorio de salida: ${outputDir}
`;

fs.writeFileSync(summaryPath, summary, 'utf8');
console.log(`📄 Resumen guardado en: ${summaryPath}`);
