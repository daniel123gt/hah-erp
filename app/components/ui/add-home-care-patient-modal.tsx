import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Label } from "./label";
import { Combobox } from "./combobox";
import { User, Calendar, DollarSign, Plus, Loader2, UserPlus } from "lucide-react";
import homeCareService, {
  type HomeCareContractWithPatient,
  type HomeCarePlan,
} from "~/services/homeCareService";
import { patientsService } from "~/services/patientsService";
import { toast } from "sonner";

interface AddHomeCarePatientModalProps {
  onAdded: (patientId: string) => void;
}

type PatientMode = "existing" | "new";

export function AddHomeCarePatientModal({ onAdded }: AddHomeCarePatientModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientMode, setPatientMode] = useState<PatientMode>("existing");
  const [patients, setPatients] = useState<Array<{ id: string; name: string; dni?: string }>>([]);
  const [plans, setPlans] = useState<HomeCarePlan[]>([]);
  const [activeContractPatientIds, setActiveContractPatientIds] = useState<Set<string>>(new Set());

  const [patientId, setPatientId] = useState("");
  const [newPatient, setNewPatient] = useState({
    name: "",
    nroDocumento: "",
    phone: "",
    familiar_encargado: "",
  });

  const [contract, setContract] = useState({
    familiar_encargado: "",
    hora_inicio: "8:00 AM",
    fecha_inicio: new Date().toISOString().split("T")[0],
    plan_id: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [contractsRes, patientsRes, plansRes] = await Promise.all([
        homeCareService.getContracts(),
        patientsService.getPatients({ limit: 500 }),
        homeCareService.getPlans(),
      ]);
      const ids = new Set((contractsRes as HomeCareContractWithPatient[]).map((c) => c.patient_id));
      setActiveContractPatientIds(ids);
      setPatients(
        patientsRes.data
          .filter((p) => !ids.has(p.id))
          .map((p) => ({ id: p.id, name: p.name, dni: p.dni }))
      );
      setPlans(plansRes);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalPatientId = patientId;
      if (patientMode === "new") {
        if (!newPatient.name.trim()) {
          toast.error("El nombre del paciente es obligatorio.");
          setLoading(false);
          return;
        }
        if (newPatient.nroDocumento?.trim()) {
          const taken = await patientsService.isDniTaken(newPatient.nroDocumento.trim());
          if (taken) {
            toast.error("Este número de documento ya está registrado.");
            setLoading(false);
            return;
          }
        }
        const familiarEncargado =
          patientMode === "new"
            ? newPatient.familiar_encargado.trim()
            : contract.familiar_encargado.trim();
        const created = await patientsService.createPatient({
          name: newPatient.name.trim(),
          dni: newPatient.nroDocumento.trim() || undefined,
          phone: newPatient.phone.trim() || undefined,
          emergency_contact_name: familiarEncargado || undefined,
          status: "Activo",
        });
        finalPatientId = created.id;
      } else {
        if (!finalPatientId) {
          toast.error("Selecciona un paciente.");
          setLoading(false);
          return;
        }
      }

      const familiarEncargado =
        patientMode === "new"
          ? newPatient.familiar_encargado.trim()
          : contract.familiar_encargado.trim();
      const selectedPlan = contract.plan_id
        ? plans.find((p) => p.id === contract.plan_id)
        : null;
      if (!selectedPlan) {
        toast.error("Selecciona un plan.");
        setLoading(false);
        return;
      }

      await homeCareService.createContract({
        patient_id: finalPatientId,
        plan_id: contract.plan_id || null,
        familiar_encargado: familiarEncargado || null,
        hora_inicio: contract.hora_inicio.trim() || "8:00 AM",
        fecha_inicio: contract.fecha_inicio,
        plan_nombre: selectedPlan.name,
        plan_monto_mensual: selectedPlan.monto_mensual,
      });

      toast.success("Paciente agregado al servicio de cuidados en casa.");
      setOpen(false);
      resetForm();
      onAdded(finalPatientId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientMode("existing");
    setPatientId("");
    setNewPatient({ name: "", nroDocumento: "", phone: "", familiar_encargado: "" });
    setContract({
      familiar_encargado: "",
      hora_inicio: "8:00 AM",
      fecha_inicio: new Date().toISOString().split("T")[0],
      plan_id: "",
    });
  };

  const availablePatients = patients;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Agregar paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Agregar paciente a Cuidados en casa
          </DialogTitle>
          <DialogDescription>
            Elige un paciente existente o crea uno nuevo y configura el contrato del servicio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paciente: existente o nuevo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="patientMode"
                    checked={patientMode === "existing"}
                    onChange={() => setPatientMode("existing")}
                    className="text-primary-blue"
                  />
                  <span>Seleccionar paciente existente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="patientMode"
                    checked={patientMode === "new"}
                    onChange={() => setPatientMode("new")}
                    className="text-primary-blue"
                  />
                  <span>Crear paciente nuevo</span>
                </label>
              </div>

              {patientMode === "existing" ? (
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Combobox
                    options={availablePatients.map((p) => ({
                      value: p.id,
                      label: p.dni ? `${p.name} (${p.dni})` : p.name,
                    }))}
                    value={patientId}
                    onValueChange={setPatientId}
                    placeholder={
                      availablePatients.length === 0
                        ? "No hay pacientes disponibles (todos ya tienen el servicio)"
                        : "Selecciona un paciente"
                    }
                    disabled={availablePatients.length === 0}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new_name">Nombre completo *</Label>
                    <Input
                      id="new_name"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_nro_doc">Nro. documento</Label>
                    <Input
                      id="new_nro_doc"
                      value={newPatient.nroDocumento}
                      onChange={(e) => setNewPatient((p) => ({ ...p, nroDocumento: e.target.value }))}
                      placeholder="DNI, CE o pasaporte"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_phone">Teléfono</Label>
                    <Input
                      id="new_phone"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Ej: 999 888 777"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new_familiar">Familiar encargado</Label>
                    <Input
                      id="new_familiar"
                      value={newPatient.familiar_encargado}
                      onChange={(e) =>
                        setNewPatient((p) => ({ ...p, familiar_encargado: e.target.value }))
                      }
                      placeholder="Nombre del familiar responsable"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos del contrato */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Contrato de cuidado en casa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientMode === "existing" && (
                <div className="space-y-2">
                  <Label htmlFor="familiar_encargado">Familiar encargado</Label>
                  <Input
                    id="familiar_encargado"
                    value={contract.familiar_encargado}
                    onChange={(e) => setContract((c) => ({ ...c, familiar_encargado: e.target.value }))}
                    placeholder="Ej: María García"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora de inicio</Label>
                  <Input
                    id="hora_inicio"
                    value={contract.hora_inicio}
                    onChange={(e) => setContract((c) => ({ ...c, hora_inicio: e.target.value }))}
                    placeholder="8:00 AM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={contract.fecha_inicio}
                    onChange={(e) => setContract((c) => ({ ...c, fecha_inicio: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_id">Plan *</Label>
                <select
                  id="plan_id"
                  value={contract.plan_id}
                  onChange={(e) => setContract((c) => ({ ...c, plan_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Selecciona un plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — S/ {Number(plan.monto_mensual).toLocaleString("es-PE")}/mes
                    </option>
                  ))}
                  {plans.length === 0 && (
                    <option value="" disabled>
                      No hay planes cargados. Ejecuta el seed de planes en la BD.
                    </option>
                  )}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary-blue hover:bg-primary-blue/90" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading ? "Guardando..." : "Agregar al servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
