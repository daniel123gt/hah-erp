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
import { Combobox } from "~/components/ui/combobox";
import { CreatePatientSubmodal } from "~/components/ui/create-patient-submodal";
import { patientsService, type Patient } from "~/services/patientsService";
import { procedureService, PAYMENT_METHOD_OPTIONS } from "~/services/procedureService";
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
  DollarSign,
  AlertCircle,
  Loader2,
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
  district?: string | null;
  patient_id?: string;
  procedure_catalog_id?: string;
  procedure_name?: string;
  procedure_ingreso?: number | null;
  appointment_ingreso?: number | null;
  payment_method?: string | null;
  numero_operacion?: string | null;
}

interface AddAppointmentModalProps {
  onAppointmentAdded: (appointment: Appointment) => void | Promise<void>;
  /** "medicina" = médico, "procedimientos" = enfermera, "rx_ecografias" = RX/Ecografías (médico) */
  variant?: "medicina" | "procedimientos" | "rx_ecografias";
  defaultLocation?: string;
}

export function AddAppointmentModal({
  onAppointmentAdded,
  variant = "medicina",
}: AddAppointmentModalProps) {
  const [procedureProfessionalKind, setProcedureProfessionalKind] = useState<"enfermera" | "medico">("enfermera");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const professionalLabel = variant === "procedimientos"
    ? (procedureProfessionalKind === "enfermera" ? "Enfermera" : "Médico")
    : variant === "rx_ecografias"
      ? "Técnico / Médico"
      : "Médico";

  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [professionals, setProfessionals] = useState<{ name: string; specialty: string }[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [procedureCatalog, setProcedureCatalog] = useState<{ id: string; name: string; base_price_soles: number; total_cost_soles: number }[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [districts, setDistricts] = useState<Array<{ name: string; zone: string }>>([]);
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
    status: "scheduled" as Appointment["status"],
    notes: "",
    location: "",
    district: "",
    procedureCatalogId: "",
    procedureName: "",
    procedureIngreso: "" as string | number,
    appointmentIngreso: "" as string | number,
    paymentMethod: "efectivo",
    numeroOperacion: "",
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
      : getDepartmentForCategory(variant === "rx_ecografias" ? "rx_ecografias" : "medicina");
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
      .then((items) =>
        setProcedureCatalog(
          items.map((p) => ({
            id: p.id,
            name: p.name,
            base_price_soles: Number(p.base_price_soles) || 0,
            total_cost_soles: Number(p.total_cost_soles) || 0,
          }))
        )
      )
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
      district: patient?.district ?? "",
    }));
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setFormData((prev) => ({
      ...prev,
      patientId: newPatient.id,
      patientName: newPatient.name?.trim() ?? "",
      patientEmail: newPatient.email?.trim() ?? "",
      patientPhone: newPatient.phone?.trim() ?? "",
      location: newPatient.address?.trim() ?? prev.location,
      district: newPatient.district?.trim() ?? prev.district,
    }));
    toast.success("Paciente creado. Ya está seleccionado para la cita.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId?.trim()) {
      toast.error("Debe seleccionar un paciente de la lista.");
      return;
    }
    if (variant === "procedimientos" && !formData.doctorName?.trim()) {
      toast.error("Debe asignar un profesional (enfermera o médico).");
      return;
    }
    const patient = patients.find((p) => p.id === formData.patientId);
    const locationTrim = formData.location?.trim() ?? "";
    const districtTrim = formData.district?.trim() ?? "";
    if (patient && (locationTrim || districtTrim)) {
      const shouldUpdate =
        (!patient.address?.trim() && locationTrim) || (!patient.district?.trim() && districtTrim);
      if (shouldUpdate) {
        try {
          await patientsService.updatePatient({
            id: patient.id,
            ...(locationTrim && { address: locationTrim }),
            ...(districtTrim && { district: districtTrim }),
          });
          const updated = await patientsService.getPatientById(patient.id);
          if (updated) setPatients((prev) => prev.map((p) => (p.id === patient.id ? updated : p)));
        } catch (err) {
          console.error(err);
          toast.error("No se pudo actualizar los datos del paciente.");
          return;
        }
      }
    }
    const { patientId, procedureCatalogId, procedureName, ...rest } = formData;
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
        procedure_ingreso: formData.procedureIngreso !== "" && formData.procedureIngreso !== undefined ? Number(formData.procedureIngreso) : null,
      }),
      ...(variant === "medicina" && {
        appointment_ingreso: formData.appointmentIngreso !== "" && formData.appointmentIngreso !== undefined ? Number(formData.appointmentIngreso) : null,
      }),
      payment_method: formData.status === "completed" ? formData.paymentMethod || null : null,
      numero_operacion: formData.status === "completed" && formData.numeroOperacion?.trim() ? formData.numeroOperacion.trim() : null,
    };

    setIsSubmitting(true);
    try {
      const result = onAppointmentAdded(newAppointment);
      if (result && typeof (result as Promise<void>).then === "function") {
        await (result as Promise<void>);
      }
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
        district: "",
        procedureCatalogId: "",
        procedureName: "",
        procedureIngreso: "",
        appointmentIngreso: "",
        paymentMethod: "efectivo",
        numeroOperacion: "",
      });
    } finally {
      setIsSubmitting(false);
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

          {/* Detalles de la Cita (2/3) + Información de pago (1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary-blue" />
                  Detalles de la Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="scheduled">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 30)}
                      min="15"
                      max="180"
                      step="15"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección (domicilio de la cita) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      <Input
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="Se toma del paciente; si no tiene, ingrese y se guardará en su ficha"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Si no tiene, se guardarán al crear la cita.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Distrito</label>
                    <Combobox
                      options={districts.map((d) => ({ value: d.name, label: d.zone ? `${d.name} (${d.zone})` : d.name }))}
                      value={formData.district || "__none__"}
                      onValueChange={(value) => handleInputChange("district", value === "__none__" ? "" : value)}
                      placeholder="Seleccionar distrito"
                      emptyOption={{ value: "__none__", label: "Sin especificar" }}
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
                          const basePrice = item ? item.base_price_soles : 0;
                          setFormData((prev) => ({
                            ...prev,
                            procedureCatalogId: value,
                            procedureName: item?.name ?? "",
                            procedureIngreso: prev.procedureIngreso === "" || prev.procedureIngreso === undefined ? basePrice : prev.procedureIngreso,
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
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-primary-blue" />
                  Información de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingreso a registrar (S/.) {formData.status === "completed" ? "" : "(editable al completar)"}
                  </label>
                  {variant === "procedimientos" ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.procedureIngreso === "" || formData.procedureIngreso === undefined ? (procedureCatalog.find((p) => p.id === formData.procedureCatalogId)?.base_price_soles ?? "") : formData.procedureIngreso}
                      onChange={(e) => setFormData((prev) => ({ ...prev, procedureIngreso: e.target.value ? Number(e.target.value) : "" }))}
                      disabled={formData.status !== "completed"}
                      placeholder={(procedureCatalog.find((p) => p.id === formData.procedureCatalogId)?.base_price_soles ?? 0).toString()}
                      className={formData.status !== "completed" ? "bg-muted" : ""}
                    />
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.appointmentIngreso === "" || formData.appointmentIngreso === undefined ? "" : formData.appointmentIngreso}
                      onChange={(e) => setFormData((prev) => ({ ...prev, appointmentIngreso: e.target.value ? Number(e.target.value) : "" }))}
                      disabled={formData.status !== "completed"}
                      placeholder="0"
                      className={formData.status !== "completed" ? "bg-muted" : ""}
                    />
                  )}
                </div>
                {formData.status === "completed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      >
                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nº operación / referencia</label>
                      <Input
                        value={formData.numeroOperacion}
                        onChange={(e) => setFormData((prev) => ({ ...prev, numeroOperacion: e.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

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
                        {formData.status === "scheduled" ? "Pendiente" :
                         formData.status === "confirmed" ? "Confirmada" :
                         formData.status === "completed" ? "Completada" :
                         "Cancelada"}
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Programando...
                </>
              ) : (
                "Programar Cita"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <CreatePatientSubmodal
      open={addPatientModalOpen}
      onOpenChange={setAddPatientModalOpen}
      onCreated={handlePatientCreated}
      description="Se seleccionará automáticamente para la cita."
    />
    </>
  );
}
