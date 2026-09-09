import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import supabase from "~/utils/supabase";
import { useAuthStore } from "~/store/authStore";
import { authSignals } from "~/lib/authSignals";

/**
 * Mantiene sincronizada la sesión real de Supabase con el estado de la app.
 *
 * Problema que resuelve: el guard de la app usa un store persistido (Zustand)
 * que puede quedar "autenticado" aunque el token de Supabase haya expirado y no
 * se pueda refrescar. En ese caso las consultas con RLS empiezan a devolver
 * vacío y el usuario ve información incompleta sin darse cuenta.
 *
 * Solución: si la sesión de Supabase se pierde o no se puede refrescar, se
 * cierra la sesión de la app automáticamente y se envía al login para que el
 * usuario vuelva a identificarse.
 */
export function SessionWatcher() {
  const navigate = useNavigate();
  const loggingOut = useRef(false);

  useEffect(() => {
    const forceExpiredLogout = async () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      useAuthStore.getState().logout();
      toast.error("Tu sesión expiró. Por favor, inicia sesión nuevamente.");
      navigate("/login", { replace: true });
    };

    // Revisa que siga habiendo una sesión válida de Supabase. Si el token está
    // por expirar/expirado, intenta refrescarlo explícitamente y solo cierra
    // sesión si el refresh realmente falla (no por un token aún válido).
    const checkSession = async () => {
      if (!useAuthStore.getState().isAuthenticated || loggingOut.current) return;
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) {
          await forceExpiredLogout();
          return;
        }
        const expiresAtMs = (session.expires_at ?? 0) * 1000;
        // Si expira dentro de 60s (o ya expiró), forzar refresh.
        if (expiresAtMs && expiresAtMs < Date.now() + 60_000) {
          const { data: refreshed, error } = await supabase.auth.refreshSession();
          if (error || !refreshed.session) await forceExpiredLogout();
        }
      } catch {
        await forceExpiredLogout();
      }
    };

    // 1) Al montar (cubre el caso de sesión muerta mientras la app estuvo cerrada).
    checkSession();

    // 2) Eventos de auth de Supabase.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Si fue un logout manual, el propio flujo ya redirige: no avisar de expiración.
        if (authSignals.manualLogout) {
          authSignals.manualLogout = false;
          return;
        }
        forceExpiredLogout();
      } else if (event === "TOKEN_REFRESHED" && !session) {
        // El refresh se intentó pero no hay sesión: token inválido/expirado.
        forceExpiredLogout();
      }
    });

    // 3) Al volver a la pestaña, revalidar (fuerza refresh si estuvo idle).
    const onFocusOrVisible = () => {
      if (!document.hidden) checkSession();
    };
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    // 4) Chequeo periódico como red de seguridad (pestañas siempre abiertas).
    const interval = window.setInterval(checkSession, 5 * 60 * 1000);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.clearInterval(interval);
    };
  }, [navigate]);

  return null;
}
