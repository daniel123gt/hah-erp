-- Tabla: medical_prescriptions
-- Recetas médicas de pacientes

create table if not exists public.medical_prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  date date not null,
  physician_name text not null,
  reason text not null,
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_medical_prescriptions_patient on public.medical_prescriptions(patient_id);
create index if not exists idx_medical_prescriptions_date on public.medical_prescriptions(date desc);

-- Trigger para updated_at
create or replace function public.set_updated_at_mp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_mp on public.medical_prescriptions;
create trigger trg_set_updated_at_mp
before update on public.medical_prescriptions
for each row execute function public.set_updated_at_mp();

