import { useState, useEffect } from "react";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { formatDateOnly, parseDateOnlyAsLocal } from "~/lib/dateUtils";
import { getStaffActivity, type StaffActivityItem } from "~/services/staffActivityService";
import { 
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Stethoscope,
  Eye,
  Clock,
  GraduationCap,
  Building,
  Loader2,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "vacation";
  salary: number;
  avatar?: string;
  specialties?: string[];
  schedule?: string;
}

interface ViewStaffModalProps {
  staff: Staff;
}

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  cita_medicina: "bg-blue-500",
  cita_procedimiento: "bg-green-500",
  turno_cuidado: "bg-amber-500",
  eliminacion: "bg-purple-500",
  valoracion: "bg-cyan-500",
  evolucion: "bg-indigo-500",
  signos_vitales: "bg-teal-500",
};

export function ViewStaffModal({ staff }: ViewStaffModalProps) {
  const [activities, setActivities] = useState<StaffActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (!staff?.name) return;
    setLoadingActivities(true);
    getStaffActivity(staff.name)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, [staff?.name]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case "vacation":
        return <Badge className="bg-blue-100 text-blue-800">Vacaciones</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Medicina":
        return "bg-blue-100 text-blue-800";
      case "Enfermeria":
        return "bg-green-100 text-green-800";
      case "Administracion":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateYearsOfService = (hireDate: string) => {
    const years = (new Date().getTime() - parseDateOnlyAsLocal(hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(years);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue flex items-center">
            <UserCheck className="w-6 h-6 mr-2" />
            Información del Empleado
          </DialogTitle>
          <DialogDescription>
            Detalles completos del empleado {staff.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con información principal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={staff.avatar} alt={staff.name} />
                  <AvatarFallback className="bg-primary-blue text-white text-xl font-bold">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
                  <p className="text-gray-600">ID: {staff.id}</p>
                  <p className="text-gray-600">{staff.position}</p>
                  <div className="mt-2">
                    {getStatusBadge(staff.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Años de servicio</p>
                <p className="text-2xl font-bold text-primary-blue">
                  {calculateYearsOfService(staff.hireDate)}
                </p>
                <p className="text-sm text-gray-500">
                  Desde {parseDateOnlyAsLocal(staff.hireDate).toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Información Personal y Laboral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-primary-blue" />
                Información Personal
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{staff.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Teléfono:</span>
                  <p className="font-medium">{staff.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Building className="w-5 h-5 mr-2 text-primary-blue" />
                Información Laboral
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Posición:</span>
                  <p className="font-medium">{staff.position}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Departamento:</span>
                  <div className="mt-1">
                    <Badge className={getDepartmentColor(staff.department)}>
                      {staff.department}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha de Contratación:</span>
                  <p className="font-medium">
                    {formatDateOnly(staff.hireDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-blue" />
                Información Económica
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Salario:</span>
                  <p className="font-medium text-lg">S/ {staff.salary.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estado:</span>
                  <div className="mt-1">
                    {getStatusBadge(staff.status)}
                  </div>
                </div>
                {staff.schedule && (
                  <div>
                    <span className="text-sm text-gray-500">Horario:</span>
                    <p className="font-medium text-sm">{staff.schedule}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Especialidades */}
          {staff.specialties && staff.specialties.length > 0 && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-primary-blue" />
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {staff.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-blue-600 border-blue-200">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actividad reciente (citas, turnos, registros de enfermería) */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-blue" />
              Actividad Reciente
            </h3>
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Cargando actividad...
              </div>
            ) : activities.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No hay actividad registrada para este empleado.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_TYPE_COLOR[act.type] ?? "bg-gray-500"}`}
                      />
                      <div>
                        <p className="font-medium">{act.description}</p>
                        <p className="text-sm text-gray-500">
                          {act.typeLabel}
                          {act.extra ? ` · ${act.extra}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-medium">{formatDateOnly(act.date)}</p>
                      {act.time && <p className="text-xs text-gray-500">{act.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Horario
            </Button>
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Ver Nómina
            </Button>
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <UserCheck className="w-4 h-4 mr-2" />
              Editar Empleado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
