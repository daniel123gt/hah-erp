-- Tabla: nursing_vital_signs
-- Registro de Funciones Vitales (Enfermería)

create table if not exists public.nursing_vital_signs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  assessment_datetime timestamptz not null,
  nurse_name text not null,
  -- Presión Arterial (mmHg)
  blood_pressure_systolic text, -- parte alta (texto para permitir formatos como 120)
  blood_pressure_diastolic text, -- parte baja (texto para permitir formatos como 80)
  -- Frecuencias
  heart_rate integer, -- FC (x')
  respiratory_rate integer, -- FR (x')
  -- Saturación y Temperatura
  spo2 integer, -- %
  temperature numeric(5,2), -- °C
  -- Glicemia
  capillary_glucose numeric(6,2), -- mg/dL
  -- Observación
  observation text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_nursing_vital_signs_patient on public.nursing_vital_signs(patient_id);
create index if not exists idx_nursing_vital_signs_datetime on public.nursing_vital_signs(assessment_datetime desc);

-- Trigger para updated_at
create or replace function public.set_updated_at_nvs()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_nvs on public.nursing_vital_signs;
create trigger trg_set_updated_at_nvs
before update on public.nursing_vital_signs
for each row execute function public.set_updated_at_nvs();
