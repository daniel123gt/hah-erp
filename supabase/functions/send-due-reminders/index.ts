// Edge Function programada (cron): busca citas/labs en las próximas 2 horas y
// envía un push a TODOS los dispositivos suscritos (para que lleguen aunque la
// app esté cerrada). Evita duplicados con la tabla push_reminders_sent.
//
// Se invoca desde un cron (pg_cron / Supabase Cron) con el header x-cron-secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Perú es UTC-5 (sin horario de verano).
const PERU_OFFSET = "-05:00";

function ymd(d: Date): string {
  // Fecha "de pared" en Perú a partir de un instante UTC.
  const peru = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return `${peru.getUTCFullYear()}-${String(peru.getUTCMonth() + 1).padStart(2, "0")}-${String(
    peru.getUTCDate()
  ).padStart(2, "0")}`;
}

const CANCELLED = new Set(["cancelled", "cancelada", "no-show", "cancelado"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;
  const cronSecret = Deno.env.get("PUSH_CRON_SECRET") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Config del servidor incompleta" }, 500);

  // Autorización: solo el cron (secreto).
  const providedCron = req.headers.get("x-cron-secret");
  if (!cronSecret || providedCron !== cronSecret) return json({ error: "No autorizado" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const nowMs = Date.now();
  const windowEndMs = nowMs + 2 * 60 * 60 * 1000; // próximas 2 horas
  const todayPeru = ymd(new Date(nowMs));
  const tomorrowPeru = ymd(new Date(nowMs + 24 * 60 * 60 * 1000));

  type Due = { key: string; title: string; body: string };
  const due: Due[] = [];

  // --- Citas (medicina / procedimientos / rx_ecografias) ---
  const { data: appts } = await admin
    .from("appointments")
    .select("id, variant, date, time, status, patient_name, doctor_name, location, district, procedure_name, type")
    .in("variant", ["medicina", "procedimientos", "rx_ecografias"])
    .in("date", [todayPeru, tomorrowPeru]);

  for (const a of appts ?? []) {
    if (CANCELLED.has(String(a.status ?? "").toLowerCase())) continue;
    if (!a.time) continue;
    const t = new Date(`${a.date}T${a.time}:00${PERU_OFFSET}`).getTime();
    if (isNaN(t) || t < nowMs || t > windowEndMs) continue;
    const label =
      a.variant === "procedimientos"
        ? "Recordatorio de procedimiento"
        : a.variant === "rx_ecografias"
          ? "Recordatorio de RX / Ecografía"
          : "Recordatorio de cita";
    const place = a.location || a.district || "";
    const detail =
      a.variant === "procedimientos" ? a.procedure_name || a.type || "Procedimiento" : a.type || "Cita";
    const lines = [`${a.patient_name ?? "Paciente"} · ${a.time}`, detail];
    if (a.doctor_name) lines.push(String(a.doctor_name));
    if (place) lines.push(`📍 ${place}`);
    due.push({ key: `cita-${a.id}-${a.date}-${a.time}`, title: label, body: lines.join("\n") });
  }

  // --- Laboratorio (por fecha/hora de toma de muestra) ---
  const nowIso = new Date(nowMs).toISOString();
  const endIso = new Date(windowEndMs).toISOString();
  const { data: labs } = await admin
    .from("lab_exam_orders")
    .select("id, sample_date, status, patient:patient_id(name, address, district)")
    .gte("sample_date", nowIso)
    .lte("sample_date", endIso);

  for (const o of labs ?? []) {
    if (CANCELLED.has(String(o.status ?? "").toLowerCase())) continue;
    const p = Array.isArray(o.patient) ? o.patient[0] : o.patient;
    const peru = new Date(new Date(String(o.sample_date)).getTime() - 5 * 60 * 60 * 1000);
    const hh = String(peru.getUTCHours()).padStart(2, "0");
    const mm = String(peru.getUTCMinutes()).padStart(2, "0");
    const place = p?.address || p?.district || "";
    const lines = [`${p?.name ?? "Paciente"} · ${hh}:${mm}`];
    if (place) lines.push(`📍 ${place}`);
    due.push({ key: `lab-${o.id}-${o.sample_date}`, title: "Recordatorio de laboratorio", body: lines.join("\n") });
  }

  // --- Dedupe + envío ---
  let sent = 0;
  for (const item of due) {
    const { error: insErr } = await admin.from("push_reminders_sent").insert({ reminder_key: item.key });
    if (insErr) continue; // ya se envió (violación de unique) u otro error → saltar
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          "x-cron-secret": cronSecret,
        },
        body: JSON.stringify({ title: item.title, body: item.body, url: "/" }),
      });
      sent++;
    } catch (_) {
      // si falla el envío, el registro queda marcado igual (evita spam en el próximo tick)
    }
  }

  return json({ ok: true, evaluated: due.length, sent });
});
