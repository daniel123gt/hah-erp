import { useState, useEffect } from "react";
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
  Edit, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  AlertCircle
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
  type: "consulta" | "examen" | "emergencia" | "seguimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
}

interface EditAppointmentModalProps {
  appointment: Appointment;
  onAppointmentUpdated: (appointment: Appointment) => void;
}

const mockDoctors = [
  { name: "Dr. Roberto Silva", specialty: "Medicina General" },
  { name: "Dra. Elena Morales", specialty: "Enfermería" },
  { name: "Dr. Carlos Mendoza", specialty: "Cardiología" },
  { name: "Lic. Miguel Torres", specialty: "Laboratorio" }
];

const mockPatients = [
  { name: "María González", email: "maria.gonzalez@email.com", phone: "+51 999 123 456" },
  { name: "Carlos Rodríguez", email: "carlos.rodriguez@email.com", phone: "+51 999 234 567" },
  { name: "Ana Torres", email: "ana.torres@email.com", phone: "+51 999 345 678" },
  { name: "Luis Mendoza", email: "luis.mendoza@email.com", phone: "+51 999 456 789" }
];

const locations = [
  "Consultorio 1",
  "Consultorio 2", 
  "Consultorio 3",
  "Laboratorio",
  "Sala de Emergencias",
  "Sala de Exámenes"
];

export function EditAppointmentModal({ appointment, onAppointmentUpdated }: EditAppointmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Appointment>(appointment);

  useEffect(() => {
    setFormData(appointment);
  }, [appointment]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDoctorChange = (doctorName: string) => {
    const doctor = mockDoctors.find(d => d.name === doctorName);
    setFormData(prev => ({
      ...prev,
      doctorName,
      doctorSpecialty: doctor?.specialty || ""
    }));
  };

  const handlePatientChange = (patientName: string) => {
    const patient = mockPatients.find(p => p.name === patientName);
    setFormData(prev => ({
      ...prev,
      patientName,
      patientEmail: patient?.email || prev.patientEmail,
      patientPhone: patient?.phone || prev.patientPhone
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAppointmentUpdated(formData);
    setIsOpen(false);
  };

  const getTypeBadge = (type: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Editar Cita #{appointment.id}
          </DialogTitle>
          <DialogDescription>
            Modifique la información de la cita médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary-blue" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  value={formData.patientName}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {mockPatients.map((patient) => (
                    <option key={patient.name} value={patient.name}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => handleInputChange("patientEmail", e.target.value)}
                    className="pl-10"
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange("patientPhone", e.target.value)}
                    className="pl-10"
                    placeholder="+51 999 123 456"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Cita */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Detalles de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 30)}
                  min="15"
                  max="180"
                  step="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cita *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="consulta">Consulta</option>
                  <option value="examen">Examen</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="scheduled">Programada</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="no-show">No Asistió</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                Doctor Asignado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor *
                </label>
                <select
                  value={formData.doctorName}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar doctor</option>
                  {mockDoctors.map((doctor) => (
                    <option key={doctor.name} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <Input
                  value={formData.doctorSpecialty}
                  onChange={(e) => handleInputChange("doctorSpecialty", e.target.value)}
                  placeholder="Especialidad médica"
                  readOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Notas adicionales sobre la cita..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Cambios */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Paciente:</p>
                  <p className="font-medium">{formData.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor:</p>
                  <p className="font-medium">{formData.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora:</p>
                  <p className="font-medium">
                    {formData.date && formData.time 
                      ? `${new Date(formData.date).toLocaleDateString('es-ES')} a las ${formData.time}`
                      : "No seleccionado"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo y Estado:</p>
                  <div className="flex gap-2">
                    {formData.type && getTypeBadge(formData.type)}
                    {formData.status && (
                      <Badge className="bg-gray-100 text-gray-800">
                        {formData.status === "scheduled" ? "Programada" :
                         formData.status === "confirmed" ? "Confirmada" :
                         formData.status === "completed" ? "Completada" :
                         formData.status === "cancelled" ? "Cancelada" : "No Asistió"}
                      </Badge>
                    )}
                  </div>
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
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
