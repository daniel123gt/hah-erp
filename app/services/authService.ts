import supabase from "~/utils/supabase";

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
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error en logout:", error);
    throw error;
  }
};
