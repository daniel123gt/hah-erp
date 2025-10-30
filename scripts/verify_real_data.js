import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase (usar las mismas credenciales que en la app)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRealData() {
  console.log('🔍 Verificando datos reales en Supabase...\n');
  
  try {
    // Verificar pacientes
    console.log('👥 Verificando pacientes...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (patientsError) {
      console.error('❌ Error al obtener pacientes:', patientsError.message);
      return;
    }
    
    console.log(`✅ Pacientes encontrados: ${patients.length}`);
    patients.forEach(patient => {
      console.log(`  - ${patient.name} (${patient.district}) - ${patient.status}`);
    });
    
    // Verificar contratos
    console.log('\n📋 Verificando contratos...');
    const { data: contracts, error: contractsError } = await supabase
      .from('patient_contracts')
      .select(`
        *,
        patients!inner(name)
      `)
      .order('created_at', { ascending: false });
    
    if (contractsError) {
      console.error('❌ Error al obtener contratos:', contractsError.message);
      return;
    }
    
    console.log(`✅ Contratos encontrados: ${contracts.length}`);
    contracts.forEach(contract => {
      console.log(`  - ${contract.patients.name}: ${contract.contract_number} (S/.${contract.monthly_amount})`);
    });
    
    // Verificar pagos
    console.log('\n💰 Verificando pagos...');
    const { data: payments, error: paymentsError } = await supabase
      .from('patient_payments')
      .select(`
        *,
        patient_contracts!inner(
          patients!inner(name)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (paymentsError) {
      console.error('❌ Error al obtener pagos:', paymentsError.message);
      return;
    }
    
    console.log(`✅ Pagos encontrados: ${payments.length}`);
    
    // Agrupar pagos por paciente
    const paymentsByPatient = {};
    payments.forEach(payment => {
      const patientName = payment.patient_contracts.patients.name;
      if (!paymentsByPatient[patientName]) {
        paymentsByPatient[patientName] = [];
      }
      paymentsByPatient[patientName].push(payment);
    });
    
    Object.entries(paymentsByPatient).forEach(([patientName, patientPayments]) => {
      const totalAmount = patientPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      console.log(`  - ${patientName}: ${patientPayments.length} pagos (Total: S/.${totalAmount.toFixed(2)})`);
    });
    
    // Verificar servicios eventuales
    console.log('\n🏥 Verificando servicios eventuales...');
    const { data: eventualServices, error: eventualError } = await supabase
      .from('eventual_services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (eventualError) {
      console.error('❌ Error al obtener servicios eventuales:', eventualError.message);
      return;
    }
    
    console.log(`✅ Servicios eventuales encontrados: ${eventualServices.length}`);
    
    // Agrupar por distrito
    const servicesByDistrict = {};
    eventualServices.forEach(service => {
      if (!servicesByDistrict[service.district]) {
        servicesByDistrict[service.district] = [];
      }
      servicesByDistrict[service.district].push(service);
    });
    
    Object.entries(servicesByDistrict).forEach(([district, services]) => {
      const totalProfit = services.reduce((sum, s) => sum + (s.profit || 0), 0);
      console.log(`  - ${district}: ${services.length} servicios (Utilidad: S/.${totalProfit.toFixed(2)})`);
    });
    
    // Resumen final
    console.log('\n📊 RESUMEN DE DATOS REALES:');
    console.log(`👥 Total pacientes: ${patients.length}`);
    console.log(`📋 Total contratos: ${contracts.length}`);
    console.log(`💰 Total pagos: ${payments.length}`);
    console.log(`🏥 Total servicios eventuales: ${eventualServices.length}`);
    
    // Calcular métricas
    const totalRevenue = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const totalProfit = eventualServices.reduce((sum, s) => sum + (s.profit || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'Activo').length;
    
    console.log('\n💰 MÉTRICAS FINANCIERAS:');
    console.log(`💵 Ingresos por contratos: S/.${totalRevenue.toFixed(2)}`);
    console.log(`💵 Utilidad por servicios eventuales: S/.${totalProfit.toFixed(2)}`);
    console.log(`📈 Contratos activos: ${activeContracts}`);
    
    // Guardar resumen en archivo
    const summary = {
      timestamp: new Date().toISOString(),
      patients: patients.length,
      contracts: contracts.length,
      payments: payments.length,
      eventualServices: eventualServices.length,
      totalRevenue,
      totalProfit,
      activeContracts,
      patientsData: patients,
      contractsData: contracts,
      paymentsData: payments,
      eventualServicesData: eventualServices
    };
    
    const summaryPath = path.join(__dirname, 'csv_output', 'real_data_verification.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\n💾 Resumen guardado en: ${summaryPath}`);
    
    console.log('\n✅ Verificación completada exitosamente!');
    console.log('🎯 Los datos reales de Health At Home están funcionando correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar verificación
verifyRealData();
