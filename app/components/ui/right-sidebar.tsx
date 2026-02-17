import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Settings, Calendar, Hash, HeartPulse } from "lucide-react";
import { useAuthStore, getAppRole } from "~/store/authStore";
import { useNavigate } from "react-router";
import { appointmentsService } from "~/services/appointmentsService";

export function RightSidebar() {
  const { user } = useAuthStore();
  const role = getAppRole(user);
  const navigate = useNavigate();
  const [todayProcedimientos, setTodayProcedimientos] = useState<{ id: string; time: string; patientName: string; procedure_name?: string }[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    appointmentsService
      .list("procedimientos")
      .then((list) => list.filter((c) => c.date === today).sort((a, b) => a.time.localeCompare(b.time)))
      .then((filtered) =>
        setTodayProcedimientos(
          filtered.map((c) => ({
            id: c.id,
            time: c.time,
            patientName: c.patientName,
            procedure_name: c.procedure_name,
          }))
        )
      )
      .catch(() => setTodayProcedimientos([]));
  }, []);

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6">
      {/* Perfil del Usuario */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-blue">
            Perfil del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16" fallback={(user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}>
              <AvatarImage src="/avatar-placeholder.png" alt="Avatar" />
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.user_metadata?.full_name || "Usuario"}
              </h3>
              <Badge variant="secondary" className="bg-accent-blue text-white">
                {role === "gestor" ? "Gestor" : "Administrador"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Ingreso {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "Fecha no disponible"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Hash className="w-4 h-4" />
              <span>Código de empleado {user?.id?.slice(-8) || "N/A"}</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-3 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white"
              onClick={() => navigate("/mi-perfil")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Datos y configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Citas de procedimientos de hoy */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-blue flex items-center gap-2">
            <HeartPulse className="w-5 h-5" />
            Citas de procedimientos hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayProcedimientos.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No hay citas de procedimientos hoy.</p>
          ) : (
            todayProcedimientos.slice(0, 5).map((cita) => (
              <div key={cita.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{cita.patientName}</p>
                  <p className="text-xs text-gray-500">
                    {cita.time}
                    {cita.procedure_name ? ` · ${cita.procedure_name}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
          <Button
            variant="outline"
            className="w-full mt-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white"
            onClick={() => navigate("/citas/procedimientos")}
          >
            Ver todas las citas
          </Button>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <h4 className="font-medium text-blue-800">Health At Home ERP</h4>
            <p className="text-xs text-blue-600">v1.0.0 - Sistema de Gestión</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
