import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para convertir Excel a CSV y analizar contenido
function analyzeExcelFile(filePath) {
  try {
    console.log(`\n📊 Analizando archivo: ${path.basename(filePath)}`);
    
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    
    // Obtener nombres de las hojas
    const sheetNames = workbook.SheetNames;
    console.log(`📋 Hojas encontradas: ${sheetNames.join(', ')}`);
    
    // Analizar cada hoja
    sheetNames.forEach((sheetName, index) => {
      console.log(`\n--- HOJA ${index + 1}: ${sheetName} ---`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON para análisis
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        console.log('❌ Hoja vacía');
        return;
      }
      
      // Mostrar primeras filas para entender la estructura
      console.log(`📊 Filas de datos: ${jsonData.length}`);
      console.log(`📊 Columnas: ${jsonData[0] ? jsonData[0].length : 0}`);
      
      // Mostrar encabezados (primera fila)
      if (jsonData[0]) {
        console.log('📋 Encabezados:');
        jsonData[0].forEach((header, colIndex) => {
          if (header) {
            console.log(`   ${colIndex + 1}. ${header}`);
          }
        });
      }
      
      // Mostrar primeras 3 filas de datos
      console.log('\n📄 Primeras filas de datos:');
      jsonData.slice(0, 3).forEach((row, rowIndex) => {
        console.log(`Fila ${rowIndex + 1}:`, row);
      });
      
      // Convertir a CSV y guardar
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const csvFileName = `${path.basename(filePath, '.xlsx')}_${sheetName}.csv`;
      const csvPath = path.join(__dirname, 'csv_output', csvFileName);
      
      // Crear directorio si no existe
      const csvDir = path.join(__dirname, 'csv_output');
      if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
      }
      
      fs.writeFileSync(csvPath, csvData);
      console.log(`💾 CSV guardado: ${csvPath}`);
    });
    
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error.message);
  }
}

// Función para analizar múltiples archivos
function analyzeMultipleFiles(directoryPath) {
  console.log(`🔍 Analizando directorio: ${directoryPath}`);
  
  try {
    const files = fs.readdirSync(directoryPath);
    const excelFiles = files.filter(file => 
      file.toLowerCase().endsWith('.xlsx') || file.toLowerCase().endsWith('.xls')
    );
    
    console.log(`📁 Archivos Excel encontrados: ${excelFiles.length}`);
    
    excelFiles.forEach(file => {
      const fullPath = path.join(directoryPath, file);
      analyzeExcelFile(fullPath);
    });
    
  } catch (error) {
    console.error(`❌ Error al leer directorio:`, error.message);
  }
}

// Función principal
function main() {
  console.log('🚀 Iniciando análisis de archivos Excel...');
  
  // Analizar archivos específicos de pacientes
  const patientFiles = [
    'C:/Users/carlo/Downloads/DOCUMENTACION OFICIAL/DETALLES DE SERVICIO POR CLIENTE_/PCTE ARTURO ESPEJO SAN BORJAS/PCTE _ ARTURO ESPEJO  SAN (BORJA)_.xlsx',
    'C:/Users/carlo/Downloads/DOCUMENTACION OFICIAL/DETALLES DE SERVICIO POR CLIENTE_/PCTE GABRIELA BORDA,(SAN BORJAS NORTE)/PCTE_ GABRIELA BORDA (SAN BORJAS).xlsx',
    'C:/Users/carlo/Downloads/DOCUMENTACION OFICIAL/DETALLES DE SERVICIO POR CLIENTE_/PCTE DIEGO ASPIAZU P. LIBRE/PCTE DIEGO ASPIAZU.xlsx'
  ];
  
  patientFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      analyzeExcelFile(filePath);
    } else {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  });
  
  console.log('\n✅ Análisis completado!');
  console.log('📁 Los archivos CSV se guardaron en: scripts/csv_output/');
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeExcelFile, analyzeMultipleFiles };
