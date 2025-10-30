import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuthStore } from "~/store/authStore";
import supabase from "~/utils/supabase";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

export default function PacientesLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      setIsLoading(true);

      // IMPORTANTE: Cerrar cualquier sesión previa del dashboard antes de autenticar
      await supabase.auth.signOut();

      // Autenticar con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar que el usuario existe en la tabla de pacientes
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, email')
        .eq('email', email)
        .single();

      if (patientError || !patient) {
        // Si no es paciente, cerrar sesión y mostrar error
        await supabase.auth.signOut();
        throw new Error('Esta cuenta no está registrada como paciente. Por favor, contacta al administrador.');
      }

      // Guardar usuario en el store
      if (data.user) {
        login({
          id: data.user.id,
          email: data.user.email || email,
          user_metadata: data.user.user_metadata || {},
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        });

        toast.success("Inicio de sesión exitoso");
        navigate('/pacientes/laboratorio/mis-examenes');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      toast.error(error.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#1F3666] p-3 rounded-full">
              <FileText className="w-8 h-8 text-[#73CBCF]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1F3666]">
            Portal de Resultados
          </CardTitle>
          <CardDescription>
            Inicia sesión para ver tus resultados de laboratorio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1F3666]">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#73CBCF] focus:border-[#1F3666] focus:ring-[#73CBCF]"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1F3666]">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#73CBCF] focus:border-[#1F3666] focus:ring-[#73CBCF]"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#1F3666] hover:bg-[#3C5894] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              ¿Necesitas ayuda?{" "}
              <a href="mailto:support@healthathome.com" className="text-[#1F3666] hover:underline">
                Contacta al administrador
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

