-- ================================================================
-- SCRIPTS SQL PARA INSTALAR TABLAS DE ENFERMERÍA
-- ================================================================
-- Este script incluye todas las tablas necesarias para el módulo
-- de enfermería, incluyendo valoración inicial, historia de enfermería
-- e historia de exámenes.
--
-- Orden de ejecución recomendado:
-- 1. nursing_history (si aún no existe)
-- 2. exam_history (si aún no existe)
-- 3. nursing_initial_assessments (nuevo)
--
-- ================================================================

-- ================================================================
-- 1. TABLA: nursing_history
-- Descripción: Historia general de enfermería
-- ================================================================
create table if not exists public.nursing_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  entry_date date not null default (current_date),
  entry_type text not null check (entry_type in (
    'Atención de Enfermería', 'Control de Signos Vitales', 'Administración de Medicamentos', 
    'Cuidado de Heridas', 'Control de Alimentación', 'Higiene del Paciente', 
    'Educación al Paciente', 'Otro'
  )),
  title text not null,
  notes text,
  vital_signs jsonb, -- {blood_pressure: "120/80", heart_rate: 72, temperature: 36.5, respiratory_rate: 16, oxygen_saturation: 98}
  attachments text[],
  nurse_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_nursing_history_patient on public.nursing_history(patient_id);
create index if not exists idx_nursing_history_date on public.nursing_history(entry_date);
create index if not exists idx_nursing_history_type on public.nursing_history(entry_type);
create index if not exists idx_nursing_history_nurse on public.nursing_history(nurse_name);

-- Trigger updated_at
create or replace function public.set_updated_at_nursing_history()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_nursing_history_updated_at'
  ) then
    create trigger trg_nursing_history_updated_at
    before update on public.nursing_history
    for each row execute function public.set_updated_at_nursing_history();
  end if;
end $$;

-- ================================================================
-- 2. TABLA: exam_history
-- Descripción: Historia de exámenes médicos del paciente
-- ================================================================
create table if not exists public.exam_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  exam_date date not null default (current_date),
  exam_type text not null check (exam_type in (
    'Laboratorio', 'Imagenología', 'Cardíaco', 'Neurológico', 'Pulmonar', 
    'Dermatológico', 'Oftalmológico', 'Auditivo', 'Ginecológico', 'Urológico', 'Otro'
  )),
  exam_name text not null,
  exam_code text,
  results text,
  notes text,
  ordered_by text, -- médico que ordenó el examen
  performed_by text, -- quien realizó el examen
  status text not null default 'Pendiente' check (status in (
    'Pendiente', 'En Proceso', 'Completado', 'Cancelado'
  )),
  attachments text[], -- URLs o file ids de resultados, imágenes, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_exam_history_patient on public.exam_history(patient_id);
create index if not exists idx_exam_history_date on public.exam_history(exam_date);
create index if not exists idx_exam_history_type on public.exam_history(exam_type);
create index if not exists idx_exam_history_status on public.exam_history(status);
create index if not exists idx_exam_history_code on public.exam_history(exam_code);

-- Trigger updated_at
create or replace function public.set_updated_at_exam_history()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_exam_history_updated_at'
  ) then
    create trigger trg_exam_history_updated_at
    before update on public.exam_history
    for each row execute function public.set_updated_at_exam_history();
  end if;
end $$;

-- ================================================================
-- 3. TABLA: nursing_initial_assessments (NUEVO)
-- Descripción: Valoración inicial de enfermería según documento oficial
-- ================================================================
create table if not exists public.nursing_initial_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  assessment_date date not null default (current_date),
  nurse_name text not null,
  
  -- Datos del paciente
  age integer,
  weight numeric(5,2), -- KG
  height numeric(5,2), -- CM (TALLA)
  blood_type text, -- TIPO DE SANGRE
  medical_diagnosis text, -- DX MEDICO
  
  -- Médico tratante
  attending_physician text, -- MEDICO TRATANTE
  
  -- Antecedentes
  pathological_history text, -- ANTECEDENTES PATOLÓGICOS IMPORTANTES
  prophylactic_medications text, -- MEDICAMENTOS PROFILACTICOS HABITUALES
  medication_allergies text, -- ALERGIA A MEDICAMENTOS
  
  -- Signos vitales (JSONB)
  vital_signs jsonb, -- {blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, temperature, capillary_glucose, vital_signs_time}
  
  -- Examen físico (JSONB)
  physical_exam jsonb, -- {neurological, cardiovascular, respiratory, gastrointestinal, genitourinary, extremities}
  
  -- Acciones de enfermería
  nursing_actions text, -- ACCIONES DE ENFERMERIA
  pending_actions text, -- ACCIONES PENDIENTES
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_nursing_initial_assessments_patient on public.nursing_initial_assessments(patient_id);
create index if not exists idx_nursing_initial_assessments_date on public.nursing_initial_assessments(assessment_date);
create index if not exists idx_nursing_initial_assessments_nurse on public.nursing_initial_assessments(nurse_name);

-- Trigger updated_at
create or replace function public.set_updated_at_nursing_initial_assessments()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_nursing_initial_assessments_updated_at'
  ) then
    create trigger trg_nursing_initial_assessments_updated_at
    before update on public.nursing_initial_assessments
    for each row execute function public.set_updated_at_nursing_initial_assessments();
  end if;
end $$;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
-- Notas:
-- - Todas las tablas usan "if not exists" para evitar errores si ya existen
-- - Los triggers usan verificaciones para evitar duplicados
-- - Todas las referencias a patients tienen "on delete cascade"
-- - Los índices optimizan las consultas por paciente, fecha y tipo
-- ================================================================

