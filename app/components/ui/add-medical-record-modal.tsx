import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Combobox } from "~/components/ui/combobox";
import { medicalAppointmentRecordsService } from "~/services/medicalAppointmentRecordsService";
import { patientsService } from "~/services/patientsService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";
import { toast } from "sonner";
import { Plus, User, Stethoscope, DollarSign, FileText } from "lucide-react";

const APPOINTMENT_TYPES = [
  { value: "consulta", label: "Consulta" },
  { value: "examen", label: "Examen" },
  { value: "emergencia", label: "Emergencia" },
  { value: "seguimiento", label: "Seguimiento" },
];

function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AddMedicalRecordModalProps {
  onCreated: () => void;
}

export function AddMedicalRecordModal({ onCreated }: AddMedicalRecordModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fecha: getTodayLocal(),
    patient_id: "" as string | null,
    patient_name: "",
    appointment_type: "consulta",
    doctor_name: "",
    ingreso: 0,
    costo: 0,
    notes: "",
  });
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [doctors, setDoctors] = useState<Array<{ name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    const department = getDepartmentForCategory("medicina");
    Promise.all([
      patientsService.getPatients({ limit: 500 }).then((res) => res.data.map((p) => ({ id: p.id, name: p.name }))),
      department
        ? staffService.getStaff({ limit: 200, department, status: "Activo" }).then((res) => res.data.map((s) => ({ name: s.name })))
        : Promise.resolve([]),
    ])
      .then(([pList, dList]) => {
        setPatients(pList);
        setDoctors(dList);
      })
      .catch(() => {
        setPatients([]);
        setDoctors([]);
      })
      .finally(() => setLoadingData(false));
  }, [open]);

  const resetForm = () => {
    setForm({
      fecha: getTodayLocal(),
      patient_id: null,
      patient_name: "",
      appointment_type: "consulta",
      doctor_name: "",
      ingreso: 0,
      costo: 0,
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let patientId: string | null = form.patient_id || null;
      let patientName: string | null = form.patient_name?.trim() || null;
      if (form.patient_id) {
        patientName = patients.find((p) => p.id === form.patient_id)?.name ?? patientName;
      }
      let createdNewPatient = false;
      if (!patientId && form.patient_name?.trim()) {
        const newPatient = await patientsService.createPatient({
          name: form.patient_name.trim(),
        });
        patientId = newPatient.id;
        patientName = null;
        setPatients((prev) => [{ id: newPatient.id, name: newPatient.name }, ...prev]);
        createdNewPatient = true;
      }

      await medicalAppointmentRecordsService.create({
        fecha: form.fecha,
        patient_id: patientId,
        patient_name: patientName,
        appointment_type: form.appointment_type,
        doctor_name: form.doctor_name.trim() || null,
        ingreso: Number(form.ingreso) || 0,
        costo: Number(form.costo) || 0,
        notes: form.notes.trim() || null,
      });
      toast.success(createdNewPatient ? "Paciente creado y registro de cita médica guardado" : "Registro de cita médica creado");
      resetForm();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error((err as Error)?.message ?? "Error al crear el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar registro de cita médica</DialogTitle>
          <DialogDescription>
            Registro manual de una cita médica (fecha, paciente, tipo, médico, ingreso y costo).
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <p className="text-sm text-gray-500">Cargando pacientes...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Paciente
                </Label>
                <select
                  value={form.patient_id ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      patient_id: v || null,
                      patient_name: v ? patients.find((p) => p.id === v)?.name ?? f.patient_name : f.patient_name,
                    }));
                  }}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Sin asignar / Otro</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nombre (si no está en la lista, se creará el paciente)</Label>
                <Input
                  value={form.patient_name}
                  onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
                  placeholder="Ej. Juan Pérez — se dará de alta si no existe"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  Tipo de cita *
                </Label>
                <select
                  value={form.appointment_type}
                  onChange={(e) => setForm((f) => ({ ...f, appointment_type: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {APPOINTMENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Médico</Label>
                <Combobox
                  options={doctors.map((d) => ({ value: d.name, label: d.name }))}
                  value={form.doctor_name}
                  onValueChange={(value) => setForm((f) => ({ ...f, doctor_name: value }))}
                  placeholder={loadingData ? "Cargando..." : "Buscar médico"}
                  disabled={loadingData}
                  emptyOption={{ value: "", label: "Seleccionar..." }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Ingreso (S/.)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.ingreso || ""}
                    onChange={(e) => setForm((f) => ({ ...f, ingreso: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Costo (S/.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.costo || ""}
                    onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Notas
                </Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  placeholder="Observaciones opcionales"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
