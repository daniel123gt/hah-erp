import { Badge } from "./badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Droplets,
  AlertTriangle,
  Eye,
  X
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  lastVisit: string;
  status: "active" | "inactive" | "pending";
  bloodType?: string;
  allergies?: string[];
}

interface ViewPatientModalProps {
  patient: Patient;
}

export function ViewPatientModal({ patient }: ViewPatientModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-gray-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
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
            <User className="w-6 h-6 mr-2" />
            Información del Paciente
          </DialogTitle>
          <DialogDescription>
            Detalles completos del paciente {patient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con información principal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                  <p className="text-gray-600">ID: {patient.id}</p>
                  <div className="mt-2">
                    {getStatusBadge(patient.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Última visita</p>
                <p className="font-semibold text-gray-900">
                  {new Date(patient.lastVisit).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-blue" />
                Información Personal
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Edad:</span>
                  <p className="font-medium">{patient.age} años</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Género:</span>
                  <p className="font-medium">{patient.gender}</p>
                </div>
                {patient.bloodType && (
                  <div>
                    <span className="text-sm text-gray-500">Tipo de Sangre:</span>
                    <p className="font-medium flex items-center">
                      <Droplets className="w-4 h-4 mr-1 text-red-500" />
                      {patient.bloodType}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary-blue" />
                Información de Contacto
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{patient.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Teléfono:</span>
                  <p className="font-medium">{patient.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Dirección:</span>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-primary-blue" />
                Información Médica
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Estado:</span>
                  <div className="mt-1">
                    {getStatusBadge(patient.status)}
                  </div>
                </div>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div>
                    <span className="text-sm text-gray-500">Alergias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="text-red-600 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-gray-500">Alergias:</span>
                    <p className="font-medium text-gray-400">Ninguna registrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Historial de Visitas (simulado) */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-blue" />
              Historial de Visitas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Consulta General</p>
                    <p className="text-sm text-gray-500">Dr. Roberto Silva</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{new Date(patient.lastVisit).toLocaleDateString('es-ES')}</p>
                  <p className="text-xs text-gray-500">10:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Examen de Laboratorio</p>
                    <p className="text-sm text-gray-500">Hemograma Completo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(new Date(patient.lastVisit).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-xs text-gray-500">09:15 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <User className="w-4 h-4 mr-2" />
              Editar Paciente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
