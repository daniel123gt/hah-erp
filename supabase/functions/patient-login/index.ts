// Edge Function: login de pacientes por DNI + contraseña
// Resuelve DNI → login_email en servidor y devuelve la sesión para que la app la use con setSession.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { dni?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Cuerpo JSON inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const dni = typeof body.dni === "string" ? body.dni.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!dni || !password) {
    return new Response(
      JSON.stringify({ error: "Se requieren DNI y contraseña" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Configuración del servidor incompleta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: portalUser, error: lookupError } = await adminClient
    .from("patient_portal_users")
    .select("login_email")
    .eq("dni", dni)
    .single();

  if (lookupError || !portalUser?.login_email) {
    return new Response(
      JSON.stringify({ error: "Credenciales incorrectas" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const keyToUse = anonKey || serviceRoleKey;
  const authClient = createClient(supabaseUrl, keyToUse, { auth: { persistSession: false } });

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: portalUser.login_email,
    password,
  });

  if (authError) {
    return new Response(
      JSON.stringify({ error: "Credenciales incorrectas" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      session: authData.session,
      user: authData.user,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
