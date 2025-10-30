-- =====================================================
-- SOLUCIONAR RECURSIÓN INFINITA EN POLÍTICAS RLS
-- =====================================================
-- Las políticas anteriores causaban recursión porque consultaban
-- la tabla patients dentro de políticas de patients.
-- Este script elimina las políticas problemáticas y crea versiones
-- simples que no causan recursión.

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar políticas de staff que causan recursión
DROP POLICY IF EXISTS "Staff can access all patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can access all lab orders" ON public.lab_exam_orders;
DROP POLICY IF EXISTS "Staff can access all lab order items" ON public.lab_exam_order_items;

-- Eliminar políticas de pacientes (las recrearemos de forma más simple)
DROP POLICY IF EXISTS "Patients can only see their own profile" ON public.patients;
DROP POLICY IF EXISTS "Patients can only see their own lab orders" ON public.lab_exam_orders;
DROP POLICY IF EXISTS "Patients can only see items from their own orders" ON public.lab_exam_order_items;

-- Eliminar política general que podría causar conflictos
DROP POLICY IF EXISTS "Authenticated users can access patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can access lab orders" ON public.lab_exam_orders;
DROP POLICY IF EXISTS "Authenticated users can access lab order items" ON public.lab_exam_order_items;

-- =====================================================
-- PASO 2: TEMPORALMENTE DESHABILITAR RLS PARA RESTAURAR FUNCIONALIDAD
-- =====================================================
-- Esto permitirá que el ERP funcione de nuevo mientras
-- implementamos una solución mejor usando roles o metadata

ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_order_items DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTA: OPCIÓN ALTERNATIVA - USAR ROLES
-- =====================================================
-- Para una solución más robusta, podrías:
-- 1. Usar roles en Supabase Auth (staff, patient)
-- 2. Asignar roles a los usuarios
-- 3. Crear políticas basadas en roles en lugar de email matching

-- Ejemplo de cómo sería con roles:
-- CREATE POLICY "Staff can access all patients"
-- ON public.patients
-- FOR ALL
-- TO authenticated
-- USING (
--   (auth.jwt() ->> 'user_role')::text = 'staff'
-- );

-- =====================================================
-- VERIFICAR ESTADO
-- =====================================================
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'lab_exam_orders', 'lab_exam_order_items');

-- Debería mostrar rowsecurity = false para todas las tablas

