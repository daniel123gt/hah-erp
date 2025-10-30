import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para analizar un archivo CSV de detalles de servicio
function analyzeServiceFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      fileName: path.basename(filePath),
      type: 'unknown',
      patientInfo: {},
      serviceInfo: {},
      payments: [],
      eventualServices: []
    };
    
    // Buscar información del paciente
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar tipo de servicio
      if (line.includes('REGISTRO DE SERVICIOS DE CUIDADORAS POR TURNO')) {
        analysis.type = 'contract_service';
      } else if (line.includes('REGISTROS DE TURNOS EVENTUALES')) {
        analysis.type = 'eventual_service';
      }
      
      // Extraer información del paciente
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
      
      // Extraer información del servicio
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
      
      // Extraer pagos (para servicios contratados)
      if (analysis.type === 'contract_service' && line.includes('S/.')) {
        const paymentData = extractPaymentData(line);
        if (paymentData) {
          analysis.payments.push(paymentData);
        }
      }
      
      // Extraer servicios eventuales
      if (analysis.type === 'eventual_service' && line.includes('S/.')) {
        const serviceData = extractEventualServiceData(line);
        if (serviceData) {
          analysis.eventualServices.push(serviceData);
        }
      }
    }
    
    return analysis;
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

// Función para extraer datos de pago
function extractPaymentData(line) {
  const parts = line.split(',');
  if (parts.length < 15) return null;
  
  try {
    return {
      paymentDate: parts[1]?.trim(),
      turn: parts[2]?.trim(),
      paymentNumber: parts[3]?.trim(),
      periodStart: parts[4]?.trim(),
      periodEnd: parts[5]?.trim(),
      baseAmount: parts[6]?.trim(),
      holidayDates: parts[7]?.trim(),
      holidayAmount: parts[8]?.trim(),
      servicePauses: parts[9]?.trim(),
      pauseAmount: parts[10]?.trim(),
      totalAmount: parts[11]?.trim(),
      paymentDateActual: parts[12]?.trim(),
      paymentMethod: parts[13]?.trim(),
      operationNumber: parts[14]?.trim(),
      invoiceNumber: parts[15]?.trim()
    };
  } catch (error) {
    return null;
  }
}

// Función para extraer datos de servicio eventual
function extractEventualServiceData(line) {
  const parts = line.split(',');
  if (parts.length < 10) return null;
  
  try {
    return {
      item: parts[0]?.trim(),
      date: parts[1]?.trim(),
      startTime: parts[2]?.trim(),
      familyMember: parts[4]?.trim(),
      district: parts[5]?.trim(),
      turn: parts[6]?.trim(),
      paymentMethod: parts[8]?.trim(),
      operationNumber: parts[9]?.trim(),
      nurse: parts[10]?.trim(),
      nursePayment: parts[11]?.trim(),
      extraExpenses: parts[12]?.trim(),
      observations: parts[13]?.trim(),
      profit: parts[14]?.trim()
    };
  } catch (error) {
    return null;
  }
}

// Función principal
function analyzeAllServiceFiles() {
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
  
  console.log('🔍 Analizando archivos de detalles de servicio...\n');
  
  files.forEach(file => {
    if (file.endsWith('.csv')) {
      const filePath = path.join(csvDir, file);
      console.log(`📄 Analizando: ${file}`);
      
      const analysis = analyzeServiceFile(filePath);
      if (analysis) {
        results.summary.totalFiles++;
        
        if (analysis.type === 'contract_service') {
          results.contractServices.push(analysis);
          results.summary.contractFiles++;
          results.summary.totalPayments += analysis.payments.length;
          console.log(`  ✅ Servicio contratado - ${analysis.payments.length} pagos`);
        } else if (analysis.type === 'eventual_service') {
          results.eventualServices.push(analysis);
          results.summary.eventualFiles++;
          results.summary.totalEventualServices += analysis.eventualServices.length;
          console.log(`  ✅ Servicio eventual - ${analysis.eventualServices.length} servicios`);
        } else {
          console.log(`  ⚠️  Tipo desconocido`);
        }
      }
    }
  });
  
  return results;
}

// Ejecutar análisis
const results = analyzeAllServiceFiles();

console.log('\n📊 RESUMEN DEL ANÁLISIS:');
console.log(`📁 Total de archivos analizados: ${results.summary.totalFiles}`);
console.log(`📋 Archivos de servicios contratados: ${results.summary.contractFiles}`);
console.log(`📋 Archivos de servicios eventuales: ${results.summary.eventualFiles}`);
console.log(`💰 Total de pagos encontrados: ${results.summary.totalPayments}`);
console.log(`🏥 Total de servicios eventuales: ${results.summary.totalEventualServices}`);

// Guardar resultados en archivo JSON
const outputPath = path.join(__dirname, 'csv_output', 'service_analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\n💾 Resultados guardados en: ${outputPath}`);

// Mostrar algunos ejemplos
if (results.contractServices.length > 0) {
  console.log('\n📋 EJEMPLO DE SERVICIO CONTRATADO:');
  const example = results.contractServices[0];
  console.log(`Paciente: ${example.patientInfo.name}`);
  console.log(`Familiar: ${example.patientInfo.familyMember}`);
  console.log(`Fecha inicio: ${example.serviceInfo.startDate}`);
  console.log(`Monto mensual: ${example.serviceInfo.monthlyAmount}`);
  console.log(`Pagos registrados: ${example.payments.length}`);
}

if (results.eventualServices.length > 0) {
  console.log('\n🏥 EJEMPLO DE SERVICIO EVENTUAL:');
  const example = results.eventualServices[0];
  console.log(`Servicios registrados: ${example.eventualServices.length}`);
  if (example.eventualServices.length > 0) {
    const firstService = example.eventualServices[0];
    console.log(`Fecha: ${firstService.date}`);
    console.log(`Distrito: ${firstService.district}`);
    console.log(`Enfermera: ${firstService.nurse}`);
  }
}
