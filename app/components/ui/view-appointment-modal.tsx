import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  duration: number;
  type: "consulta" | "examen" | "emergencia" | "seguimiento" | "procedimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
  procedure_name?: string;
}

interface ViewAppointmentModalProps {
  appointment: Appointment;
  /** Etiqueta del profesional: "Médico" o "Enfermera" */
  professionalLabel?: string;
}

export function ViewAppointmentModal({ appointment, professionalLabel = "Médico" }: ViewAppointmentModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completada</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case "no-show":
        return <Badge className="bg-orange-100 text-orange-800">No Asistió</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string, procedureName?: string) => {
    if (type === "procedimiento") {
      return <Badge className="bg-teal-100 text-teal-800">{procedureName || "Procedimiento"}</Badge>;
    }
    switch (type) {
      case "consulta":
        return <Badge className="bg-blue-100 text-blue-800">Consulta</Badge>;
      case "examen":
        return <Badge className="bg-purple-100 text-purple-800">Examen</Badge>;
      case "emergencia":
        return <Badge className="bg-red-100 text-red-800">Emergencia</Badge>;
      case "seguimiento":
        return <Badge className="bg-green-100 text-green-800">Seguimiento</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "no-show":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
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
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Detalles de la Cita
          </DialogTitle>
          <DialogDescription>
            Información completa de la cita médica programada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-blue/10 rounded-full">
                    <Calendar className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-blue">
                      Cita #{appointment.id}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(appointment.date)} a las {formatTime(appointment.time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(appointment.status)}
                  {getStatusBadge(appointment.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary-blue" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="" alt={appointment.patientName} />
                  <AvatarFallback className="bg-primary-blue text-white text-lg">
                    {appointment.patientName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {appointment.patientName}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{appointment.patientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{appointment.patientPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del profesional (Médico/Enfermera) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                {professionalLabel} asignad{professionalLabel === "Médico" ? "o" : "a"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" alt={appointment.doctorName} />
                  <AvatarFallback className="bg-green-100 text-green-800">
                    {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {appointment.doctorName}
                  </h4>
                  <p className="text-gray-600">{appointment.doctorSpecialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la Cita */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Detalles de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha y Hora
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {formatDate(appointment.date)} a las {formatTime(appointment.time)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración
                    </label>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{appointment.duration} minutos</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{appointment.location}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cita
                    </label>
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(appointment.type, appointment.procedure_name)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appointment.status)}
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          {appointment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary-blue" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{appointment.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Actividad (Mock) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-primary-blue" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Cita programada</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appointment.date).toLocaleDateString('es-ES')} - Sistema
                    </p>
                  </div>
                </div>
                {appointment.status === "confirmed" && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cita confirmada</p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('es-ES')} - Sistema
                      </p>
                    </div>
                  </div>
                )}
                {appointment.status === "completed" && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cita completada</p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('es-ES')} - Dr. {appointment.doctorName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
