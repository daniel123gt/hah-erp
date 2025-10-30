import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para limpiar y formatear texto
function cleanText(text) {
  if (!text) return '';
  return text.replace(/['"]/g, '').trim();
}

// Función para convertir fecha
function convertDate(dateStr) {
  if (!dateStr) return null;
  
  // Formato: DD/MM/YYYY o D/M/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
}

// Función para extraer número de monto
function extractAmount(amountStr) {
  if (!amountStr) return 0;
  const match = amountStr.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

// Función para generar SQL de pacientes
function generatePatientsSQL(contractServices) {
  const patients = new Map();
  
  contractServices.forEach(service => {
    const patientName = cleanText(service.patientInfo.name);
    const familyMember = cleanText(service.patientInfo.familyMember);
    
    if (patientName && !patients.has(patientName)) {
      // Extraer distrito del nombre del archivo
      const district = service.fileName.includes('SAN BORJA') ? 'SAN BORJAS' :
                     service.fileName.includes('SURCO') ? 'SURCO' :
                     service.fileName.includes('JESUS MARIA') ? 'JESÚS MARÍA' :
                     service.fileName.includes('MIRAFLORES') ? 'MIRAFLORES' :
                     service.fileName.includes('SAN ISIDRO') ? 'SAN ISIDRO' :
                     'LIMA';
      
      patients.set(patientName, {
        name: patientName,
        district: district,
        emergency_contact_name: familyMember,
        status: 'Activo',
        created_at: new Date().toISOString()
      });
    }
  });
  
  return Array.from(patients.values());
}

// Función para generar SQL de contratos
function generateContractsSQL(contractServices) {
  const contracts = [];
  
  contractServices.forEach(service => {
    const patientName = cleanText(service.patientInfo.name);
    const familyMember = cleanText(service.patientInfo.familyMember);
    const startDate = convertDate(service.serviceInfo.startDate);
    const monthlyAmount = extractAmount(service.serviceInfo.monthlyAmount + '000'); // Asumir que es en miles
        
    if (patientName && startDate) {
      contracts.push({
        patient_name: patientName,
        contract_number: `CON-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        contract_date: startDate,
        responsible_family_member: familyMember,
        service_type: '24 HORAS',
        start_date: startDate,
        monthly_amount: monthlyAmount,
        payment_method: 'Transferencia',
        status: 'Activo'
      });
    }
  });
  
  return contracts;
}

// Función para generar SQL de pagos
function generatePaymentsSQL(contractServices) {
  const payments = [];
  
  contractServices.forEach(service => {
    const patientName = cleanText(service.patientInfo.name);
    
    service.payments.forEach((payment, index) => {
      const periodStart = convertDate(payment.periodStart);
      const periodEnd = convertDate(payment.periodEnd);
      const baseAmount = extractAmount(payment.baseAmount);
      const holidayAmount = extractAmount(payment.holidayAmount);
      const totalAmount = extractAmount(payment.totalAmount);
      const paymentDate = convertDate(payment.paymentDateActual);
      
      if (periodStart && periodEnd && baseAmount > 0) {
        payments.push({
          patient_name: patientName,
          payment_number: parseInt(payment.paymentNumber) || index + 1,
          payment_date: paymentDate || periodStart,
          period_start: periodStart,
          period_end: periodEnd,
          base_amount: baseAmount,
          holiday_dates: cleanText(payment.holidayDates),
          holiday_amount: holidayAmount,
          service_pauses: parseInt(payment.servicePauses) || 0,
          pause_amount: extractAmount(payment.pauseAmount),
          total_amount: totalAmount || baseAmount + holidayAmount,
          payment_method: cleanText(payment.paymentMethod),
          operation_number: cleanText(payment.operationNumber),
          invoice_number: cleanText(payment.invoiceNumber),
          status: 'Pagado'
        });
      }
    });
  });
  
  return payments;
}

// Función para generar SQL de servicios eventuales
function generateEventualServicesSQL(eventualServices) {
  const services = [];
  
  eventualServices.forEach(serviceFile => {
    serviceFile.services.forEach(service => {
      const serviceDate = convertDate(service.date);
      const startTime = service.startTime || '08:00';
      const familyMember = cleanText(service.familyMember);
      const district = cleanText(service.district);
      const turn = cleanText(service.turn);
      const dailyAmount = extractAmount(service.nursePayment) * 2; // Asumir que el pago de enfermera es la mitad
      const nursePayment = extractAmount(service.nursePayment);
      const extraExpenses = extractAmount(service.extraExpenses);
      const profit = dailyAmount - nursePayment - extraExpenses;
      
      if (serviceDate && familyMember && district) {
        services.push({
          service_date: serviceDate,
          start_time: startTime,
          patient_name: familyMember, // En servicios eventuales, el familiar es el "paciente"
          responsible_family_member: familyMember,
          district: district,
          service_type: turn,
          daily_amount: dailyAmount,
          payment_method: cleanText(service.paymentMethod),
          operation_number: cleanText(service.operationNumber),
          assigned_nurse: cleanText(service.nurse),
          nurse_payment: nursePayment,
          extra_expenses: extraExpenses,
          observations: cleanText(service.observations),
          profit: profit,
          status: 'Completado'
        });
      }
    });
  });
  
  return services;
}

// Función para generar archivo SQL
function generateSQLFile(patients, contracts, payments, eventualServices) {
  let sql = `-- =====================================================
-- DATOS REALES DE HEALTH AT HOME
-- Generado automáticamente desde archivos CSV
-- Fecha: ${new Date().toLocaleString()}
-- =====================================================

-- Limpiar datos de prueba
DELETE FROM patient_payments;
DELETE FROM patient_contracts;
DELETE FROM eventual_services;
DELETE FROM patients WHERE name LIKE '%Test%' OR name LIKE '%Prueba%';

-- Insertar pacientes reales
INSERT INTO patients (name, district, emergency_contact_name, status, created_at) VALUES
`;

  // Insertar pacientes
  patients.forEach((patient, index) => {
    const comma = index < patients.length - 1 ? ',' : ';';
    sql += `('${patient.name.replace(/'/g, "''")}', '${patient.district}', '${patient.emergency_contact_name.replace(/'/g, "''")}', '${patient.status}', '${patient.created_at}')${comma}\n`;
  });

  sql += `
-- Insertar contratos reales
INSERT INTO patient_contracts (patient_id, contract_number, contract_date, responsible_family_member, service_type, start_date, monthly_amount, payment_method, status, created_at) VALUES
`;

  // Insertar contratos (necesitamos los IDs de pacientes)
  contracts.forEach((contract, index) => {
    const comma = index < contracts.length - 1 ? ',' : ';';
    sql += `((SELECT id FROM patients WHERE name = '${contract.patient_name.replace(/'/g, "''")}'), '${contract.contract_number}', '${contract.contract_date}', '${contract.responsible_family_member.replace(/'/g, "''")}', '${contract.service_type}', '${contract.start_date}', ${contract.monthly_amount}, '${contract.payment_method}', '${contract.status}', NOW())${comma}\n`;
  });

  sql += `
-- Insertar pagos reales
INSERT INTO patient_payments (contract_id, payment_number, payment_date, period_start, period_end, base_amount, holiday_dates, holiday_amount, service_pauses, pause_amount, total_amount, payment_method, operation_number, invoice_number, status, created_at) VALUES
`;

  // Insertar pagos
  payments.forEach((payment, index) => {
    const comma = index < payments.length - 1 ? ',' : ';';
    const holidayDates = payment.holiday_dates ? `'${payment.holiday_dates.replace(/'/g, "''")}'` : 'NULL';
    const operationNumber = payment.operation_number ? `'${payment.operation_number.replace(/'/g, "''")}'` : 'NULL';
    const invoiceNumber = payment.invoice_number ? `'${payment.invoice_number.replace(/'/g, "''")}'` : 'NULL';
    
    sql += `((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = '${payment.patient_name.replace(/'/g, "''")}'), ${payment.payment_number}, '${payment.payment_date}', '${payment.period_start}', '${payment.period_end}', ${payment.base_amount}, ${holidayDates}, ${payment.holiday_amount}, ${payment.service_pauses}, ${payment.pause_amount}, ${payment.total_amount}, '${payment.payment_method}', ${operationNumber}, ${invoiceNumber}, '${payment.status}', NOW())${comma}\n`;
  });

  sql += `
-- Insertar servicios eventuales reales
INSERT INTO eventual_services (service_date, start_time, patient_name, responsible_family_member, district, service_type, daily_amount, payment_method, operation_number, assigned_nurse, nurse_payment, extra_expenses, observations, profit, status, created_at) VALUES
`;

  // Insertar servicios eventuales
  eventualServices.forEach((service, index) => {
    const comma = index < eventualServices.length - 1 ? ',' : ';';
    const operationNumber = service.operation_number ? `'${service.operation_number.replace(/'/g, "''")}'` : 'NULL';
    const observations = service.observations ? `'${service.observations.replace(/'/g, "''")}'` : 'NULL';
    
    sql += `('${service.service_date}', '${service.start_time}', '${service.patient_name.replace(/'/g, "''")}', '${service.responsible_family_member.replace(/'/g, "''")}', '${service.district}', '${service.service_type}', ${service.daily_amount}, '${service.payment_method}', ${operationNumber}, '${service.assigned_nurse.replace(/'/g, "''")}', ${service.nurse_payment}, ${service.extra_expenses}, ${observations}, ${service.profit}, '${service.status}', NOW())${comma}\n`;
  });

  sql += `
-- Verificar datos insertados
SELECT 'Pacientes insertados:' as tipo, COUNT(*) as cantidad FROM patients WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Contratos insertados:', COUNT(*) FROM patient_contracts WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Pagos insertados:', COUNT(*) FROM patient_payments WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Servicios eventuales insertados:', COUNT(*) FROM eventual_services WHERE created_at >= NOW() - INTERVAL '1 minute';
`;

  return sql;
}

// Función principal
function generateRealDataSQL() {
  try {
    // Leer archivo de análisis
    const analysisPath = path.join(__dirname, 'csv_output', 'service_analysis_improved.json');
    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    
    console.log('🔄 Generando datos SQL reales...\n');
    
    // Generar datos
    const patients = generatePatientsSQL(analysisData.contractServices);
    const contracts = generateContractsSQL(analysisData.contractServices);
    const payments = generatePaymentsSQL(analysisData.contractServices);
    const eventualServices = generateEventualServicesSQL(analysisData.eventualServices);
    
    console.log(`👥 Pacientes únicos: ${patients.length}`);
    console.log(`📋 Contratos: ${contracts.length}`);
    console.log(`💰 Pagos: ${payments.length}`);
    console.log(`🏥 Servicios eventuales: ${eventualServices.length}`);
    
    // Generar archivo SQL
    const sql = generateSQLFile(patients, contracts, payments, eventualServices);
    
    // Guardar archivo SQL
    const outputPath = path.join(__dirname, 'insert_real_data.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    
    console.log(`\n💾 Archivo SQL generado: ${outputPath}`);
    console.log(`📊 Total de registros a insertar: ${patients.length + contracts.length + payments.length + eventualServices.length}`);
    
    // Mostrar algunos ejemplos
    if (patients.length > 0) {
      console.log('\n👥 EJEMPLO DE PACIENTE:');
      console.log(`  Nombre: ${patients[0].name}`);
      console.log(`  Distrito: ${patients[0].district}`);
      console.log(`  Contacto emergencia: ${patients[0].emergency_contact_name}`);
    }
    
    if (payments.length > 0) {
      console.log('\n💰 EJEMPLO DE PAGO:');
      console.log(`  Período: ${payments[0].period_start} - ${payments[0].period_end}`);
      console.log(`  Monto base: S/. ${payments[0].base_amount}`);
      console.log(`  Monto total: S/. ${payments[0].total_amount}`);
    }
    
  } catch (error) {
    console.error('Error generando datos SQL:', error.message);
  }
}

// Ejecutar
generateRealDataSQL();
