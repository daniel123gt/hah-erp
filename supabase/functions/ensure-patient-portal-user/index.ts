// Edge Function: asegurar que un paciente tenga cuenta de portal (para login por nro. documento).
// El ERP la llama al crear una orden. Crea usuario en Auth + fila en patient_portal_users si no existe.
// Solo staff puede llamarla: Authorization: Bearer <access_token> del usuario logueado en el ERP.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Se requiere autorización (Bearer token)" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Configuración del servidor incompleta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await authClient.auth.getUser();
  if (!caller) {
    return new Response(
      JSON.stringify({ error: "Token inválido o expirado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: portalRow } = await admin
    .from("patient_portal_users")
    .select("id")
    .eq("auth_user_id", caller.id)
    .single();
  if (portalRow) {
    return new Response(
      JSON.stringify({ error: "Solo el personal autorizado puede crear cuentas de portal" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    patient_id?: string;
    dni?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Cuerpo JSON inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const patientId = body.patient_id?.trim();
  const dni = body.dni?.trim();
  const fullName = body.full_name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const password = body.password?.trim();

  if (!patientId || !dni || !fullName) {
    return new Response(
      JSON.stringify({ error: "Se requieren patient_id, dni y full_name" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!password || password.length < 6) {
    return new Response(
      JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: existing } = await admin
    .from("patient_portal_users")
    .select("id, login_email")
    .eq("patient_id", patientId)
    .single();

  if (existing) {
    return new Response(
      JSON.stringify({ ok: true, already_exists: true, login_email: existing.login_email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: dniTaken } = await admin
    .from("patient_portal_users")
    .select("id")
    .eq("dni", dni)
    .maybeSingle();

  if (dniTaken) {
    return new Response(
      JSON.stringify({ error: "Este DNI ya está registrado para otro paciente en el portal." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const loginEmail =
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email
      : `dni_${dni}@pacientes.healthathome.com`;

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, dni, phone },
  });

  if (createError) {
    return new Response(
      JSON.stringify({ error: createError.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error: insertError } = await admin.from("patient_portal_users").insert({
    patient_id: patientId,
    auth_user_id: newUser.user.id,
    dni,
    login_email: loginEmail,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(newUser.user.id);
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      already_exists: false,
      login_email: loginEmail,
      auth_user_id: newUser.user.id,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
