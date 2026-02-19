"use client";

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
import { Combobox } from "./combobox";
import { Loader2 } from "lucide-react";
import type { CareShiftWithPatient, CreateCareShiftData } from "~/services/shiftCareService";
import { patientsService } from "~/services/patientsService";
import { homeCareService, type HomeCarePlan } from "~/services/homeCareService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";

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
  const [planOptions, setPlanOptions] = useState<{ value: string; label: string; monto: number }[]>([]);
  const [nurseOptions, setNurseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    setForm(shiftToForm(shift));
  }, [shift, open]);

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
      homeCareService.getPlans().then((plans: HomeCarePlan[]) => {
        setPlanOptions(
          plans.map((p) => ({
            value: p.name,
            label: `${p.name} — S/ ${Number(p.monto_mensual).toLocaleString("es-PE")}`,
            monto: Number(p.monto_mensual),
          }))
        );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fecha.trim()) return;
    const monto = parseFloat(form.monto_a_pagar) || 0;
    setLoading(true);
    try {
      const payload: CreateCareShiftData = {
        fecha: form.fecha.slice(0, 10),
        hora_inicio: form.hora_inicio.trim() || null,
        patient_id: form.patient_id || null,
        familiar_responsable: form.familiar_responsable.trim() || null,
        distrito: form.distrito.trim() || null,
        turno: form.turno.trim() || null,
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

          <div>
            <Label>Paciente</Label>
            <Combobox
              options={patientOptions}
              value={form.patient_id}
              onValueChange={(v) => setForm((f) => ({ ...f, patient_id: v }))}
              placeholder="Buscar paciente..."
              emptyOption={{ value: "", label: "Sin asignar" }}
            />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Turno (duración)</Label>
              <Combobox
                options={planOptions.map((o) => ({ value: o.value, label: o.label }))}
                value={form.turno}
                onValueChange={(v) => {
                  const opt = planOptions.find((o) => o.value === v);
                  setForm((f) => ({
                    ...f,
                    turno: v,
                    monto_a_pagar: opt ? String(opt.monto) : f.monto_a_pagar,
                  }));
                }}
                placeholder="Seleccionar turno"
                emptyOption={{ value: "", label: "Seleccionar turno" }}
              />
            </div>
            <div>
              <Label htmlFor="care-shift-monto">Monto a pagar (S/.) *</Label>
              <Input
                id="care-shift-monto"
                type="number"
                step="0.01"
                min="0"
                value={form.monto_a_pagar}
                onChange={(e) => setForm((f) => ({ ...f, monto_a_pagar: e.target.value }))}
                required
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {shift ? "Guardar cambios" : "Registrar turno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
