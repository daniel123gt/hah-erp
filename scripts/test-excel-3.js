import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

console.log('🚀 Analizando archivo de registros mensuales...');

// Archivo de registros mensuales
const filePath = 'C:/Users/carlo/Downloads/DOCUMENTACION OFICIAL/REGISTRO DE SERVICIOS GENERALES 2025/CUIDADOS POR TURNO 2025/MARZO 2025/TURNO EVENTUALES MARZO 2025.xlsx';

try {
  console.log(`📊 Analizando: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado');
    process.exit(1);
  }
  
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log(`📋 Hojas encontradas: ${sheetNames.join(', ')}`);
  
  sheetNames.forEach((sheetName, index) => {
    console.log(`\n--- HOJA ${index + 1}: ${sheetName} ---`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      console.log('❌ Hoja vacía');
      return;
    }
    
    console.log(`📊 Filas de datos: ${jsonData.length}`);
    console.log(`📊 Columnas: ${jsonData[0] ? jsonData[0].length : 0}`);
    
    // Mostrar primeras 15 filas para entender la estructura
    console.log('\n📄 Primeras filas de datos:');
    jsonData.slice(0, 15).forEach((row, rowIndex) => {
      console.log(`Fila ${rowIndex + 1}:`, row);
    });
    
    // Convertir a CSV
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    const csvFileName = `${path.basename(filePath, '.xlsx')}_${sheetName}.csv`;
    const csvPath = path.join(process.cwd(), 'scripts', 'csv_output', csvFileName);
    
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
}
