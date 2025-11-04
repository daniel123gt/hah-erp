-- Tabla: medical_rests
-- Descansos médicos de pacientes

create table if not exists public.medical_rests (
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
create index if not exists idx_medical_rests_patient on public.medical_rests(patient_id);
create index if not exists idx_medical_rests_date on public.medical_rests(date desc);

-- Trigger para updated_at
create or replace function public.set_updated_at_mr()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_mr on public.medical_rests;
create trigger trg_set_updated_at_mr
before update on public.medical_rests
for each row execute function public.set_updated_at_mr();

