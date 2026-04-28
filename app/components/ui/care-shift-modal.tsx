"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
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
import { Loader2, UserPlus, AlertTriangle, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import type { CareShiftWithPatient, CreateCareShiftData } from "~/services/shiftCareService";
import { patientsService, type Patient } from "~/services/patientsService";
import { homeCareService, type HomeCarePlan, type HomeCarePlanCategoria } from "~/services/homeCareService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";

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

const FORMA_PAGO_OPTIONS = ["TRANSFERENCIA", "YAPE", "PLIN", "EFECTIVO", "OTRO"];

/** Convierte hora guardada (ej. "9AM" o "09:00") a formato HH:mm para input type="time". */
function toTimeInputValue(h: string | null | undefined): string {
  if (!h || !h.trim()) return "";
  const t = h.trim();
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.length === 4 ? "0" + t : t;
  const match = t.match(/^(\d{1,2})\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const ampm = (match[2] || "").toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00`;
  }
  return "";
}

export interface CareShiftFormData {
  fecha: string;
  hora_inicio: string;
  patient_id: string;
  familiar_responsable: string;
  distrito: string;
  turno: string;
  monto_a_pagar: string;
  forma_de_pago: string;
  numero_operacion: string;
  enfermera: string;
  gastos_extras: string;
  observacion: string;
  utilidad: string;
}

function shiftToForm(s: CareShiftWithPatient | null): CareShiftFormData {
  if (!s) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      fecha: today,
      hora_inicio: "",
      patient_id: "",
      familiar_responsable: "",
      distrito: "",
      turno: "",
      monto_a_pagar: "",
      forma_de_pago: "",
      numero_operacion: "",
      enfermera: "",
      gastos_extras: "",
      observacion: "",
      utilidad: "",
    };
  }
  const p = s.patient;
  const patientName = Array.isArray(p) ? p[0]?.name : p?.name;
  return {
    fecha: (s.fecha || "").slice(0, 10),
    hora_inicio: toTimeInputValue(s.hora_inicio) || (s.hora_inicio ?? ""),
    patient_id: s.patient_id ?? "",
    familiar_responsable: s.familiar_responsable ?? "",
    distrito: s.distrito ?? "",
    turno: s.turno ?? "",
    monto_a_pagar: s.monto_a_pagar != null ? String(s.monto_a_pagar) : "",
    forma_de_pago: s.forma_de_pago ?? "",
    numero_operacion: s.numero_operacion ?? "",
    enfermera: s.enfermera ?? "",
    gastos_extras: s.gastos_extras != null ? String(s.gastos_extras) : "",
    observacion: s.observacion ?? "",
    utilidad: s.utilidad != null ? String(s.utilidad) : "",
  };
}

interface CareShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: CareShiftWithPatient | null;
  onSaved: () => void;
  createShift: (data: CreateCareShiftData) => Promise<unknown>;
  updateShift: (id: string, data: Partial<CreateCareShiftData>) => Promise<unknown>;
}

export function CareShiftModal({
  open,
  onOpenChange,
  shift,
  onSaved,
  createShift,
  updateShift,
}: CareShiftModalProps) {
  const [form, setForm] = useState<CareShiftFormData>(() => shiftToForm(shift));
  const [loading, setLoading] = useState(false);
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [plans, setPlans] = useState<HomeCarePlan[]>([]);
  const [nurseOptions, setNurseOptions] = useState<{ value: string; label: string }[]>([]);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicatePatients, setDuplicatePatients] = useState<Patient[]>([]);
  const [turnoMode, setTurnoMode] = useState<"existente" | "personalizado">("existente");
  const [turnoPersonalizado, setTurnoPersonalizado] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"todos" | HomeCarePlanCategoria>("todos");
  const [planComboboxOpen, setPlanComboboxOpen] = useState(false);

  /** Turnos mínimos de técnicas que deben existir siempre en el selector. */
  const requiredTecnicasTurnos = useMemo<HomeCarePlan[]>(
    () => [
      {
        id: "fallback-turno-6h-140",
        name: "6 horas",
        turno: "6H",
        monto_mensual: 140,
        categoria: "tecnicas",
        tipo: "especial",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-turno-8h-150",
        name: "8 horas",
        turno: "8H",
        monto_mensual: 150,
        categoria: "tecnicas",
        tipo: "especial",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ],
    []
  );

  /** Solo planes especial y semana (para turnos eventuales) */
  const shiftPlans = useMemo(() => {
    const base = plans.filter(
      (p) => (p.tipo ?? "mensual") === "especial" || (p.tipo ?? "mensual") === "semana"
    );
    const byName = new Map(base.map((p) => [p.name, p] as const));
    for (const required of requiredTecnicasTurnos) {
      if (!byName.has(required.name)) byName.set(required.name, required);
    }
    return Array.from(byName.values());
  }, [plans, requiredTecnicasTurnos]);
  const filteredPlans = useMemo(() => {
    if (categoryFilter === "todos") return shiftPlans;
    return shiftPlans.filter((p) => (p.categoria ?? "tecnicas") === categoryFilter);
  }, [shiftPlans, categoryFilter]);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    address: "",
    district: "",
  });

  useEffect(() => {
    setForm(shiftToForm(shift));
    setTurnoMode("existente");
    setTurnoPersonalizado("");
  }, [shift, open]);

  useEffect(() => {
    if (!open || !form.turno) return;
    if (shiftPlans.length > 0 && !shiftPlans.some((p) => p.name === form.turno)) {
      setTurnoMode("personalizado");
      setTurnoPersonalizado(form.turno);
    }
  }, [open, form.turno, shiftPlans]);

  useEffect(() => {
    if (open) {
      patientsService.getPatients({ limit: 500 }).then((res) => {
        setPatientOptions(res.data.map((p) => ({ value: p.id, label: p.name })));
      });
      patientsService.getDistricts().then((districts) => {
        setDistrictOptions(
          districts.map((d) => ({
            value: d.name,
            label: d.zone ? `${d.name} (${d.zone})` : d.name,
          }))
        );
      });
      homeCareService.getPlans().then((data: HomeCarePlan[]) => {
        setPlans(data);
      });
      const dept = getDepartmentForCategory("enfermeria");
      if (dept) {
        staffService.getStaff({ limit: 200, department: dept, status: "Activo" }).then((res) => {
          setNurseOptions(res.data.map((s) => ({ value: s.name, label: s.name })));
        }).catch(() => setNurseOptions([]));
      } else {
        setNurseOptions([]);
      }
    }
  }, [open]);

  const doCreateNewPatient = async () => {
    const name = newPatientData.name.trim();
    const created = await patientsService.createPatient({
      name,
      dni: newPatientData.dni.trim() || undefined,
      email: newPatientData.email.trim() || undefined,
      phone: newPatientData.phone.trim() || undefined,
      address: newPatientData.address.trim() || undefined,
      district: newPatientData.district.trim() || undefined,
    });
    setPatientOptions((prev) => [{ value: created.id, label: created.name }, ...prev]);
    setForm((f) => ({ ...f, patient_id: created.id }));
    setAddPatientModalOpen(false);
    setNewPatientData({ name: "", dni: "", email: "", phone: "", address: "", district: "" });
    setDuplicateWarningOpen(false);
    setDuplicatePatients([]);
    toast.success("Paciente creado y seleccionado.");
  };

  const handleCreateNewPatient = async () => {
    const name = newPatientData.name.trim();
    if (!name) return;
    setCreatingPatient(true);
    try {
      const sameName = await patientsService.findPatientsWithSameName(name);
      if (sameName.length > 0) {
        setDuplicatePatients(sameName);
        setDuplicateWarningOpen(true);
        setCreatingPatient(false);
        return;
      }
      await doCreateNewPatient();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear el paciente.");
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleConfirmDuplicateAndCreate = async () => {
    setCreatingPatient(true);
    try {
      await doCreateNewPatient();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear el paciente.");
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fecha.trim()) return;
    const monto = parseFloat(form.monto_a_pagar) || 0;
    setLoading(true);
    try {
      const turnoValue = turnoMode === "personalizado" ? turnoPersonalizado.trim() : form.turno.trim();
      const payload: CreateCareShiftData = {
        fecha: form.fecha.slice(0, 10),
        hora_inicio: form.hora_inicio.trim() || null,
        patient_id: form.patient_id || null,
        familiar_responsable: form.familiar_responsable.trim() || null,
        distrito: form.distrito.trim() || null,
        turno: turnoValue || null,
        monto_a_pagar: monto,
        forma_de_pago: form.forma_de_pago.trim() || null,
        numero_operacion: form.numero_operacion.trim() || null,
        enfermera: form.enfermera.trim() || null,
        gastos_extras: form.gastos_extras ? parseFloat(form.gastos_extras) : null,
        observacion: form.observacion.trim() || null,
        utilidad: form.utilidad ? parseFloat(form.utilidad) : null,
      };
      if (shift) {
        await updateShift(shift.id, payload);
      } else {
        await createShift(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shift ? "Editar turno" : "Registrar turno eventual"}</DialogTitle>
          <DialogDescription>
            {shift
              ? "Modifica los datos del turno de cuidado."
              : "Registro de turno por horas (sin plan mensual)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="care-shift-fecha">Fecha *</Label>
              <Input
                id="care-shift-fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="care-shift-hora">Hora de inicio</Label>
              <Input
                id="care-shift-hora"
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paciente</Label>
            <Combobox
              options={patientOptions}
              value={form.patient_id}
              onValueChange={(v) => setForm((f) => ({ ...f, patient_id: v }))}
              placeholder="Buscar paciente..."
              emptyOption={{ value: "", label: "Sin asignar" }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                setNewPatientData({ name: "", dni: "", email: "", phone: "", address: "", district: "" });
                setAddPatientModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar paciente
            </Button>
          </div>

          <div>
            <Label htmlFor="care-shift-familiar">Familiar responsable</Label>
            <Input
              id="care-shift-familiar"
              value={form.familiar_responsable}
              onChange={(e) => setForm((f) => ({ ...f, familiar_responsable: e.target.value }))}
              placeholder="Nombre del familiar"
            />
          </div>

          <div>
            <Label htmlFor="care-shift-distrito">Distrito</Label>
            <Combobox
              id="care-shift-distrito"
              options={districtOptions}
              value={form.distrito}
              onValueChange={(v) => setForm((f) => ({ ...f, distrito: v }))}
              placeholder="Seleccionar distrito"
              emptyOption={{ value: "", label: "Seleccionar distrito" }}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2 w-full">
              <Label>Turno (duración)</Label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="turno-mode"
                    checked={turnoMode === "existente"}
                    onChange={() => setTurnoMode("existente")}
                    className="rounded-full border-input"
                  />
                  <span className="text-sm">Turno existente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="turno-mode"
                    checked={turnoMode === "personalizado"}
                    onChange={() => setTurnoMode("personalizado")}
                    className="rounded-full border-input"
                  />
                  <span className="text-sm">Turno personalizado</span>
                </label>
              </div>
              {turnoMode === "existente" ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-normal">Categoría</Label>
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
                  <Label className="text-muted-foreground font-normal">Turno</Label>
                  <Popover open={planComboboxOpen} onOpenChange={setPlanComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={planComboboxOpen}
                        disabled={filteredPlans.length === 0}
                        className={cn(
                          "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
                          !form.turno && "text-muted-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {form.turno
                            ? (() => {
                                const plan = shiftPlans.find((p) => p.name === form.turno);
                                if (!plan) return form.turno;
                                return (
                                  <>
                                    <Badge
                                      variant="outline"
                                      className={cn("shrink-0 text-xs", planCategoriaColor(plan.categoria))}
                                    >
                                      {plan.categoria === "tecnicas" ? "Técnicas" : plan.categoria === "licenciadas" ? "Licenciadas" : "Paliativos"}
                                    </Badge>
                                    {plan.name} — S/ {Number(plan.monto_mensual).toLocaleString("es-PE")}
                                  </>
                                );
                              })()
                            : "Buscar turno..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" sideOffset={4}>
                      <Command shouldFilter={true}>
                        <CommandInput placeholder="Buscar turno..." />
                        <CommandList>
                          <CommandEmpty>Sin resultados.</CommandEmpty>
                          <CommandGroup>
                            {filteredPlans.map((plan) => (
                              <CommandItem
                                key={plan.id}
                                value={`${plan.name} ${plan.categoria ?? ""} ${plan.monto_mensual}`}
                                onSelect={() => {
                                  setForm((f) => ({
                                    ...f,
                                    turno: plan.name,
                                    monto_a_pagar: String(plan.monto_mensual),
                                  }));
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
                                    {plan.name} — S/ {Number(plan.monto_mensual).toLocaleString("es-PE")}
                                  </span>
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {shiftPlans.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay planes de tipo semana/especial. Agrega planes en la BD.</p>
                  )}
                  {shiftPlans.length > 0 && filteredPlans.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay planes en esta categoría.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 w-full">
                  <Input
                    value={turnoPersonalizado}
                    onChange={(e) => setTurnoPersonalizado(e.target.value)}
                    placeholder="Ej. Turno especial 2h, Cuidado puntual..."
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Solo para este registro; no se agrega al catálogo de turnos.</p>
                </div>
              )}
            </div>
            <div className="w-full">
              <Label htmlFor="care-shift-monto">Monto a pagar (S/.) *</Label>
              <Input
                id="care-shift-monto"
                type="number"
                step="0.01"
                min="0"
                value={form.monto_a_pagar}
                onChange={(e) => setForm((f) => ({ ...f, monto_a_pagar: e.target.value }))}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="care-shift-forma-pago">Forma de pago</Label>
              <select
                id="care-shift-forma-pago"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.forma_de_pago}
                onChange={(e) => setForm((f) => ({ ...f, forma_de_pago: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {FORMA_PAGO_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="care-shift-num-op">N° de operación</Label>
              <Input
                id="care-shift-num-op"
                value={form.numero_operacion}
                onChange={(e) => setForm((f) => ({ ...f, numero_operacion: e.target.value }))}
                placeholder="ID de la transacción"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="care-shift-enfermera">Enfermera</Label>
            <Combobox
              id="care-shift-enfermera"
              options={nurseOptions}
              value={form.enfermera}
              onValueChange={(v) => setForm((f) => ({ ...f, enfermera: v }))}
              placeholder="Seleccionar enfermera"
              emptyOption={{ value: "", label: "Seleccionar enfermera" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="care-shift-gastos">Gastos extras (S/.)</Label>
              <Input
                id="care-shift-gastos"
                type="number"
                step="0.01"
                min="0"
                value={form.gastos_extras}
                onChange={(e) => setForm((f) => ({ ...f, gastos_extras: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="care-shift-utilidad">Utilidad (S/.)</Label>
              <Input
                id="care-shift-utilidad"
                type="number"
                step="0.01"
                value={form.utilidad}
                onChange={(e) => setForm((f) => ({ ...f, utilidad: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="care-shift-observacion">Observación</Label>
            <Input
              id="care-shift-observacion"
              value={form.observacion}
              onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
              placeholder="Notas adicionales"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Guardando..." : shift ? "Guardar cambios" : "Registrar turno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal Agregar paciente */}
    <Dialog open={addPatientModalOpen} onOpenChange={setAddPatientModalOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-blue" />
            Crear nuevo paciente
          </DialogTitle>
          <DialogDescription>
            Si no encuentra al paciente en la lista, créelo aquí. Se seleccionará automáticamente para el turno.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={newPatientData.name}
              onChange={(e) => setNewPatientData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <Label>Nro. documento</Label>
            <Input
              value={newPatientData.dni}
              onChange={(e) => setNewPatientData((p) => ({ ...p, dni: e.target.value }))}
              placeholder="Ej. 12345678"
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                value={newPatientData.phone}
                onChange={(e) => setNewPatientData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>
          <div>
            <Label>Distrito</Label>
            <Combobox
              options={districtOptions}
              value={newPatientData.district}
              onValueChange={(v) => setNewPatientData((p) => ({ ...p, district: v }))}
              placeholder="Seleccionar distrito"
              emptyOption={{ value: "", label: "Seleccionar distrito" }}
            />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input
              value={newPatientData.address}
              onChange={(e) => setNewPatientData((p) => ({ ...p, address: e.target.value }))}
              placeholder="Dirección"
            />
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
              Crear paciente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal advertencia: ya hay paciente(s) con ese nombre */}
    <Dialog open={duplicateWarningOpen} onOpenChange={setDuplicateWarningOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Ya hay paciente(s) con ese nombre
          </DialogTitle>
          <DialogDescription>
            Se encontraron pacientes registrados con el mismo nombre (o muy similar). Revisa la lista y confirma si deseas agregar al nuevo paciente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3">
          {duplicatePatients.map((p) => (
            <div key={p.id} className="text-sm font-medium">
              {p.name}
              {p.dni ? ` · DNI ${p.dni}` : ""}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          ¿Estás seguro que deseas agregar el nuevo paciente?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setDuplicateWarningOpen(false); setDuplicatePatients([]); }}
            disabled={creatingPatient}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-primary-blue hover:bg-primary-blue/90"
            onClick={handleConfirmDuplicateAndCreate}
            disabled={creatingPatient}
          >
            {creatingPatient ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agregando...
              </>
            ) : (
              "Sí, agregar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
