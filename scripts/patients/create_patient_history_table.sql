-- Crea la tabla de historia clínica para pacientes
-- Segura para Supabase (sin DROP directos)

create table if not exists public.patient_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  entry_date date not null default (current_date),
  entry_type text not null check (entry_type in (
    'Consulta', 'Diagnóstico', 'Prescripción', 'Procedimiento', 'Evolución', 'Laboratorio', 'Imagen', 'Otro'
  )),
  title text not null,
  notes text,
  attachments text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_patient_history_patient on public.patient_history(patient_id);
create index if not exists idx_patient_history_date on public.patient_history(entry_date);
create index if not exists idx_patient_history_type on public.patient_history(entry_type);

-- Trigger updated_at
create or replace function public.set_updated_at_patient_history()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_patient_history_updated_at'
  ) then
    create trigger trg_patient_history_updated_at
    before update on public.patient_history
    for each row execute function public.set_updated_at_patient_history();
  end if;
end $$;

-- Datos de prueba opcionales
insert into public.patient_history (patient_id, entry_date, entry_type, title, notes)
select id, current_date, 'Consulta', 'Consulta inicial', 'Motivo de consulta: chequeo general'
from public.patients
order by created_at desc
limit 3;


