-- Crea la tabla de historia de exámenes para pacientes
-- Segura para Supabase (sin DROP directos)

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

