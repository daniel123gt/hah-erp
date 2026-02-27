import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { User, DollarSign, Plus, Loader2, UserPlus, ChevronsUpDown } from "lucide-react";
import { CreatePatientSubmodal } from "~/components/ui/create-patient-submodal";
import homeCareService, {
  type HomeCareContractWithPatient,
  type HomeCarePlan,
  type HomeCarePlanCategoria,
} from "~/services/homeCareService";
import { patientsService, type Patient } from "~/services/patientsService";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

const CATEGORIA_OPTIONS: { value: "todos" | HomeCarePlanCategoria; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "tecnicas", label: "Técnicas" },
  { value: "licenciadas", label: "Licenciadas" },
  { value: "paliativos", label: "Paliativos" },
];

function planCategoriaColor(categoria: string | undefined): string {
  switch (categoria) {
    case "tecnicas": return "bg-green-100 text-green-800 border-green-200";
    case "licenciadas": return "bg-blue-100 text-blue-800 border-blue-200";
    case "paliativos": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

interface AddHomeCarePatientModalProps {
  onAdded: (patientId: string) => void;
}

export function AddHomeCarePatientModal({ onAdded }: AddHomeCarePatientModalProps) {
  const [open, setOpen] = useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string; dni?: string }>>([]);
  const [plans, setPlans] = useState<HomeCarePlan[]>([]);
  const [activeContractPatientIds, setActiveContractPatientIds] = useState<Set<string>>(new Set());

  const [patientId, setPatientId] = useState("");

  const [contract, setContract] = useState({
    familiar_encargado: "",
    hora_inicio: "08:00",
    fecha_inicio: new Date().toISOString().split("T")[0],
    plan_id: "",
  });
  const [categoryFilter, setCategoryFilter] = useState<"todos" | HomeCarePlanCategoria>("todos");
  const [planComboboxOpen, setPlanComboboxOpen] = useState(false);

  /** Solo planes mensuales (para este modal) */
  const monthlyPlans = useMemo(
    () => plans.filter((p) => (p.tipo ?? "mensual") === "mensual"),
    [plans]
  );
  /** Planes mensuales filtrados por categoría */
  const filteredPlans = useMemo(() => {
    if (categoryFilter === "todos") return monthlyPlans;
    return monthlyPlans.filter((p) => (p.categoria ?? "tecnicas") === categoryFilter);
  }, [monthlyPlans, categoryFilter]);

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
    if (!patientId.trim()) {
      toast.error("Selecciona un paciente.");
      return;
    }
    setLoading(true);
    try {
      const familiarEncargado = contract.familiar_encargado.trim();
      const selectedPlan = contract.plan_id
        ? monthlyPlans.find((p) => p.id === contract.plan_id)
        : null;
      if (!selectedPlan) {
        toast.error("Selecciona un plan.");
        setLoading(false);
        return;
      }

      await homeCareService.createContract({
        patient_id: patientId,
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
      onAdded(patientId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientId("");
    setCategoryFilter("todos");
    setContract({
      familiar_encargado: "",
      hora_inicio: "08:00",
      fecha_inicio: new Date().toISOString().split("T")[0],
      plan_id: "",
    });
  };

  const availablePatients = patients;

  return (
    <>
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
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <div className="flex gap-2">
                  <Combobox
                    className="flex-1"
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddPatientModalOpen(true)}
                    className="shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Agregar paciente
                  </Button>
                </div>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="familiar_encargado">Familiar encargado</Label>
                <Input
                  id="familiar_encargado"
                  value={contract.familiar_encargado}
                  onChange={(e) => setContract((c) => ({ ...c, familiar_encargado: e.target.value }))}
                  placeholder="Ej: María García"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora de inicio</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={contract.hora_inicio}
                    onChange={(e) => setContract((c) => ({ ...c, hora_inicio: e.target.value }))}
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
                <Label>Categoría</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v as "todos" | HomeCarePlanCategoria)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_id">Plan *</Label>
                <Popover open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="plan_id"
                      variant="outline"
                      role="combobox"
                      aria-expanded={planComboboxOpen}
                      disabled={filteredPlans.length === 0}
                      className={cn(
                        "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
                        !contract.plan_id && "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {contract.plan_id
                          ? (() => {
                              const plan = plans.find((p) => p.id === contract.plan_id);
                              if (!plan) return "Selecciona un plan";
                              return (
                                <>
                                  <Badge
                                    variant="outline"
                                    className={cn("shrink-0 text-xs", planCategoriaColor(plan.categoria))}
                                  >
                                    {plan.categoria === "tecnicas" ? "Técnicas" : plan.categoria === "licenciadas" ? "Licenciadas" : "Paliativos"}
                                  </Badge>
                                  {plan.name} — S/ {Number(plan.monto_mensual).toLocaleString("es-PE")}/mes
                                </>
                              );
                            })()
                          : "Buscar plan..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" sideOffset={4}>
                    <Command shouldFilter={true}>
                      <CommandInput placeholder="Buscar plan..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {filteredPlans.map((plan) => (
                            <CommandItem
                              key={plan.id}
                              value={`${plan.name} ${plan.categoria ?? ""} ${plan.monto_mensual}`}
                              onSelect={() => {
                                setContract((c) => ({ ...c, plan_id: plan.id }));
                                setPlanComboboxOpen(false);
                              }}
                            >
                              <span className="flex items-center gap-2 w-full">
                                <Badge
                                  variant="outline"
                                  className={cn("shrink-0 text-xs", planCategoriaColor(plan.categoria))}
                                >
                                  {plan.categoria === "tecnicas" ? "Técnicas" : plan.categoria === "licenciadas" ? "Licenciadas" : "Paliativos"}
                                </Badge>
                                <span className="truncate">
                                  {plan.name} — S/ {Number(plan.monto_mensual).toLocaleString("es-PE")}/mes
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {filteredPlans.length === 0 && monthlyPlans.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay planes mensuales. Ejecuta el seed de planes en la BD.</p>
                )}
                {monthlyPlans.length > 0 && filteredPlans.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay planes en esta categoría.</p>
                )}
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
    <CreatePatientSubmodal
      open={addPatientModalOpen}
      onOpenChange={setAddPatientModalOpen}
      onCreated={(newPatient: Patient) => {
        setPatients((prev) => [
          { id: newPatient.id, name: newPatient.name ?? "", dni: newPatient.dni },
          ...prev,
        ]);
        setPatientId(newPatient.id);
      }}
      description="Se seleccionará automáticamente para el contrato de cuidados en casa."
    />
    </>
  );
}
