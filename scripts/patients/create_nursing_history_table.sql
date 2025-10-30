-- Crea la tabla de historia de enfermería para pacientes
-- Segura para Supabase (sin DROP directos)

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

