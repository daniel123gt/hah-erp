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
import { Combobox } from "~/components/ui/combobox";
import { patientsService, type Patient } from "~/services/patientsService";
import { procedureService } from "~/services/procedureService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";
import { 
  Plus, 
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
  type: "consulta" | "examen" | "emergencia" | "seguimiento" | "procedimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
  patient_id?: string;
  procedure_catalog_id?: string;
  procedure_name?: string;
}

interface AddAppointmentModalProps {
  onAppointmentAdded: (appointment: Appointment) => void;
  /** "medicina" = médico, "procedimientos" = enfermera */
  variant?: "medicina" | "procedimientos";
  defaultLocation?: string;
}

export function AddAppointmentModal({
  onAppointmentAdded,
  variant = "medicina",
}: AddAppointmentModalProps) {
  const professionalLabel = variant === "procedimientos" ? "Enfermera" : "Médico";

  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [professionals, setProfessionals] = useState<{ name: string; specialty: string }[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [procedureCatalog, setProcedureCatalog] = useState<{ id: string; name: string; base_price_soles: number }[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    doctorName: "",
    doctorSpecialty: "",
    date: "",
    time: "",
    duration: 30,
    type: "consulta" as "consulta" | "examen" | "emergencia" | "seguimiento" | "procedimiento",
    status: "scheduled" as const,
    notes: "",
    location: "",
    procedureCatalogId: "",
    procedureName: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoadingPatients(true);
    patientsService
      .getPatients({ limit: 500 })
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const department = variant === "procedimientos"
      ? getDepartmentForCategory("enfermeria")
      : getDepartmentForCategory("medicina");
    if (!department) {
      setProfessionals([]);
      return;
    }
    setLoadingProfessionals(true);
    staffService
      .getStaff({ limit: 200, department, status: "Activo" })
      .then((res) =>
        setProfessionals(
          res.data.map((s) => ({
            name: s.name,
            specialty: s.position || s.department || "",
          }))
        )
      )
      .catch(() => setProfessionals([]))
      .finally(() => setLoadingProfessionals(false));
  }, [isOpen, variant]);

  useEffect(() => {
    if (!isOpen || variant !== "procedimientos") return;
    setLoadingCatalog(true);
    procedureService
      .getCatalog(true)
      .then((items) => setProcedureCatalog(items.map((p) => ({ id: p.id, name: p.name, base_price_soles: Number(p.base_price_soles) || 0 }))))
      .catch(() => setProcedureCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, [isOpen, variant]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDoctorChange = (doctorName: string) => {
    const professional = professionals.find((d) => d.name === doctorName);
    setFormData((prev) => ({
      ...prev,
      doctorName: doctorName,
      doctorSpecialty: professional?.specialty ?? "",
    }));
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    setFormData((prev) => ({
      ...prev,
      patientId: patientId,
      patientName: patient?.name ?? "",
      patientEmail: patient?.email ?? "",
      patientPhone: patient?.phone ?? "",
      location: patient?.address ?? "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { patientId, procedureCatalogId, procedureName, ...rest } = formData;
    const newAppointment: Appointment = {
      id: `A${Date.now()}`,
      ...rest,
      type: variant === "procedimientos" ? "procedimiento" : formData.type,
      ...(variant === "procedimientos" && {
        patient_id: patientId || undefined,
        procedure_catalog_id: procedureCatalogId || undefined,
        procedure_name: procedureName || undefined,
      }),
    };

    onAppointmentAdded(newAppointment);
    setIsOpen(false);
    setFormData({
      patientId: "",
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      doctorName: "",
      doctorSpecialty: "",
      date: "",
      time: "",
      duration: 30,
      type: "consulta",
      status: "scheduled",
      notes: "",
      location: "",
      procedureCatalogId: "",
      procedureName: "",
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Programar Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Complete la información para programar una nueva cita médica
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
                <Combobox
                  options={patients.map((p) => ({ value: p.id, label: p.name }))}
                  value={formData.patientId}
                  onValueChange={handlePatientChange}
                  placeholder={loadingPatients ? "Cargando pacientes..." : "Seleccionar paciente"}
                  disabled={loadingPatients}
                />
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
                  {variant === "procedimientos" ? "Procedimiento *" : "Tipo de Cita *"}
                </label>
                {variant === "procedimientos" ? (
                  <Combobox
                    options={procedureCatalog.map((p) => ({ value: p.id, label: `${p.name} (S/ ${p.base_price_soles.toFixed(2)})` }))}
                    value={formData.procedureCatalogId}
                    onValueChange={(value) => {
                      const item = procedureCatalog.find((p) => p.id === value);
                      setFormData((prev) => ({
                        ...prev,
                        procedureCatalogId: value,
                        procedureName: item?.name ?? "",
                      }));
                    }}
                    placeholder={loadingCatalog ? "Cargando procedimientos..." : "Seleccionar procedimiento"}
                    disabled={loadingCatalog}
                  />
                ) : (
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
                )}
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
                  Dirección (domicilio de la cita) *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Si el paciente tiene dirección registrada se usará esa; si no, ingrese la dirección"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del profesional (Médico o Enfermera) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                {professionalLabel} asignado/a
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {professionalLabel} *
                </label>
                <Combobox
                  options={professionals.map((p) => ({ value: p.name, label: p.name }))}
                  value={formData.doctorName}
                  onValueChange={handleDoctorChange}
                  placeholder={loadingProfessionals ? "Cargando..." : `Seleccionar ${professionalLabel.toLowerCase()}`}
                  disabled={loadingProfessionals}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <Input
                  value={formData.doctorSpecialty}
                  readOnly
                  className="bg-gray-50"
                  placeholder={variant === "procedimientos" ? "Enfermería" : "Especialidad médica"}
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
                  Síntomas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Describa los síntomas..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de la Cita */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Paciente:</p>
                  <p className="font-medium">{formData.patientName || "No seleccionado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{professionalLabel}:</p>
                  <p className="font-medium">{formData.doctorName || "No seleccionado"}</p>
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
                    {(variant === "procedimientos" ? formData.procedureName : formData.type) &&
                      getTypeBadge(
                        variant === "procedimientos" ? "procedimiento" : formData.type,
                        formData.procedureName
                      )}
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
              Programar Cita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
