-- Crear tabla para órdenes de exámenes de laboratorio
create table if not exists public.lab_exam_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  order_date date not null default (current_date),
  physician_name text,
  priority text not null check (priority in ('urgente', 'normal', 'programada')) default 'normal',
  observations text,
  total_amount numeric(10,2) not null,
  status text not null check (status in ('Pendiente', 'En Proceso', 'Completado', 'Cancelado')) default 'Pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crear tabla para items de órdenes de exámenes
create table if not exists public.lab_exam_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.lab_exam_orders(id) on delete cascade,
  exam_id uuid not null references public.laboratory_exams(id),
  exam_code text not null,
  exam_name text not null,
  price numeric(10,2) not null,
  status text not null check (status in ('Pendiente', 'En Proceso', 'Completado', 'Cancelado')) default 'Pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_lab_exam_orders_patient on public.lab_exam_orders(patient_id);
create index if not exists idx_lab_exam_orders_date on public.lab_exam_orders(order_date);
create index if not exists idx_lab_exam_orders_status on public.lab_exam_orders(status);
create index if not exists idx_lab_exam_order_items_order on public.lab_exam_order_items(order_id);
create index if not exists idx_lab_exam_order_items_exam on public.lab_exam_order_items(exam_id);

-- Trigger updated_at para órdenes
create or replace function public.set_updated_at_lab_exam_orders()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_lab_exam_orders_updated_at'
  ) then
    create trigger trg_lab_exam_orders_updated_at
    before update on public.lab_exam_orders
    for each row execute function public.set_updated_at_lab_exam_orders();
  end if;
end $$;

-- Trigger updated_at para items
create or replace function public.set_updated_at_lab_exam_order_items()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_lab_exam_order_items_updated_at'
  ) then
    create trigger trg_lab_exam_order_items_updated_at
    before update on public.lab_exam_order_items
    for each row execute function public.set_updated_at_lab_exam_order_items();
  end if;
end $$;

