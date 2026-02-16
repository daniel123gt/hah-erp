/**
 * Servicio para crear/asegurar cuenta de portal del paciente (login por nro. documento).
 * Llama a la Edge Function ensure-patient-portal-user con el JWT del usuario ERP (staff).
 */

import supabase from "~/utils/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface EnsurePortalUserParams {
  patient_id: string;
  dni: string;
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface EnsurePortalUserResult {
  ok: boolean;
  already_exists?: boolean;
  login_email?: string;
  auth_user_id?: string;
  error?: string;
}

function getFunctionsUrl(): string {
  if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL no definida");
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1`;
}

/** Genera una contraseña aleatoria de 8 caracteres (letras y números). */
export function generatePortalPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Asegura que el paciente tenga cuenta de portal. Solo staff (no pacientes) puede llamar.
 * Requiere sesión activa del ERP (Authorization: Bearer access_token).
 */
export async function ensurePatientPortalUser(
  params: EnsurePortalUserParams
): Promise<EnsurePortalUserResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Debes iniciar sesión en el ERP para crear cuentas de portal");
  }

  const url = `${getFunctionsUrl()}/ensure-patient-portal-user`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patient_id: params.patient_id,
        dni: params.dni.trim(),
        full_name: params.full_name.trim(),
        email: params.email?.trim() || undefined,
        phone: params.phone?.trim() || undefined,
        password: params.password,
      }),
    });
  } catch (err: any) {
    return { ok: false, error: err?.message || "Error de red. ¿Está desplegada la Edge Function ensure-patient-portal-user?" };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data?.error || `Error ${res.status}` };
  }

  return {
    ok: true,
    already_exists: data.already_exists,
    login_email: data.login_email,
    auth_user_id: data.auth_user_id,
  };
}

/**
 * Obtiene o genera una nueva contraseña para la cuenta de portal del paciente
 * asociada a una orden. Para usar en "Ver credenciales" desde el detalle de la orden.
 * La contraseña se regenera cada vez (el paciente debe usar la última que se mostró).
 */
export async function getPortalCredentialsByOrder(
  orderId: string
): Promise<{ dni: string; password: string } | { error: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "Debes iniciar sesión en el ERP" };
  }

  const url = `${getFunctionsUrl()}/reset-patient-portal-password`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: orderId }),
    });
  } catch (err: any) {
    return { error: err?.message || "Error de red. ¿Está desplegada la Edge Function reset-patient-portal-password?" };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: data?.error || `Error ${res.status}` };
  }

  if (data.dni && data.password) {
    return { dni: data.dni, password: data.password };
  }
  return { error: "Respuesta inválida del servidor" };
}
