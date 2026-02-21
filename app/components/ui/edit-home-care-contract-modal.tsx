import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import type { HomeCareContractWithPatient, HomeCarePlan } from "~/services/homeCareService";
import { toTimeInputValue } from "~/lib/dateUtils";

export type ContractFormData = {
  familiar_encargado: string;
  hora_inicio: string;
  fecha_inicio: string;
  plan_id: string;
  plan_nombre: string;
  plan_monto_mensual: string;
  is_active: boolean;
};

interface EditHomeCareContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: HomeCareContractWithPatient | null;
  plans: HomeCarePlan[];
  onSaved: () => void;
  onSave: (data: ContractFormData) => Promise<void>;
}

export function EditHomeCareContractModal({
  open,
  onOpenChange,
  contract,
  plans,
  onSaved,
  onSave,
}: EditHomeCareContractModalProps) {
  const [form, setForm] = useState<ContractFormData>({
    familiar_encargado: "",
    hora_inicio: "08:00",
    fecha_inicio: "",
    plan_id: "",
    plan_nombre: "",
    plan_monto_mensual: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && contract) {
      const rawPlanId = contract.plan_id != null ? String(contract.plan_id) : "";
      // Si no hay plan_id pero sí plan_nombre, buscar el plan por nombre para preseleccionar
      const plan =
        plans.find((p) => p.id === rawPlanId) ??
        (contract.plan_nombre && plans.length > 0
          ? plans.find(
              (p) =>
                p.name === contract.plan_nombre ||
                (contract.plan_monto_mensual != null && Number(p.monto_mensual) === Number(contract.plan_monto_mensual))
            )
          : null);
      const planId = plan ? plan.id : rawPlanId;
      setForm({
        familiar_encargado: contract.familiar_encargado ?? "",
        hora_inicio: toTimeInputValue(contract.hora_inicio) || "08:00",
        fecha_inicio: contract.fecha_inicio ? contract.fecha_inicio.toString().slice(0, 10) : "",
        plan_id: planId,
        plan_nombre: contract.plan_nombre ?? plan?.name ?? "",
        plan_monto_mensual: String(contract.plan_monto_mensual ?? plan?.monto_mensual ?? ""),
        is_active: contract.is_active ?? true,
      });
    }
  }, [open, contract, plans]);

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      plan_id: planId,
      plan_nombre: plan?.name ?? prev.plan_nombre,
      plan_monto_mensual: plan != null ? String(plan.monto_mensual) : prev.plan_monto_mensual,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    setSaving(true);
    try {
      await onSave(form);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar datos del contrato</DialogTitle>
          <DialogDescription>
            Modifica la información general del contrato de cuidados en casa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Familiar encargado</Label>
            <Input
              value={form.familiar_encargado}
              onChange={(e) => setForm((p) => ({ ...p, familiar_encargado: e.target.value }))}
              placeholder="Nombre del familiar"
            />
          </div>
          <div className="space-y-2">
            <Label>Hora inicio</Label>
            <Input
              type="time"
              value={form.hora_inicio}
              onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha inicio *</Label>
            <Input
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <select
              value={form.plan_id}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Sin plan</option>
              {form.plan_id && !plans.some((p) => p.id === form.plan_id) && (
                <option value={form.plan_id}>
                  {form.plan_nombre || "Plan actual"} – S/ {form.plan_monto_mensual || "0"}
                </option>
              )}
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – S/ {Number(p.monto_mensual).toLocaleString("es-PE")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Monto mensual (S/)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.plan_monto_mensual}
              onChange={(e) => setForm((p) => ({ ...p, plan_monto_mensual: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <select
              value={form.is_active ? "activo" : "inactivo"}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "activo" }))}
              className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? " Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
