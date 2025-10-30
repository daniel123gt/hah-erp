-- Agregar campos para almacenar resultados de exámenes (PDFs)
-- Los PDFs se almacenan en Supabase Storage y solo guardamos la URL en la BD
-- El resultado es un solo PDF para toda la orden, no por examen individual

alter table if exists public.lab_exam_orders
add column if not exists result_pdf_url text;

-- Agregar campo para fecha de resultado
alter table if exists public.lab_exam_orders
add column if not exists result_date date;

-- Agregar campo para notas del resultado
alter table if exists public.lab_exam_orders
add column if not exists result_notes text;

-- Índice para buscar órdenes con resultados
create index if not exists idx_lab_exam_orders_result_pdf 
on public.lab_exam_orders(result_pdf_url) 
where result_pdf_url is not null;

-- Notas:
-- 1. Crear un bucket en Supabase Storage llamado "lab-results" (o el nombre que prefieras)
-- 2. Configurar políticas de acceso al bucket según tus necesidades
-- 3. Los PDFs se almacenan en: bucket/lab-results/ordenes/{order_id}/{filename}.pdf

