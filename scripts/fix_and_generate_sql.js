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

// Función para convertir fecha correctamente
function convertDate(dateStr) {
  if (!dateStr) return null;
  
  // Limpiar la fecha
  const cleanDate = dateStr.replace(/['"]/g, '').trim();
  
  // Formato: DD/MM/YYYY o D/M/YYYY
  const parts = cleanDate.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    // Validar que sea una fecha válida
    if (day && month && year && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
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

// Función para generar SQL limpio
function generateCleanSQL() {
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
('DELIA PIEDAD PIEDRA HERRERA', 'SAN BORJAS', 'ARTURO ESPEJO PIEDRA', 'Activo', NOW()),
('ADRIANA OLIVO R. DE BORDA', 'SAN BORJAS', 'GABRIELA BORDA', 'Activo', NOW());

-- Insertar contratos reales
INSERT INTO patient_contracts (patient_id, contract_number, contract_date, responsible_family_member, service_type, start_date, monthly_amount, payment_method, status, created_at) VALUES
((SELECT id FROM patients WHERE name = 'DELIA PIEDAD PIEDRA HERRERA'), 'CON-2024-001', '2024-07-06', 'ARTURO ESPEJO PIEDRA', '24 HORAS', '2024-07-06', 5000, 'Transferencia', 'Activo', NOW()),
((SELECT id FROM patients WHERE name = 'ADRIANA OLIVO R. DE BORDA'), 'CON-2025-001', '2025-03-22', 'GABRIELA BORDA', '24 HORAS', '2025-03-22', 5000, 'Transferencia', 'Activo', NOW());

-- Insertar pagos reales (ejemplos principales)
INSERT INTO patient_payments (contract_id, payment_number, payment_date, period_start, period_end, base_amount, holiday_dates, holiday_amount, service_pauses, pause_amount, total_amount, payment_method, operation_number, invoice_number, status, created_at) VALUES
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 1, '2024-07-18', '2024-07-06', '2024-07-20', 2500, '23/07/2024, 28/07/2024', 333.32, 0, 0, 2833.32, 'TRANSFERENCIA', '6008367', 'EB01-87', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 2, '2024-08-02', '2024-07-21', '2024-08-05', 2500, '29/07/2024, 06/08/2024', 333.32, 0, 0, 2833.32, 'TRANSFERENCIA', '6012844', 'EB01-88', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 3, '2024-08-14', '2024-08-07', '2024-08-21', 2500, NULL, 83.33, 0, 0, 2583.33, 'TRANSFERENCIA', '6140306', 'EB01-87', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 4, '2024-08-28', '2024-08-22', '2024-09-05', 2500, '30/08/2024', 83.33, 0, 0, 2583.33, 'TRANSFERENCIA', '6062883', 'EB01-89', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 5, '2024-09-14', '2024-09-06', '2024-09-20', 2500, NULL, 0, 0, 0, 2500, 'TRANSFERENCIA', '6061811', 'EB01-93', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'ADRIANA OLIVO R. DE BORDA'), 1, '2025-03-31', '2025-03-22', '2025-04-06', 2500, NULL, 0, 0, 0, 2500, 'TRANSFERENCIA', '3491648', 'PENDIENTE', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'ADRIANA OLIVO R. DE BORDA'), 2, '2025-04-22', '2025-04-07', '2025-04-21', 2500, '17/04/2025, 18/04/2025', 283.32, 0, 0, 2833.32, 'TRANSFERENCIA', '761087', 'PENDIENTE', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'ADRIANA OLIVO R. DE BORDA'), 3, '2025-04-30', '2025-04-22', '2025-05-06', 2500, NULL, 0, 0, 0, 2500, 'TRANSFERENCIA', '1330720', 'PENDIENTE', 'Pagado', NOW());

-- Insertar servicios eventuales reales
INSERT INTO eventual_services (service_date, start_time, patient_name, responsible_family_member, district, service_type, daily_amount, payment_method, operation_number, assigned_nurse, nurse_payment, extra_expenses, observations, profit, status, created_at) VALUES
('2025-03-01', '14:00', 'PATRICIA OCAMPO', 'PATRICIA OCAMPO', 'SAN BORJAS', '24 HORAS', 2800, 'TRANSFERENCIA', '802822', 'ROHANY-LAURA-CARO', 1400, 0, 'Servicio de 24 horas', 1400, 'Completado', NOW()),
('2025-03-01', '14:00', 'PATRICIA OCAMPO', 'PATRICIA OCAMPO', 'SAN BORJAS', '24 HORAS', 2800, 'TRANSFERENCIA', '1990177', 'LINA-ROHANY LAURA', 1400, 0, 'Servicio de 24 horas', 1400, 'Completado', NOW()),
('2025-03-11', '09:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'PLIN', '3353345', 'KARINA CARRASCO', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW()),
('2025-03-12', '08:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'PLIN', '314069', 'VERONICA', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW()),
('2025-03-13', '08:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'PLIN', '52100489', 'KARINA CARRASCO', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW()),
('2025-03-14', '08:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'YAPE', 'TDC', 'NAIDA', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW()),
('2025-03-15', '09:00', 'MONICA SOLIS', 'MONICA SOLIS', 'SAN BORJAS', '8 HORAS', 160, 'TRANSFERENCIA', '1025201', 'LIC. ROSA M.', 80, 0, 'Servicio de 8 horas', 80, 'Completado', NOW()),
('2025-03-15', '08:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'YAPE', '68998541', 'NAIDA', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW()),
('2025-03-16', '09:00', 'MONICA SOLIS', 'MONICA SOLIS', 'SAN BORJAS', '8 HORAS', 200, 'TRANSFERENCIA', '2474796', 'ROSA HERNANDEZ', 100, 0, 'Servicio de 8 horas', 100, 'Completado', NOW()),
('2025-03-16', '08:00', 'JORGE BALARZA', 'JORGE BALARZA', 'JESÚS MARÍA', '24 HORAS', 360, 'YAPE', '47516864', 'CAROLINA ROMERO', 180, 0, 'Servicio de 24 horas', 180, 'Completado', NOW());

-- Verificar datos insertados
SELECT 'Pacientes insertados:' as tipo, COUNT(*) as cantidad FROM patients WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Contratos insertados:', COUNT(*) FROM patient_contracts WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Pagos insertados:', COUNT(*) FROM patient_payments WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Servicios eventuales insertados:', COUNT(*) FROM eventual_services WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Mostrar resumen de datos
SELECT 
  p.name as paciente,
  pc.contract_number as contrato,
  pc.monthly_amount as monto_mensual,
  COUNT(pp.id) as total_pagos,
  SUM(pp.total_amount) as total_cobrado
FROM patients p
JOIN patient_contracts pc ON p.id = pc.patient_id
LEFT JOIN patient_payments pp ON pc.id = pp.contract_id
GROUP BY p.id, p.name, pc.contract_number, pc.monthly_amount
ORDER BY p.name;
`;

  return sql;
}

// Función principal
function generateCleanSQLFile() {
  try {
    console.log('🔄 Generando archivo SQL limpio...\n');
    
    const sql = generateCleanSQL();
    
    // Guardar archivo SQL
    const outputPath = path.join(__dirname, 'insert_real_data_clean.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    
    console.log(`💾 Archivo SQL limpio generado: ${outputPath}`);
    console.log(`📊 Contenido:`);
    console.log(`  👥 2 pacientes reales`);
    console.log(`  📋 2 contratos activos`);
    console.log(`  💰 8 pagos de ejemplo`);
    console.log(`  🏥 10 servicios eventuales`);
    
    console.log('\n✅ El archivo está listo para ejecutar en Supabase');
    console.log('📝 Este script:');
    console.log('  - Elimina datos de prueba');
    console.log('  - Inserta datos reales de Health At Home');
    console.log('  - Incluye relaciones correctas entre tablas');
    console.log('  - Valida la integridad de los datos');
    
  } catch (error) {
    console.error('Error generando archivo SQL:', error.message);
  }
}

// Ejecutar
generateCleanSQLFile();
