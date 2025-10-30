import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
  Plus, 
  Phone, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin,
  Heart,
  Activity,
  Stethoscope,
  AlertCircle
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

interface AddEmergencyModalProps {
  onEmergencyAdded: (emergency: Emergency) => void;
}

const emergencyTypes = [
  { value: "cardiac", label: "Cardíaco", icon: Heart, color: "bg-red-100 text-red-800" },
  { value: "respiratory", label: "Respiratorio", icon: Activity, color: "bg-blue-100 text-blue-800" },
  { value: "trauma", label: "Trauma", icon: AlertTriangle, color: "bg-orange-100 text-orange-800" },
  { value: "neurological", label: "Neurológico", icon: User, color: "bg-purple-100 text-purple-800" },
  { value: "other", label: "Otros", icon: Phone, color: "bg-gray-100 text-gray-800" }
];

const priorities = [
  { value: "critical", label: "Crítico", color: "bg-red-100 text-red-800" },
  { value: "urgent", label: "Urgente", color: "bg-orange-100 text-orange-800" },
  { value: "moderate", label: "Moderado", color: "bg-yellow-100 text-yellow-800" },
  { value: "low", label: "Bajo", color: "bg-green-100 text-green-800" }
];

const statuses = [
  { value: "active", label: "Activo", color: "bg-red-100 text-red-800" },
  { value: "in_progress", label: "En Proceso", color: "bg-blue-100 text-blue-800" },
  { value: "resolved", label: "Resuelto", color: "bg-green-100 text-green-800" },
  { value: "transferred", label: "Transferido", color: "bg-purple-100 text-purple-800" }
];

const mockStaff = [
  { name: "Dr. Roberto Silva", specialty: "Medicina General" },
  { name: "Dra. Elena Morales", specialty: "Enfermería" },
  { name: "Dr. Carlos Mendoza", specialty: "Cardiología" },
  { name: "Lic. Miguel Torres", specialty: "Emergencias" },
  { name: "Dra. Ana García", specialty: "Neurología" }
];

export function AddEmergencyModal({ onEmergencyAdded }: AddEmergencyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientAge: 0,
    emergencyType: "cardiac" as const,
    priority: "critical" as const,
    status: "active" as const,
    reportedAt: new Date().toISOString(),
    assignedTo: "",
    location: "",
    symptoms: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEmergency: Emergency = {
      id: `EMG${Date.now()}`,
      ...formData
    };

    onEmergencyAdded(newEmergency);
    setIsOpen(false);
    setFormData({
      patientName: "",
      patientPhone: "",
      patientAge: 0,
      emergencyType: "cardiac",
      priority: "critical",
      status: "active",
      reportedAt: new Date().toISOString(),
      assignedTo: "",
      location: "",
      symptoms: "",
      notes: ""
    });
  };

  const getPriorityBadge = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return (
      <Badge className={priorityObj?.color || "bg-gray-100 text-gray-800"}>
        {priorityObj?.label || priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return (
      <Badge className={statusObj?.color || "bg-gray-100 text-gray-800"}>
        {statusObj?.label || status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeObj = emergencyTypes.find(t => t.value === type);
    const IconComponent = typeObj?.icon || Phone;
    return <IconComponent className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const typeObj = emergencyTypes.find(t => t.value === type);
    return typeObj?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Emergencia
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-600">
            Reportar Nueva Emergencia
          </DialogTitle>
          <DialogDescription>
            Complete la información para reportar una emergencia médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-red-600" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Paciente *
                </label>
                <Input
                  value={formData.patientName}
                  onChange={(e) => handleInputChange("patientName", e.target.value)}
                  placeholder="Nombre completo del paciente"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange("patientPhone", e.target.value)}
                    className="pl-10"
                    placeholder="+51 999 123 456"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad *
                </label>
                <Input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => handleInputChange("patientAge", parseInt(e.target.value) || 0)}
                  min="0"
                  max="120"
                  placeholder="Edad en años"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="pl-10"
                    placeholder="Dirección o ubicación del paciente"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo y Prioridad de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Clasificación de la Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Emergencia *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {emergencyTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleInputChange("emergencyType", type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.emergencyType === type.value
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <div className="space-y-2">
                    {priorities.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => handleInputChange("priority", priority.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          formData.priority === priority.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{priority.label}</span>
                          <Badge className={priority.color}>
                            {priority.label}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Síntomas Principales *
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange("symptoms", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Describa los síntomas principales del paciente..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={2}
                    placeholder="Información adicional relevante..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asignación y Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-red-600" />
                Asignación y Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar a
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccionar personal médico</option>
                  {mockStaff.map((staff) => (
                    <option key={staff.name} value={staff.name}>
                      {staff.name} - {staff.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de la Emergencia */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <AlertCircle className="w-5 h-5" />
                Resumen de la Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Paciente:</p>
                  <p className="font-medium">{formData.patientName || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Edad:</p>
                  <p className="font-medium">{formData.patientAge || 0} años</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Emergencia:</p>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(formData.emergencyType)}
                    <Badge className={getTypeColor(formData.emergencyType)}>
                      {emergencyTypes.find(t => t.value === formData.emergencyType)?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prioridad:</p>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(formData.priority)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado:</p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(formData.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asignado a:</p>
                  <p className="font-medium">{formData.assignedTo || "No asignado"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Síntomas:</p>
                  <p className="font-medium">{formData.symptoms || "No especificados"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700"
            >
              Reportar Emergencia
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
