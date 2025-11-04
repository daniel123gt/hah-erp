-- Tabla: nursing_evolutions
-- Evoluciones de Enfermería

create table if not exists public.nursing_evolutions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  
  -- Información del formulario (estática, se actualiza cuando sea necesario)
  patient_name text not null,
  age integer,
  evolution_date date not null,
  shift text, -- TURNO
  nurse_name text not null,
  dependency_grade text, -- G. DE DEPENDENCIA
  nursing_assessment text, -- VALORACIÓN DE ENFERMERÍA (estática)
  pain_scale integer, -- ESCALA DEL DOLOR (0-10)
  
  -- Tabla de registros (se agregan múltiples registros)
  -- Esto se almacenará como JSON array en un campo o como tabla relacionada
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla para los registros individuales de la evolución
create table if not exists public.nursing_evolution_records (
  id uuid primary key default gen_random_uuid(),
  evolution_id uuid not null references public.nursing_evolutions(id) on delete cascade,
  
  -- Columnas de la tabla
  nanda_diagnosis text, -- DX. ENF. (NANDA)
  noc_objective text, -- OBJ./NOC
  time text, -- HORA
  nic_interventions text, -- INTERVENCIONES DE ENFERMERIA (NIC)
  evaluation text, -- EVALUACION
  observation text, -- OBSERVACION
  
  record_order integer not null default 0, -- Para mantener el orden de los registros
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_nursing_evolutions_patient on public.nursing_evolutions(patient_id);
create index if not exists idx_nursing_evolutions_date on public.nursing_evolutions(evolution_date desc);
create index if not exists idx_nursing_evolution_records_evolution on public.nursing_evolution_records(evolution_id);
create index if not exists idx_nursing_evolution_records_order on public.nursing_evolution_records(evolution_id, record_order);

-- Triggers para updated_at
create or replace function public.set_updated_at_ne()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_ne on public.nursing_evolutions;
create trigger trg_set_updated_at_ne
before update on public.nursing_evolutions
for each row execute function public.set_updated_at_ne();

drop trigger if exists trg_set_updated_at_ner on public.nursing_evolution_records;
create trigger trg_set_updated_at_ner
before update on public.nursing_evolution_records
for each row execute function public.set_updated_at_ne();

