-- =====================================================
-- CORREGIR RLS: PERMITIR ACCESO AL STAFF/ADMIN
-- =====================================================
-- Este script corrige las políticas RLS para que el staff/admin
-- pueda acceder a las tablas mientras mantenemos las restricciones
-- Dupacientes

-- =====================================================
-- 1. POLÍTICAS PARA patients - STAFF/ADMIN ACCESO COMPLETO
-- =====================================================

-- Política para staff/admin: acceso completo a pacientes
-- Asumimos que el staff/admin NO tiene email en la tabla patients
DROP POLICY IF EXISTS "Staff can access all patients" ON public.patients;

CREATE POLICY "Staff can access all patients"
ON public.patients
FOR ALL
USING (
  -- Si el usuario NO tiene email en la tabla patients, es staff/admin
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Misma condición para INSERT/UPDATE
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- 2. POLÍTICAS PARA lab_exam_orders - STAFF/ADMIN ACCESO COMPLETO
-- =====================================================

DROP POLICY IF EXISTS "Staff can access all lab orders" ON public.lab_exam_orders;

CREATE POLICY "Staff can access all lab orders"
ON public.lab_exam_orders
FOR ALL
USING (
  -- Si el usuario NO tiene email en la tabla patients, es staff/admin
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Misma condición para INSERT/UPDATE
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- 3. POLÍTICAS PARA lab_exam_order_items - STAFF/ADMIN ACCESO COMPLETO
-- =====================================================

DROP POLICY IF EXISTS "Staff can access all lab order items" ON public.lab_exam_order_items;

CREATE POLICY "Staff can access all lab order items"
ON public.lab_exam_order_items
FOR ALL
USING (
  -- Si el usuario NO tiene email en la tabla patients, es staff/admin
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Misma condición para INSERT/UPDATE
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.patients p
    WHERE p.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- VERIFICAR QUE TODO ESTÉ HABILITADO
-- =====================================================
ALTER TABLE public.lab_exam_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RESUMEN
-- =====================================================
-- Ahora hay dos tipos de políticas:
-- 1. Para PACIENTES: Solo ven sus propios datos (ya creadas anteriormente)
-- 2. Para STAFF/ADMIN: Acceso completo a todos los datos (creadas aquí)
--
-- La lógica es:
-- - Si el email del usuario está en la tabla patients → es paciente → solo ve sus datos
-- - Si el email del usuario NO está en la tabla patients → es staff/admin → ve todo

