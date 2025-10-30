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
  FlaskConical, 
  Clock, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Beaker
} from "lucide-react";

interface LabTest {
  id: string;
  patientName: string;
  patientEmail: string;
  testName: string;
  category: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "critical";
  priority: "low" | "medium" | "high" | "urgent";
  requestedBy: string;
  requestedDate: string;
  completedDate?: string;
  result?: string;
  notes?: string;
  price: number;
}

interface ViewLabTestModalProps {
  labTest: LabTest;
}

export function ViewLabTestModal({ labTest }: ViewLabTestModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Baja</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800">Media</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "in_progress":
        return <Beaker className="w-5 h-5 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
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
            Examen de Laboratorio #{labTest.id}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del examen de laboratorio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-blue/10 rounded-full">
                    <FlaskConical className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-blue">
                      {labTest.testName}
                    </h3>
                    <p className="text-gray-600">ID: {labTest.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(labTest.status)}
                  {getStatusBadge(labTest.status)}
                  {getPriorityBadge(labTest.priority)}
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
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {labTest.patientName}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{labTest.patientEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Examen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-primary-blue" />
                Información del Examen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Examen
                    </label>
                    <p className="font-medium text-gray-900">{labTest.testName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <Badge className="bg-blue-100 text-blue-800">
                      {labTest.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-lg text-green-600">
                        S/ {labTest.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Solicitado por
                    </label>
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{labTest.requestedBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Solicitud</p>
                  <p className="font-medium">{formatDate(labTest.requestedDate)}</p>
                </div>
                {labTest.completedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Completado</p>
                    <p className="font-medium">{formatDate(labTest.completedDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {labTest.result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary-blue" />
                  Resultados del Examen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{labTest.result}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas Adicionales */}
          {labTest.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-primary-blue" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{labTest.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                Historial de Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Examen solicitado</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(labTest.requestedDate)} - {labTest.requestedBy}
                    </p>
                  </div>
                </div>
                {labTest.status === "in_progress" && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Examen en proceso</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(labTest.requestedDate)} - Laboratorio
                      </p>
                    </div>
                  </div>
                )}
                {labTest.status === "completed" && labTest.completedDate && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Examen completado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(labTest.completedDate)} - Laboratorio
                      </p>
                    </div>
                  </div>
                )}
                {labTest.status === "critical" && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Resultado crítico detectado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(labTest.requestedDate)} - Laboratorio
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información Técnica (Mock) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beaker className="w-5 h-5 text-primary-blue" />
                Información Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Método de Análisis</p>
                  <p className="font-medium">Espectrofotometría</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo de Procesamiento</p>
                  <p className="font-medium">2-4 horas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Volumen de Muestra</p>
                  <p className="font-medium">2-5 ml</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Muestra</p>
                  <p className="font-medium">Sangre venosa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
