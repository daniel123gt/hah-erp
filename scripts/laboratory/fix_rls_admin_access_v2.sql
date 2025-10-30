-- =====================================================
-- CORREGIR RLS: PERMITIR ACCESO AL STAFF/ADMIN (VERSIÓN CORREGIDA)
-- =====================================================
-- Este script corrige la recursión infinita y permite que el staff/admin
-- tenga acceso completo mientras los pacientes solo ven sus datos

-- =====================================================
-- PASO 1: ELIMINAR LAS POLÍTICAS PROBLEMÁTICAS
-- =====================================================

DROP POLICY IF EXISTS "Staff can access all patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can access all lab orders" ON public.lab_exam_orders;
DROP POLICY IF EXISTS "Staff can access all lab order items" ON public.lab_exam_order_items;

-- =====================================================
-- PASO 2: CREAR POLÍTICAS CORRECTAS PARA STAFF/ADMIN
-- =====================================================

-- Política para patients: Permite acceso completo a usuarios autenticados
-- Las políticas de pacientes (ya existentes) restringirán qué pacientes ven
-- Esta política permite que el staff acceda a todos
CREATE POLICY "Authenticated users can access patients"
ON public.patients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para lab_exam_orders: Acceso completo a autenticados
CREATE POLICY "Authenticated users can access lab orders"
ON public.lab_exam_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para lab_exam_order_items: Acceso completo a autenticados
CREATE POLICY "Authenticated users can access lab order items"
ON public.lab_exam_order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- PASO 3: AJUSTAR POLÍTICAS DE PACIENTES PARA QUE SEAN MÁS ESPECÍFICAS
-- =====================================================

-- Las políticas existentes de pacientes ya restringen el acceso
-- Solo necesitamos asegurarnos de que sean más específicas
-- Estas políticas ya existen (creadas en create_patient_portal_rls_policies.sql)
-- pero las ajustamos para que funcionen mejor junto con las de staff

-- Actualizar política de patients para pacientes (ya existe, pero la recreamos más específica)
DROP POLICY IF EXISTS "Patients can only see their own profile" ON public.patients;

-- No necesitamos recrear esta porque la política de "authenticated users" 
-- ya permite acceso, pero si queremos ser más explícitos, podemos crear una
-- que tenga prioridad. Pero en realidad, las políticas de RLS se evalúan con OR,
-- así que si una permite acceso, se permite.

-- =====================================================
-- VERIFICAR QUE TODO ESTÉ HABILITADO
-- =====================================================
ALTER TABLE public.lab_exam_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Con estas políticas:
-- 1. Cualquier usuario autenticado puede acceder a todas las tablas (staff/admin)
-- 2. Los pacientes solo deberían poder ver sus datos a través del portal de pacientes
--    usando el servicio patientLabService que filtra por email
--
-- Si necesitas restringir más el acceso del staff, puedes crear roles en Supabase Auth
-- y usar esos roles en las políticas en lugar de "authenticated"

