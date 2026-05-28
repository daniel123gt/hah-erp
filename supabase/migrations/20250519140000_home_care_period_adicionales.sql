-- Adicionales por periodo quincenal (monto, fecha, descripción)
alter table public.home_care_periods
  add column if not exists adicionales jsonb not null default '[]'::jsonb;

comment on column public.home_care_periods.adicionales is
  'Array JSON: [{ "id", "monto", "fecha" (YYYY-MM-DD), "descripcion" }]';
