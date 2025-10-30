import { Navigate } from "react-router";
import { useAuthStore } from "~/store/authStore";
import MisExamenes from "~/dashboard/pacientes-portal/MisExamenes";

export default function PacientesLaboratorioMisExamenesRoute() {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73CBCF] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/pacientes/laboratorio/login" replace />;
  }

  return <MisExamenes />;
}

