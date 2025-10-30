import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para parsear CSV correctamente (maneja comillas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Función para analizar un archivo de servicio contratado
function analyzeContractService(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      fileName: path.basename(filePath),
      type: 'contract_service',
      patientInfo: {},
      serviceInfo: {},
      payments: []
    };
    
    // Buscar información del paciente y servicio
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Información del paciente
      if (line.includes('PACIENTE:')) {
        const patientMatch = line.match(/PACIENTE:\s*([^F]+)/);
        if (patientMatch) {
          analysis.patientInfo.name = patientMatch[1].trim();
        }
        
        const familyMatch = line.match(/FAMILIAR ENCARGADO[:\s]*([^,]+)/);
        if (familyMatch) {
          analysis.patientInfo.familyMember = familyMatch[1].trim();
        }
      }
      
      // Información del servicio
      if (line.includes('FECHA INICIO PLAN MENSUAL')) {
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) {
          analysis.serviceInfo.startDate = dateMatch[1];
        }
        
        const amountMatch = line.match(/(\d+)/);
        if (amountMatch) {
          analysis.serviceInfo.monthlyAmount = amountMatch[1];
        }
      }
    }
    
    // Buscar la línea de encabezados de pagos
    let headerLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('FECHA DE PAGO C.') || lines[i].includes('ITEM')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex !== -1) {
      // Procesar líneas de pagos
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.includes('S/.')) {
          const paymentData = parsePaymentLine(line);
          if (paymentData) {
            analysis.payments.push(paymentData);
          }
        }
      }
    }
    
    return analysis;
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

// Función para parsear línea de pago
function parsePaymentLine(line) {
  const parts = parseCSVLine(line);
  if (parts.length < 10) return null;
  
  try {
    return {
      item: parts[0] || '',
      paymentDate: parts[1] || '',
      turn: parts[2] || '',
      paymentNumber: parts[3] || '',
      periodStart: parts[4] || '',
      periodEnd: parts[5] || '',
      baseAmount: parts[6] || '',
      holidayDates: parts[7] || '',
      holidayAmount: parts[8] || '',
      servicePauses: parts[9] || '',
      pauseAmount: parts[10] || '',
      totalAmount: parts[11] || '',
      paymentDateActual: parts[12] || '',
      paymentMethod: parts[13] || '',
      operationNumber: parts[14] || '',
      invoiceNumber: parts[15] || ''
    };
  } catch (error) {
    return null;
  }
}

// Función para analizar servicio eventual
function analyzeEventualService(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      fileName: path.basename(filePath),
      type: 'eventual_service',
      services: []
    };
    
    // Buscar la línea de encabezados
    let headerLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('ITEM') && lines[i].includes('FECHA')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex !== -1) {
      // Procesar líneas de servicios
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.includes('S/.')) {
          const serviceData = parseEventualServiceLine(line);
          if (serviceData) {
            analysis.services.push(serviceData);
          }
        }
      }
    }
    
    return analysis;
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

// Función para parsear línea de servicio eventual
function parseEventualServiceLine(line) {
  const parts = parseCSVLine(line);
  if (parts.length < 10) return null;
  
  try {
    return {
      item: parts[0] || '',
      date: parts[1] || '',
      startTime: parts[2] || '',
      familyMember: parts[4] || '',
      district: parts[5] || '',
      turn: parts[6] || '',
      paymentMethod: parts[8] || '',
      operationNumber: parts[9] || '',
      nurse: parts[10] || '',
      nursePayment: parts[11] || '',
      extraExpenses: parts[12] || '',
      observations: parts[13] || '',
      profit: parts[14] || ''
    };
  } catch (error) {
    return null;
  }
}

// Función principal
function analyzeAllServices() {
  const csvDir = path.join(__dirname, 'csv_output');
  const files = fs.readdirSync(csvDir);
  
  const results = {
    contractServices: [],
    eventualServices: [],
    summary: {
      totalFiles: 0,
      contractFiles: 0,
      eventualFiles: 0,
      totalPayments: 0,
      totalEventualServices: 0
    }
  };
  
  console.log('🔍 Analizando archivos de servicios con parsing mejorado...\n');
  
  files.forEach(file => {
    if (file.endsWith('.csv') && !file.includes('analysis')) {
      const filePath = path.join(csvDir, file);
      console.log(`📄 Analizando: ${file}`);
      
      // Determinar tipo de archivo
      if (file.includes('EVENTUALES') || file.includes('eventual')) {
        const analysis = analyzeEventualService(filePath);
        if (analysis) {
          results.eventualServices.push(analysis);
          results.summary.eventualFiles++;
          results.summary.totalEventualServices += analysis.services.length;
          console.log(`  ✅ Servicio eventual - ${analysis.services.length} servicios`);
        }
      } else {
        const analysis = analyzeContractService(filePath);
        if (analysis) {
          results.contractServices.push(analysis);
          results.summary.contractFiles++;
          results.summary.totalPayments += analysis.payments.length;
          console.log(`  ✅ Servicio contratado - ${analysis.payments.length} pagos`);
        }
      }
      
      results.summary.totalFiles++;
    }
  });
  
  return results;
}

// Ejecutar análisis
const results = analyzeAllServices();

console.log('\n📊 RESUMEN DEL ANÁLISIS MEJORADO:');
console.log(`📁 Total de archivos analizados: ${results.summary.totalFiles}`);
console.log(`📋 Archivos de servicios contratados: ${results.summary.contractFiles}`);
console.log(`📋 Archivos de servicios eventuales: ${results.summary.eventualFiles}`);
console.log(`💰 Total de pagos encontrados: ${results.summary.totalPayments}`);
console.log(`🏥 Total de servicios eventuales: ${results.summary.totalEventualServices}`);

// Guardar resultados
const outputPath = path.join(__dirname, 'csv_output', 'service_analysis_improved.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\n💾 Resultados guardados en: ${outputPath}`);

// Mostrar ejemplos detallados
if (results.contractServices.length > 0) {
  console.log('\n📋 EJEMPLO DE SERVICIO CONTRATADO:');
  const example = results.contractServices[0];
  console.log(`Paciente: ${example.patientInfo.name}`);
  console.log(`Familiar: ${example.patientInfo.familyMember}`);
  console.log(`Fecha inicio: ${example.serviceInfo.startDate}`);
  console.log(`Monto mensual: ${example.serviceInfo.monthlyAmount}`);
  console.log(`Pagos registrados: ${example.payments.length}`);
  
  if (example.payments.length > 0) {
    console.log('\n💰 PRIMER PAGO:');
    const firstPayment = example.payments[0];
    console.log(`  Fecha: ${firstPayment.paymentDate}`);
    console.log(`  Período: ${firstPayment.periodStart} - ${firstPayment.periodEnd}`);
    console.log(`  Monto base: ${firstPayment.baseAmount}`);
    console.log(`  Monto total: ${firstPayment.totalAmount}`);
    console.log(`  Método: ${firstPayment.paymentMethod}`);
  }
}

if (results.eventualServices.length > 0) {
  console.log('\n🏥 EJEMPLO DE SERVICIO EVENTUAL:');
  const example = results.eventualServices[0];
  console.log(`Servicios registrados: ${example.services.length}`);
  
  if (example.services.length > 0) {
    console.log('\n🏥 PRIMER SERVICIO:');
    const firstService = example.services[0];
    console.log(`  Fecha: ${firstService.date}`);
    console.log(`  Hora: ${firstService.startTime}`);
    console.log(`  Distrito: ${firstService.district}`);
    console.log(`  Turno: ${firstService.turn}`);
    console.log(`  Enfermera: ${firstService.nurse}`);
    console.log(`  Pago enfermera: ${firstService.nursePayment}`);
  }
}
