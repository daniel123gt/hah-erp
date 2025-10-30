-- =====================================================
-- POLÍTICAS RLS PARA PORTAL DE PACIENTES
-- =====================================================
-- Estas políticas garantizan que los pacientes SOLO puedan ver
-- sus propias órdenes de laboratorio y ningún otro dato.

-- =====================================================
-- 1. POLÍTICA PARA lab_exam_orders
-- =====================================================
-- Los pacientes solo pueden ver órdenes donde patient_id 
-- corresponde a un paciente con su email

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Patients can only see their own lab orders" ON public.lab_exam_orders;

-- Crear la política
CREATE POLICY "Patients can only see their own lab orders"
ON public.lab_exam_orders
FOR SELECT
USING (
  -- Verificar que el usuario esté autenticado
  auth.uid() IS NOT NULL
  AND
  -- Verificar que existe un paciente con el email del usuario autenticado
  -- y que ese paciente es el dueño de esta orden
  patient_id IN (
    SELECT id 
    FROM public.patients 
    WHERE email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- =====================================================
-- 2. POLÍTICA PARA lab_exam_order_items
-- =====================================================
-- Los pacientes solo pueden ver items de órdenes que les pertenecen

DROP POLICY IF EXISTS "Patients can only see items from their own orders" ON public.lab_exam_order_items;

CREATE POLICY "Patients can only see items from their own orders"
ON public.lab_exam_order_items
FOR SELECT
USING (
  -- Verificar que el usuario esté autenticado
  auth.uid() IS NOT NULL
  AND
  -- Verificar que la orden pertenece al paciente autenticado
  order_id IN (
    SELECT id 
    FROM public.lab_exam_orders
    WHERE patient_id IN (
      SELECT id 
      FROM public.patients 
      WHERE email = (
        SELECT email 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- 3. POLÍTICA PARA patients (solo su propio perfil)
-- =====================================================
-- Los pacientes solo pueden ver su propio registro

DROP POLICY IF EXISTS "Patients can only see their own profile" ON public.patients;

CREATE POLICY "Patients can only see their own profile"
ON public.patients
FOR SELECT
USING (
  -- Verificar que el usuario esté autenticado
  auth.uid() IS NOT NULL
  AND
  -- Verificar que el email del paciente coincide con el del usuario autenticado
  email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- 4. ASEGURAR QUE RLS ESTÉ HABILITADO
-- =====================================================
ALTER TABLE public.lab_exam_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_exam_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Estas políticas SOLO permiten SELECT (lectura)
-- 2. Los pacientes NO pueden crear, actualizar o eliminar órdenes
-- 3. Las políticas verifican el email del usuario autenticado
-- 4. Los pacientes deben tener una cuenta en auth.users con el mismo email que en la tabla patients
-- 5. Para que funcione correctamente, los pacientes deben:
--    - Tener una cuenta creada en Supabase Auth
--    - Su email debe coincidir exactamente con el email en la tabla patients
--    - Iniciar sesión usando ese email y contraseña
--
-- =====================================================
-- CONFIGURACIÓN DE CUENTAS DE PACIENTES:
-- =====================================================
-- Para crear una cuenta de paciente:
-- 1. El paciente ya debe existir en la tabla patients con su email
-- 2. Crear usuario en Supabase Auth con el mismo email
-- 3. El paciente puede iniciar sesión en /pacientes/laboratorio/login
--
-- Puedes crear usuarios manualmente en Supabase Dashboard > Authentication > Users
-- o usar la API de Supabase Admin para crear usuarios programáticamente.

