import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "~/store/authStore";
import { Button } from "~/components/ui/button";
import { LogOut, FileText } from "lucide-react";
import supabase from "~/utils/supabase";

export default function PacientesPortalLayout() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error);
      }
      // Limpiar el store
      logout();
      navigate('/pacientes/laboratorio/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      logout();
      navigate('/pacientes/laboratorio/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2FEFF] via-white to-[#F2FEFF]">
      {/* Header Minimalista */}
      <header className="bg-[#1F3666] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#73CBCF]" />
              <h1 className="text-xl font-bold">Portal de Resultados de Laboratorio</h1>
            </div>
            {isAuthenticated && user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#73CBCF]">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-white hover:bg-[#3C5894] hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer Minimalista */}
      <footer className="bg-[#1F3666] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-[#73CBCF]">
            © {new Date().getFullYear()} Health at Home - Portal de Pacientes
          </p>
        </div>
      </footer>
    </div>
  );
}

