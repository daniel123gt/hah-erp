import supabase from "~/utils/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Convierte la clave pública VAPID (base64url) al formato que espera pushManager.subscribe. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY);
}

/**
 * Suscribe ESTE dispositivo a notificaciones push y guarda la suscripción en la BD.
 * Requiere que el permiso de notificaciones ya esté concedido.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn("VITE_VAPID_PUBLIC_KEY no configurada: push deshabilitado.");
    return false;
  }
  if (Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
    if (error) {
      console.error("Error guardando suscripción push:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error al suscribir a push:", e);
    return false;
  }
}

/** Cancela la suscripción push de este dispositivo y la borra del servidor. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }
  } catch (e) {
    console.error("Error al desuscribir push:", e);
  }
}

/** Envía una notificación push de prueba a este usuario (para verificar la Fase 2). */
export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        title: "Notificación de prueba ✅",
        body: "Si ves esto con la app cerrada, el push funciona.",
        onlyMe: true,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, ...(data as object) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
