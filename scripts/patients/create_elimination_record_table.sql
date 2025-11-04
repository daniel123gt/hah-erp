-- Tabla: elimination_records
-- Hoja Descriptiva de Eliminación de Heces y Orinas

create table if not exists public.elimination_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  
  -- Información básica
  patient_name text not null,
  age integer,
  nurse_name text not null,
  record_date date not null,
  
  -- Datos de heces por turno
  -- Mañana
  feces_morning_count integer, -- N° de deposición
  feces_morning_color text, -- Color
  feces_morning_appearance text, -- Aspecto
  feces_morning_quantity text, -- Cantidad
  
  -- Tarde
  feces_afternoon_count integer,
  feces_afternoon_color text,
  feces_afternoon_appearance text,
  feces_afternoon_quantity text,
  
  -- Noche
  feces_night_count integer,
  feces_night_color text,
  feces_night_appearance text,
  feces_night_quantity text,
  
  -- Datos de orina por turno
  -- Mañana
  urine_morning_count integer, -- N° de micciones
  urine_morning_color text, -- Color
  urine_morning_odor text, -- Olor
  urine_morning_quantity text, -- Cantidad
  
  -- Tarde
  urine_afternoon_count integer,
  urine_afternoon_color text,
  urine_afternoon_odor text,
  urine_afternoon_quantity text,
  
  -- Noche
  urine_night_count integer,
  urine_night_color text,
  urine_night_odor text,
  urine_night_quantity text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_elimination_records_patient on public.elimination_records(patient_id);
create index if not exists idx_elimination_records_date on public.elimination_records(record_date desc);

-- Trigger para updated_at
create or replace function public.set_updated_at_er()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_er on public.elimination_records;
create trigger trg_set_updated_at_er
before update on public.elimination_records
for each row execute function public.set_updated_at_er();

