-- Crear tabla de valoración inicial de enfermería
-- Segura para Supabase (sin DROP directos)

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

