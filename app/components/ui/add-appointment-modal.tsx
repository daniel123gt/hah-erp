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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Combobox } from "~/components/ui/combobox";
import { patientsService, type Patient } from "~/services/patientsService";
import { procedureService } from "~/services/procedureService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Clock,
  User,
  UserPlus,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
  X,
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
  const [procedureProfessionalKind, setProcedureProfessionalKind] = useState<"enfermera" | "medico">("enfermera");
  const professionalLabel = variant === "procedimientos"
    ? (procedureProfessionalKind === "enfermera" ? "Enfermera" : "Médico")
    : "Médico";

  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [professionals, setProfessionals] = useState<{ name: string; specialty: string }[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [procedureCatalog, setProcedureCatalog] = useState<{ id: string; name: string; base_price_soles: number }[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [districts, setDistricts] = useState<Array<{ name: string; zone: string }>>([]);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    district: "",
  });
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
    patientsService.getDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const department = variant === "procedimientos"
      ? (procedureProfessionalKind === "enfermera"
          ? getDepartmentForCategory("enfermeria")
          : getDepartmentForCategory("medicina"))
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
  }, [isOpen, variant, procedureProfessionalKind]);

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

  const handleCreateNewPatient = async () => {
    if (!newPatientData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    try {
      setCreatingPatient(true);
      const newPatient = await patientsService.createPatient({
        name: newPatientData.name.trim(),
        dni: newPatientData.dni.trim() || undefined,
        email: newPatientData.email?.trim() || undefined,
        phone: newPatientData.phone?.trim() || undefined,
        gender: (newPatientData.gender as "M" | "F") || undefined,
        address: newPatientData.address?.trim() || undefined,
        district: newPatientData.district?.trim() || undefined,
      });
      setPatients((prev) => [newPatient, ...prev]);
      // Rellenar el formulario con el paciente recién creado (no usar handlePatientChange: patients aún no tiene al nuevo por el estado asíncrono)
      setFormData((prev) => ({
        ...prev,
        patientId: newPatient.id,
        patientName: newPatient.name?.trim() || newPatientData.name.trim() || "",
        patientEmail: newPatient.email?.trim() || newPatientData.email?.trim() || "",
        patientPhone: newPatient.phone?.trim() || newPatientData.phone?.trim() || "",
        location: newPatient.address?.trim() || newPatientData.address?.trim() || prev.location,
      }));
      setAddPatientModalOpen(false);
      setNewPatientData({ name: "", dni: "", email: "", phone: "", gender: "", address: "", district: "" });
      toast.success("Paciente creado. Ya está seleccionado para la cita.");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el paciente");
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId?.trim()) {
      toast.error("Debe seleccionar un paciente de la lista.");
      return;
    }
    if (variant === "procedimientos" && !formData.doctorName?.trim()) {
      toast.error("Debe asignar un profesional (enfermera o médico).");
      return;
    }
    const { patientId, procedureCatalogId, procedureName, ...rest } = formData;
    // Asegurar nombre/email/teléfono del paciente (por si el combobox no los rellenó)
    const patient = patients.find((p) => p.id === patientId);
    const patientName = (rest.patientName?.trim() || patient?.name) ?? "";
    const patientEmail = (rest.patientEmail?.trim() || patient?.email) ?? "";
    const patientPhone = (rest.patientPhone?.trim() || patient?.phone) ?? "";

    const newAppointment: Appointment = {
      id: `A${Date.now()}`,
      ...rest,
      patientName,
      patientEmail,
      patientPhone,
      patient_id: patientId || undefined,
      type: variant === "procedimientos" ? "procedimiento" : formData.type,
      ...(variant === "procedimientos" && {
        procedure_catalog_id: procedureCatalogId || undefined,
        procedure_name: procedureName || undefined,
      }),
    };

    onAppointmentAdded(newAppointment);
    setIsOpen(false);
    setProcedureProfessionalKind("enfermera");
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
    <>
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
              <div className="md:col-span-1 space-y-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAddPatientModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar paciente
                </Button>
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
              {variant === "procedimientos" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asignar
                  </label>
                  <Select
                    value={procedureProfessionalKind}
                    onValueChange={(value: "enfermera" | "medico") => {
                      setProcedureProfessionalKind(value);
                      setFormData((prev) => ({ ...prev, doctorName: "", doctorSpecialty: "" }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Enfermera o médico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enfermera">Enfermera</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                      ? `${formData.date.split('-').reverse().join('/')} a las ${formData.time}`
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

    {/* Modal Agregar paciente (segundo modal por encima) */}
    <Dialog open={addPatientModalOpen} onOpenChange={setAddPatientModalOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-blue" />
            Crear nuevo paciente
          </DialogTitle>
          <DialogDescription>
            Si no encuentra al paciente en la lista, créelo aquí. Se seleccionará automáticamente para la cita.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newPatientData.name}
                onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label>Nro. documento</Label>
              <Input
                value={newPatientData.dni}
                onChange={(e) => setNewPatientData({ ...newPatientData, dni: e.target.value })}
                placeholder="Ej. 12345678"
                maxLength={20}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={newPatientData.phone}
                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label>Género</Label>
              <Select
                value={newPatientData.gender}
                onValueChange={(value) => setNewPatientData({ ...newPatientData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distrito</Label>
              <Combobox
                options={districts.map((d) => ({ value: d.name, label: d.zone ? `${d.name} (${d.zone})` : d.name }))}
                value={newPatientData.district || "__none__"}
                onValueChange={(value) => setNewPatientData({ ...newPatientData, district: value === "__none__" ? "" : value })}
                placeholder="Seleccionar distrito"
                emptyOption={{ value: "__none__", label: "Sin especificar" }}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={newPatientData.address}
                onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                placeholder="Dirección"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setAddPatientModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateNewPatient}
              disabled={creatingPatient || !newPatientData.name.trim()}
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              {creatingPatient ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Crear Paciente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
