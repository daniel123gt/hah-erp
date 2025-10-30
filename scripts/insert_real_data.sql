-- =====================================================
-- DATOS REALES DE HEALTH AT HOME
-- Generado automáticamente desde archivos CSV
-- Fecha: 16/10/2025, 12:14:56 p. m.
-- =====================================================

-- Limpiar datos de prueba
DELETE FROM patient_payments;
DELETE FROM patient_contracts;
DELETE FROM eventual_services;
DELETE FROM patients WHERE name LIKE '%Test%' OR name LIKE '%Prueba%';

-- Insertar pacientes reales
INSERT INTO patients (name, district, emergency_contact_name, status, created_at) VALUES
('DELIA PIEDAD PIEDRA HERRERA', 'LIMA', 'ARTURO ESPEJO PIEDRA', 'Activo', '2025-10-16T17:14:56.042Z'),
('ADRIANA OLIVO R. DE BORDA.', 'SAN BORJAS', 'GABRIELA BORDA:', 'Activo', '2025-10-16T17:14:56.042Z');

-- Insertar contratos reales
INSERT INTO patient_contracts (patient_id, contract_number, contract_date, responsible_family_member, service_type, start_date, monthly_amount, payment_method, status, created_at) VALUES
((SELECT id FROM patients WHERE name = 'DELIA PIEDAD PIEDRA HERRERA'), 'CON-1760634896043-FLJD', '2024-07-06', 'ARTURO ESPEJO PIEDRA', '24 HORAS', '2024-07-06', 7000, 'Transferencia', 'Activo', NOW()),
((SELECT id FROM patients WHERE name = 'ADRIANA OLIVO R. DE BORDA.'), 'CON-1760634896043-R33H', '2025-03-22', 'GABRIELA BORDA:', '24 HORAS', '2025-03-22', 3000, 'Transferencia', 'Activo', NOW());

-- Insertar pagos reales
INSERT INTO patient_payments (contract_id, payment_number, payment_date, period_start, period_end, base_amount, holiday_dates, holiday_amount, service_pauses, pause_amount, total_amount, payment_method, operation_number, invoice_number, status, created_at) VALUES
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 1, '24-18-07', '2024-07-06', '2024-07-20', 2500, '23/Y 28/7/2024', 333.32, 0, 0, 2833.32, 'TRANSFERENCIA', '6008367', '-', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 2, '24-02-08', '2024-07-21', '24-05-08', 2500, '29/7/6/08/2024', 333.32, 0, 0, 2833.32, 'TRANSFERENCIA', '6012844', '-', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 3, '2024-08-14', '2024-08-07', '24-21-08', 2500, '0', 83.33, 0, 0, 2583.33, 'TRANSFERENCIA', '6140306', 'EB01-87', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 4, '2024-08-28', '2024-08-22', '2024-09-05', 2500, '30/08/2024', 83.33, 0, 0, 2583.33, 'TRANSFERENCIA', '6062883', '-', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 5, '2024-09-14', '2024-09-06', '2024-09-20', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6061811', 'EB01-93', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 6, '2024-09-28', '2024-09-21', '2024-10-04', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6001237', 'EB01-96', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 7, '2024-10-14', '2024-10-05', '2024-10-19', 2500, '8/10/2024', 166.66, 0, 0, 2666.67, 'TRANSFERENCIA', '6006105', 'EB01-105', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 8, '2024-10-30', '2024-10-20', '2024-11-03', 2500, '01/11/2024', 166.66, 0, 0, 2666.67, 'TRANSFERENCIA', '6127905', 'EB01-108', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 9, '2024-11-14', '2024-11-04', '2024-11-18', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6009204', 'EB01-110', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 10, '2024-11-30', '2024-11-19', '2024-12-03', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6003918', 'EB01-115', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 11, '2024-12-14', '2024-12-04', '2024-12-18', 2500, '8/12/2024', 166.66, 0, 0, 2916.67, 'TRANSFERENCIA', '6006187', 'EB01-116', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 12, '2024-12-30', '2024-12-19', '2025-01-02', 2500, '25/12/24-01/01/25', 333.33, 0, 0, 2916.67, 'TRANSFERENCIA', '6008282', 'PENDIENTE', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 13, '2025-01-14', '2025-01-03', '2025-01-17', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6012144', 'PENDIENTE', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 14, '2025-01-30', '2025-01-18', '2025-02-01', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6040810', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 15, '2025-02-14', '2025-02-02', '2025-02-16', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6024665', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 16, '2025-02-27', '2025-02-17', '2025-03-03', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6109630', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 17, '2025-03-15', '2025-03-04', '2025-03-18', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6003179', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 18, '2028-03-29', '2025-03-19', '2025-04-03', 2500, '0', 0, 0, 0, 2500, 'TRANSFERENCIA', '6095898', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 19, '2025-04-14', '2025-03-04', '2025-04-18', 2500, '17 y 18 /04/2025', 333.32, 0, 0, 2750, 'TRANFERENCIA', '6120781', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 20, '2025-04-19', '2025-04-19', '2025-05-03', 2500, '01/05/2025', 166.66, 0, 0, 2750, 'TRANFERENCIA', '6008043', '-', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 21, '25-14-05', '2025-05-04', '25-18-05', 2500, '0', 0, 0, 0, 2500, 'TRANFERENCIA', '6112256', '-', 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 22, '2025-05-29', '2025-05-19', '2025-06-02', 2500, '0', 0, 0, 0, 2500, 'TRANFERENCIA', '6112397', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 23, '2025-06-14', '2025-06-03', '2025-06-17', 2500, '07 /06/2025', 166.66, 0, 0, 2666.67, 'TRANFERENCIA', '6006177', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 24, '2025-06-29', '2025-06-18', '2025-07-03', 2500, '29/06/2025', 166.66, 0, 0, 2666.66, 'TRNFERENCIA', '6007340', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 25, '2025-07-14', '2025-07-04', '2025-07-18', 2500, '23/28/29/07/2025', 333.32, 0, 0, 3000, 'TRANFERENCIA', '6007154', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 26, '2025-07-29', '2025-07-19', '2025-08-02', 2500, '23,28,29./07/2025', 499.98, 0, 0, 3000, 'TRANFERENCIA', '6011119', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 27, '2025-08-14', '2025-08-03', '2025-08-17', 2500, '06 /08/2025', 166.66, 0, 0, 2583, 'TRANFERENCIA', '6014166', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 28, '2025-08-29', '2025-08-18', '2025-09-01', 2500, '30/08/2025', 166.66, 0, 0, 2583.34, 'TRANFERENCIA', '6001121', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 29, '2025-09-14', '2025-09-02', '2025-09-16', 2500, '0', 0, 0, 0, 2500, 'TRANFERENCIA', '6000384', NULL, 'Pagado', NOW()),
((SELECT pc.id FROM patient_contracts pc JOIN patients p ON pc.patient_id = p.id WHERE p.name = 'DELIA PIEDAD PIEDRA HERRERA'), 30, '2025-09-29', '2025-09-17', '2025-10-01', 2500, '08/10/2025', 166.66, 0, 0, 2500, 'TRANFERENCIA', '6006025', NULL, 'Pagado', NOW());

-- Insertar servicios eventuales reales
INSERT INTO eventual_services (service_date, start_time, patient_name, responsible_family_member, district, service_type, daily_amount, payment_method, operation_number, assigned_nurse, nurse_payment, extra_expenses, observations, profit, status, created_at) VALUES
('2025-03-01', '200PM', 'PATRICIA OCAMPO', 'PATRICIA OCAMPO', 'SAN BORJAS', '24 HORAS', 2800, 'TRANFERENCIA', '802822', 'ROHANY-LAURA-CARO-', 1400, 0, NULL, 1400, 'Completado', NOW()),
('2025-03-01', '2:00  PM', 'PATRICIA OCAMPO', 'PATRICIA OCAMPO', 'SAN BORJAS', '24 HORAS', 2800, 'TRANFERENCIA', '1990177', 'LINA-ROHANY LAURA', 1400, 0, NULL, 1400, 'Completado', NOW()),
('2025-03-11', '9:00 AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'PLIN', '3353345', 'KARINA CARRASCO', 180, 0, NULL, 180, 'Completado', NOW()),
('2025-03-12', '8:00AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'PLIN', '314069', 'VERONICA', 180, 0, NULL, 180, 'Completado', NOW()),
('2025-03-13', '8:00 AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'PLIN', '52100489', 'KARINA CARRASCO', 180, 0, NULL, 180, 'Completado', NOW()),
('2025-03-14', '8:00 AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'YAPE', 'TDC', 'NAIDA', 180, 0, NULL, 180, 'Completado', NOW()),
('2025-03-15', '9:OO AM', 'MONICA SOLIS', 'MONICA SOLIS', 'SAN BORJAS', '8 HORAS', 160, 'TRANFERENCIA', '1025201', 'LIC. ROSA ,M.', 80, 0, NULL, 80, 'Completado', NOW()),
('2025-03-15', '8:00 AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'YAPE', '68998541', 'NAIDA', 180, 0, NULL, 180, 'Completado', NOW()),
('2025-03-16', '9:00 AM', 'MONICA SOLIS', 'MONICA SOLIS', 'SAN BORJA', '8 HORAS', 200, 'TRANFERENCIA', '2474796', 'ROSA HERNANDEZ', 100, 0, NULL, 100, 'Completado', NOW()),
('2025-03-16', '8:00 AM', 'JORGE BALARZA', 'JORGE BALARZA', 'JESUS MARIA', '24 HORAS', 360, 'YAPE', '47516864', 'CAROLINA ROMERO', 180, 0, NULL, 180, 'Completado', NOW());

-- Verificar datos insertados
SELECT 'Pacientes insertados:' as tipo, COUNT(*) as cantidad FROM patients WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Contratos insertados:', COUNT(*) FROM patient_contracts WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Pagos insertados:', COUNT(*) FROM patient_payments WHERE created_at >= NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Servicios eventuales insertados:', COUNT(*) FROM eventual_services WHERE created_at >= NOW() - INTERVAL '1 minute';
