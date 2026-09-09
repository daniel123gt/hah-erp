import supabase from "~/utils/supabase";
import { authSignals } from "~/lib/authSignals";

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error("Error en signInWithEmail:", error);
    return { 
      data: null, 
      error: { 
        message: "Error de conexión con el servidor" 
      } 
    };
  }
};

export const logout = async () => {
  // Marca que este cierre de sesión es intencional (para no mostrar "sesión expirada").
  authSignals.manualLogout = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Auth session missing") || msg.includes("AuthSessionMissingError")) {
      return { success: true };
    }
    console.error("Error en logout:", error);
    return { success: true };
  }
};
