// Edge Function: genera una nueva contraseña para la cuenta de portal del paciente
// y la devuelve para mostrarla en "Ver credenciales" (p. ej. desde el detalle de la orden).
// Solo staff puede llamarla. Body: { order_id: string }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      JSON.stringify({ error: "Solo el personal autorizado puede ver o restablecer credenciales" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Cuerpo JSON inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const orderId = body.order_id?.trim();
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: "Se requiere order_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: order, error: orderError } = await admin
    .from("lab_exam_orders")
    .select("patient_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order?.patient_id) {
    return new Response(
      JSON.stringify({ error: "Orden no encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: portalUser, error: portalError } = await admin
    .from("patient_portal_users")
    .select("dni, auth_user_id")
    .eq("patient_id", order.patient_id)
    .single();

  if (portalError || !portalUser) {
    return new Response(
      JSON.stringify({ error: "Este paciente no tiene cuenta de portal" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const newPassword = generatePassword();
  const { error: updateError } = await admin.auth.admin.updateUserById(portalUser.auth_user_id, {
    password: newPassword,
  });

  if (updateError) {
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ dni: portalUser.dni, password: newPassword }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
