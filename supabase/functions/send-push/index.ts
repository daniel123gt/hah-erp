// Edge Function: envía notificaciones Web Push a los dispositivos suscritos.
// Autorización: staff del ERP (Bearer) o llamada interna del cron (x-cron-secret).
// Cuerpo: { title, body, url?, onlyMe?, userId? }
//   - onlyMe: envía solo a los dispositivos del usuario que llama (para pruebas).
//   - userId: envía a un usuario específico.
//   - (sin ninguno): difunde a TODOS los dispositivos suscritos (todo el personal).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@healthathome.com";
  if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
    return json({ error: "Faltan variables del servidor (SUPABASE_* o VAPID_*)" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // --- Autorización ---
  let callerUserId: string | null = null;
  let authorized = false;
  const cronSecret = Deno.env.get("PUSH_CRON_SECRET");
  const providedCron = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (cronSecret && providedCron && providedCron === cronSecret) {
    authorized = true; // invocación interna (cron / servidor)
  } else if (authHeader.startsWith("Bearer ")) {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user) {
      // Solo staff del ERP (no pacientes del portal).
      const { data: portalRow } = await admin
        .from("patient_portal_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!portalRow) {
        authorized = true;
        callerUserId = user.id;
      }
    }
  }
  if (!authorized) return json({ error: "No autorizado" }, 401);

  // --- Cuerpo ---
  let body: { title?: string; body?: string; url?: string; userId?: string; onlyMe?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const title = body.title || "Health At Home";
  const message = body.body || "";
  const url = body.url || "/";

  // --- Destinatarios ---
  let query = admin.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (body.onlyMe) {
    if (!callerUserId) return json({ error: "onlyMe requiere sesión de usuario" }, 400);
    query = query.eq("user_id", callerUserId);
  } else if (body.userId) {
    query = query.eq("user_id", body.userId);
  }
  const { data: subs, error } = await query;
  if (error) return json({ error: error.message }, 500);
  if (!subs || subs.length === 0) return json({ ok: true, sent: 0, note: "Sin suscripciones" }, 200);

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({ title, body: message, url, data: { url } });

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    })
  );
  if (stale.length) await admin.from("push_subscriptions").delete().in("endpoint", stale);

  return json({ ok: true, sent, removed: stale.length }, 200);
});
