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
import { 
  Eye, 
  Phone, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin,
  Heart,
  Activity,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar
} from "lucide-react";

interface Emergency {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  emergencyType: "cardiac" | "respiratory" | "trauma" | "neurological" | "other";
  priority: "critical" | "urgent" | "moderate" | "low";
  status: "active" | "in_progress" | "resolved" | "transferred";
  reportedAt: string;
  assignedTo?: string;
  location: string;
  symptoms: string;
  notes?: string;
  responseTime?: number;
}

interface ViewEmergencyModalProps {
  emergency: Emergency;
}

export function ViewEmergencyModal({ emergency }: ViewEmergencyModalProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case "urgent":
        return <Badge className="bg-orange-100 text-orange-800">Urgente</Badge>;
      case "moderate":
        return <Badge className="bg-yellow-100 text-yellow-800">Moderado</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Bajo</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-100 text-red-800">Activo</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
      case "transferred":
        return <Badge className="bg-purple-100 text-purple-800">Transferido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cardiac":
        return <Heart className="w-5 h-5 text-red-600" />;
      case "respiratory":
        return <Activity className="w-5 h-5 text-blue-600" />;
      case "trauma":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "neurological":
        return <User className="w-5 h-5 text-purple-600" />;
      default:
        return <Phone className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cardiac":
        return "bg-red-100 text-red-800";
      case "respiratory":
        return "bg-blue-100 text-blue-800";
      case "trauma":
        return "bg-orange-100 text-orange-800";
      case "neurological":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cardiac":
        return "Cardíaco";
      case "respiratory":
        return "Respiratorio";
      case "trauma":
        return "Trauma";
      case "neurological":
        return "Neurológico";
      default:
        return "Otros";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (dateString: string) => {
    const now = new Date();
    const reported = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - reported.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hora(s)`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} día(s)`;
    }
  };

  const isUrgent = () => {
    return emergency.priority === "critical" || emergency.priority === "urgent";
  };

  const isActive = () => {
    return emergency.status === "active" || emergency.status === "in_progress";
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
          <DialogTitle className="text-2xl font-bold text-red-600">
            Emergencia {emergency.id}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la emergencia médica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className={`${isUrgent() ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${isUrgent() ? 'bg-red-100' : 'bg-blue-100'} rounded-full`}>
                    <AlertTriangle className={`w-6 h-6 ${isUrgent() ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {emergency.patientName}
                    </h3>
                    <p className="text-gray-600">ID: {emergency.id}</p>
                    <p className="text-sm text-gray-500">
                      Reportado hace {getTimeElapsed(emergency.reportedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getTypeIcon(emergency.emergencyType)}
                  {getPriorityBadge(emergency.priority)}
                  {getStatusBadge(emergency.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-red-600" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {emergency.patientName}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{emergency.patientAge} años</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{emergency.patientPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{emergency.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clasificación de la Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Clasificación de la Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getTypeIcon(emergency.emergencyType)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <Badge className={getTypeColor(emergency.emergencyType)}>
                    {getTypeLabel(emergency.emergencyType)}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Prioridad</p>
                  {getPriorityBadge(emergency.priority)}
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  {getStatusBadge(emergency.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Síntomas y Descripción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-red-600" />
                Síntomas y Descripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas Principales
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{emergency.symptoms}</p>
                  </div>
                </div>
                {emergency.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Adicionales
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{emergency.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-red-600" />
                Información de Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Asignado a</p>
                  <p className="font-medium">
                    {emergency.assignedTo || "No asignado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                  <p className="font-medium">
                    {emergency.responseTime ? `${emergency.responseTime} minutos` : "No registrado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Temporal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-red-600" />
                Información Temporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora de Reporte</p>
                  <p className="font-medium">{formatDateTime(emergency.reportedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo Transcurrido</p>
                  <p className="font-medium text-orange-600">
                    {getTimeElapsed(emergency.reportedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Historial de Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Emergencia reportada</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(emergency.reportedAt)} - Sistema
                    </p>
                  </div>
                </div>
                {emergency.assignedTo && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Asignado a {emergency.assignedTo}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(emergency.reportedAt)} - Sistema
                      </p>
                    </div>
                  </div>
                )}
                {emergency.status === "in_progress" && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Emergencia en proceso</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(emergency.reportedAt)} - {emergency.assignedTo}
                      </p>
                    </div>
                  </div>
                )}
                {emergency.status === "resolved" && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Emergencia resuelta</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(emergency.reportedAt)} - {emergency.assignedTo}
                      </p>
                    </div>
                  </div>
                )}
                {emergency.status === "transferred" && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Paciente transferido</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(emergency.reportedAt)} - {emergency.assignedTo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alertas y Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Alertas y Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isUrgent() && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">¡Emergencia de Alta Prioridad!</p>
                      <p className="text-xs text-red-600">Requiere atención inmediata</p>
                    </div>
                  </div>
                )}
                {isActive() && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Emergencia Activa</p>
                      <p className="text-xs text-orange-600">Requiere seguimiento continuo</p>
                    </div>
                  </div>
                )}
                {!emergency.assignedTo && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <User className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Sin Asignar</p>
                      <p className="text-xs text-yellow-600">Asignar personal médico</p>
                    </div>
                  </div>
                )}
                {emergency.emergencyType === "cardiac" && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <Heart className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Emergencia Cardíaca</p>
                      <p className="text-xs text-red-600">Monitorear constantemente</p>
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
