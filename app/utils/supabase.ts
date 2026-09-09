import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL no está definida en las variables de entorno');
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Refresca el token de acceso automáticamente antes de que expire.
    autoRefreshToken: true,
    // Persiste la sesión en el almacenamiento del navegador.
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;