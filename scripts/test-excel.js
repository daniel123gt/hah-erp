import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando análisis de archivos Excel...');

// Archivo específico para analizar
const filePath = 'C:/Users/carlo/Downloads/DOCUMENTACION OFICIAL/DETALLES DE SERVICIO POR CLIENTE_/PCTE ARTURO ESPEJO SAN BORJAS/PCTE _ ARTURO ESPEJO  SAN (BORJA)_.xlsx';

try {
  console.log(`📊 Analizando: ${path.basename(filePath)}`);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado');
    process.exit(1);
  }
  
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
    
    // Mostrar información básica
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
    
    // Mostrar primeras 5 filas de datos
    console.log('\n📄 Primeras filas de datos:');
    jsonData.slice(0, 5).forEach((row, rowIndex) => {
      console.log(`Fila ${rowIndex + 1}:`, row);
    });
    
    // Convertir a CSV y guardar
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    const csvFileName = `${path.basename(filePath, '.xlsx')}_${sheetName}.csv`;
    const csvPath = path.join(process.cwd(), 'scripts', 'csv_output', csvFileName);
    
    // Crear directorio si no existe
    const csvDir = path.join(process.cwd(), 'scripts', 'csv_output');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    
    fs.writeFileSync(csvPath, csvData);
    console.log(`💾 CSV guardado: ${csvPath}`);
  });
  
  console.log('\n✅ Análisis completado!');
  
} catch (error) {
  console.error(`❌ Error:`, error.message);
  console.error(error.stack);
}
