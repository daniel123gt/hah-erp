import { useState, useEffect, useLayoutEffect, useMemo } from "react";
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
import { Loader2, Plus, X } from "lucide-react";
import type { HomeCarePeriod } from "~/services/homeCareService";

function addDays(isoDate: string, days: number): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const YEAR_MIN = 2020;
const YEAR_MAX = 2035;

/** Convierte día/mes/año a ISO YYYY-MM-DD si el año es válido */
function toIsoOrNull(day: number, month: number, year: number): string | null {
  if (year < YEAR_MIN || year > YEAR_MAX) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parsea un trozo de texto a una fecha ISO (una sola). Acepta YYYY-MM-DD o DD/MM/YYYY o D/M/YYYY */
function parseSingleToIso(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const y = parseInt(t.slice(0, 4), 10);
    return y >= YEAR_MIN && y <= YEAR_MAX ? t : null;
  }
  const ddmmyy = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyy) {
    const [, d, m, y] = ddmmyy;
    return toIsoOrNull(parseInt(d, 10), parseInt(m, 10), parseInt(y, 10));
  }
  return null;
}

/**
 * Parsea una cadena de fechas en múltiples formatos legacy y devuelve siempre un array de fechas ISO.
 * Formatos aceptados: "0", vacío, YYYY-MM-DD, DD/MM/YYYY, D/M/YYYY,
 * "23-28-29/07/2025" (varios días mismo mes/año), "08 Y 09/12/2025", separadores , ; - Y
 */
function parseFechasFromString(s: string | null | undefined): string[] {
  if (s == null) return [];
  if (typeof s !== "string") return [];
  const raw = s.trim();
  if (!raw || raw === "0") return [];
  const seen = new Set<string>();
  const result: string[] = [];

  // Primero partir por " Y " (Y como conjunción) y por comas/semicolons
  const parts = raw
    .split(/\s*[,;]\s*|\s+Y\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const pendingDays: number[] = [];
  let lastMonth: number | null = null;
  let lastYear: number | null = null;

  function flushPendingDays() {
    if (lastMonth == null || lastYear == null) return;
    for (const day of pendingDays) {
      const iso = toIsoOrNull(day, lastMonth, lastYear);
      if (iso && !seen.has(iso)) {
        seen.add(iso);
        result.push(iso);
      }
    }
    pendingDays.length = 0;
  }

  for (const part of parts) {
    // Formato "23-28-29/07/2025" o "23-28/07/2025": varios días, mismo mes/año
    const multiDayMatch = part.match(/^(\d{1,2}(?:-\d{1,2})*)[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (multiDayMatch) {
      flushPendingDays();
      const [, daysStr, m, y] = multiDayMatch;
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      const days = daysStr.split("-").map((d) => parseInt(d.trim(), 10)).filter((n) => n >= 1 && n <= 31);
      for (const day of days) {
        const iso = toIsoOrNull(day, month, year);
        if (iso && !seen.has(iso)) {
          seen.add(iso);
          result.push(iso);
        }
      }
      lastMonth = month;
      lastYear = year;
      continue;
    }

    // Solo dígitos (día): guardar y resolver cuando tengamos mes/año (ej. "08 Y 09/12/2025")
    if (/^\d{1,2}$/.test(part)) {
      const day = parseInt(part, 10);
      if (day >= 1 && day <= 31) pendingDays.push(day);
      continue;
    }

    // Fecha suelta: ISO o DD/MM/YYYY → al tener mes/año, resolver días pendientes
    const iso = parseSingleToIso(part);
    if (iso && !seen.has(iso)) {
      flushPendingDays();
      seen.add(iso);
      result.push(iso);
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        lastMonth = d.getMonth() + 1;
        lastYear = d.getFullYear();
      }
    }
  }
  flushPendingDays();

  return result.sort();
}

/** Para inputs del usuario: acepta ISO o DD/MM/YYYY y devuelve ISO o null */
function normalizeToIsoDate(value: string): string | null {
  return parseSingleToIso(value);
}

/** Formato estándar al guardar: solo fechas ISO separadas por ", " (nunca "0") */
export function fechasToStandardString(fechas: string[]): string {
  const isos = fechas
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => {
      const y = parseInt(d.slice(0, 4), 10);
      return y >= YEAR_MIN && y <= YEAR_MAX;
    });
  return isos.length ? isos.join(", ") : "";
}

/** Normaliza el valor de f_feriados/f_pausas que puede venir como string o array desde la API */
function fechasFromPeriodField(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .flatMap((s) => parseFechasFromString(s))
      .filter((x, i, arr) => arr.indexOf(x) === i);
  }
  return parseFechasFromString(typeof value === "string" ? value : String(value));
}

export const PERIOD_PAYMENT_METHODS = [
  { value: "TRANFERENCIA", label: "Transferencia" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
] as const;

export type PeriodFormData = {
  fecha_pago_quincena: string;
  f_desde: string;
  f_hasta: string;
  f_feriados: string;
  n_feriados: string;
  m_feriados: string;
  horas_pausa: string;
  p_del_serv: string;
  f_pausas: string;
  monto_total: string;
  fecha_pago: string;
  metodo_pago: string;
  numero_operacion: string;
  factura_boleta: string;
};

const emptyForm: PeriodFormData = {
  fecha_pago_quincena: "",
  f_desde: "",
  f_hasta: "",
  f_feriados: "",
  n_feriados: "0",
  m_feriados: "0",
  horas_pausa: "0",
  p_del_serv: "0",
  f_pausas: "",
  monto_total: "",
  fecha_pago: "",
  metodo_pago: "",
  numero_operacion: "",
  factura_boleta: "",
};

function parseHorasFromPdelServ(s: string | null): number {
  if (!s?.trim()) return 0;
  const n = parseFloat(s.replace(/\D/g, "")) || 0;
  return Number.isFinite(n) ? n : 0;
}

function periodToForm(p: HomeCarePeriod, montoQuincena: number): PeriodFormData {
  const horas = parseHorasFromPdelServ(p.p_del_serv);
  const feriadosStr = (p.f_feriados != null ? String(p.f_feriados) : "").trim();
  const pausasStr = (p.f_pausas != null ? String(p.f_pausas) : "").trim();
  const n_feriados = parseFechasFromString(feriadosStr).length;
  const m_feriados = n_feriados * (montoQuincena / 15);
  return {
    fecha_pago_quincena: p.fecha_pago_quincena ? p.fecha_pago_quincena.toString().slice(0, 10) : "",
    f_desde: p.f_desde ? p.f_desde.toString().slice(0, 10) : "",
    f_hasta: p.f_hasta ? p.f_hasta.toString().slice(0, 10) : "",
    f_feriados: feriadosStr,
    n_feriados: String(n_feriados),
    m_feriados: m_feriados.toFixed(2),
    horas_pausa: String(horas),
    p_del_serv: p.p_del_serv ?? "0",
    f_pausas: pausasStr,
    monto_total: String(p.monto_total ?? 0),
    fecha_pago: p.fecha_pago ?? "",
    metodo_pago: p.metodo_pago ?? "",
    numero_operacion: p.numero_operacion ?? "",
    factura_boleta: p.factura_boleta ?? "",
  };
}

interface HomeCarePeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  contractId: string;
  planMontoMensual: number;
  period?: HomeCarePeriod | null;
  onSaved: () => void;
  onSave: (data: PeriodFormData) => Promise<void>;
}

export function HomeCarePeriodModal({
  open,
  onOpenChange,
  mode,
  contractId,
  planMontoMensual,
  period,
  onSaved,
  onSave,
}: HomeCarePeriodModalProps) {
  const montoQuincena = useMemo(
    () => (planMontoMensual > 0 ? planMontoMensual / 2 : 2500),
    [planMontoMensual]
  );
  const montoPorDia = montoQuincena / 15;
  const montoPorHora = montoQuincena / 15 / 24;

  const [form, setForm] = useState<PeriodFormData>(() =>
    open && period
      ? periodToForm(period, montoQuincena)
      : { ...emptyForm, monto_total: montoQuincena.toFixed(2) }
  );
  const [saving, setSaving] = useState(false);
  const [feriadosDates, setFeriadosDates] = useState<string[]>([]);
  const [pausasDates, setPausasDates] = useState<string[]>([]);
  const [fechaPagoDates, setFechaPagoDates] = useState<string[]>([]);
  const [nuevaFeriado, setNuevaFeriado] = useState("");
  const [nuevaPausa, setNuevaPausa] = useState("");
  const [nuevaFechaPago, setNuevaFechaPago] = useState("");

  // Sincronizar form y arrays al abrir (useLayoutEffect para evitar parpadeo de chips vacíos)
  useLayoutEffect(() => {
    if (!open) return;
    if (period) {
      const f = periodToForm(period, montoQuincena);
      setForm(f);
      setFeriadosDates(parseFechasFromString(f.f_feriados));
      setPausasDates(parseFechasFromString(f.f_pausas));
      setFechaPagoDates(parseFechasFromString(f.fecha_pago));
    } else {
      setForm({ ...emptyForm, monto_total: montoQuincena.toFixed(2) });
      setFeriadosDates([]);
      setPausasDates([]);
      setFechaPagoDates([]);
    }
    setNuevaFeriado("");
    setNuevaPausa("");
    setNuevaFechaPago("");
  }, [open, period, montoQuincena]);

  const syncFormFromArrays = (
    feriados: string[],
    pausas: string[],
    prev: PeriodFormData
  ): PeriodFormData => {
    const n_feriados = feriados.length;
    const m_feriados = n_feriados * montoPorDia;
    const horas_pausa = parseFloat(prev.horas_pausa) || 0;
    const descuentoPausa = horas_pausa * montoPorHora;
    const monto_total = montoQuincena + m_feriados - descuentoPausa;
    return {
      ...prev,
      f_feriados: feriados.join(", "),
      n_feriados: String(n_feriados),
      m_feriados: m_feriados.toFixed(2),
      f_pausas: pausas.join(", "),
      monto_total: monto_total.toFixed(2),
    };
  };

  const handleChange = (field: keyof PeriodFormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "fecha_pago_quincena" && value) {
        next.f_desde = value;
        next.f_hasta = addDays(value, 15);
      }
      if (field === "horas_pausa") {
        const h = parseFloat(value) || 0;
        next.p_del_serv = h > 0 ? `${h} HORAS` : "0";
      }
      const n_feriados = feriadosDates.length;
      const horas_pausa = parseFloat(next.horas_pausa) || 0;
      const m_feriados = n_feriados * montoPorDia;
      const descuentoPausa = horas_pausa * montoPorHora;
      next.monto_total = (montoQuincena + m_feriados - descuentoPausa).toFixed(2);
      next.m_feriados = m_feriados.toFixed(2);
      return next;
    });
  };

  const addFeriado = () => {
    const iso = normalizeToIsoDate(nuevaFeriado);
    if (!iso) return;
    if (feriadosDates.includes(iso)) return;
    const next = [...feriadosDates, iso].sort();
    setFeriadosDates(next);
    setNuevaFeriado("");
    setForm((prev) => syncFormFromArrays(next, pausasDates, prev));
  };

  const removeFeriado = (idx: number) => {
    const next = feriadosDates.filter((_, i) => i !== idx);
    setFeriadosDates(next);
    setForm((prev) => syncFormFromArrays(next, pausasDates, prev));
  };

  const addPausa = () => {
    const iso = normalizeToIsoDate(nuevaPausa);
    if (!iso) return;
    if (pausasDates.includes(iso)) return;
    const next = [...pausasDates, iso].sort();
    setPausasDates(next);
    setNuevaPausa("");
    setForm((prev) => ({
      ...prev,
      f_pausas: next.join(", "),
    }));
  };

  const removePausa = (idx: number) => {
    const next = pausasDates.filter((_, i) => i !== idx);
    setPausasDates(next);
    setForm((prev) => ({ ...prev, f_pausas: next.join(", ") }));
  };

  const addFechaPago = () => {
    const iso = normalizeToIsoDate(nuevaFechaPago);
    if (!iso) return;
    if (fechaPagoDates.includes(iso)) return;
    const next = [...fechaPagoDates, iso].sort();
    setFechaPagoDates(next);
    setNuevaFechaPago("");
    setForm((prev) => ({ ...prev, fecha_pago: next.join(", ") }));
  };

  const removeFechaPago = (idx: number) => {
    const next = fechaPagoDates.filter((_, i) => i !== idx);
    setFechaPagoDates(next);
    setForm((prev) => ({ ...prev, fecha_pago: fechasToStandardString(next) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: PeriodFormData = {
        ...form,
        f_feriados: fechasToStandardString(feriadosDates),
        f_pausas: fechasToStandardString(pausasDates),
        fecha_pago: fechasToStandardString(fechaPagoDates),
        n_feriados: String(feriadosDates.length),
        m_feriados: (feriadosDates.length * montoPorDia).toFixed(2),
        monto_total: (
          montoQuincena +
          feriadosDates.length * montoPorDia -
          (parseFloat(form.horas_pausa) || 0) * montoPorHora
        ).toFixed(2),
      };
      await onSave(payload);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? "Agregar periodo quincenal" : "Editar periodo";
  const description =
    mode === "add"
      ? "Completa los datos del nuevo periodo de cobro."
      : "Modifica los datos del periodo.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>F. pago quincena</Label>
              <Input
                type="date"
                value={form.fecha_pago_quincena}
                onChange={(e) => handleChange("fecha_pago_quincena", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Turno</Label>
              <Input value="24X24" readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Monto base quincena</Label>
              <Input
                value={`S/ ${montoQuincena.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-1">
              <Label>F. desde *</Label>
              <Input
                type="date"
                value={form.f_desde}
                onChange={(e) => handleChange("f_desde", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>F. hasta *</Label>
              <Input
                type="date"
                value={form.f_hasta}
                onChange={(e) => handleChange("f_hasta", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>F. feriados</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  value={nuevaFeriado}
                  onChange={(e) => setNuevaFeriado(e.target.value)}
                  className="w-[140px]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addFeriado}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              {feriadosDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {feriadosDates.map((d, idx) => (
                    <span
                      key={`${d}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      {new Date(d + "T12:00:00").toLocaleDateString("es-PE")}
                      <button
                        type="button"
                        onClick={() => removeFeriado(idx)}
                        className="rounded hover:bg-muted-foreground/20 p-0.5"
                        aria-label="Quitar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                N° feriados: {feriadosDates.length} → M. feriados (auto): S/ {form.m_feriados}
              </p>
            </div>
            <div className="space-y-1">
              <Label>M. feriados (auto)</Label>
              <Input
                value={form.m_feriados}
                readOnly
                className="bg-muted"
                title="N° feriados × (monto quincena / 15)"
              />
            </div>
            <div className="space-y-1">
              <Label>Horas de pausa</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={form.horas_pausa}
                onChange={(e) => handleChange("horas_pausa", e.target.value)}
                title="Por hora se descuenta: monto quincena / 15 / 24"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>F. pausas</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  value={nuevaPausa}
                  onChange={(e) => setNuevaPausa(e.target.value)}
                  className="w-[140px]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPausa}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              {pausasDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pausasDates.map((d, idx) => (
                    <span
                      key={`${d}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      {new Date(d + "T12:00:00").toLocaleDateString("es-PE")}
                      <button
                        type="button"
                        onClick={() => removePausa(idx)}
                        className="rounded hover:bg-muted-foreground/20 p-0.5"
                        aria-label="Quitar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Monto total (auto)</Label>
              <Input
                value={form.monto_total}
                readOnly
                className="bg-muted font-medium"
                title="Monto base + M. feriados - descuento por horas de pausa"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Fecha de pago</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  value={nuevaFechaPago}
                  onChange={(e) => setNuevaFechaPago(e.target.value)}
                  className="w-[140px]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addFechaPago}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              {fechaPagoDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {fechaPagoDates.map((d, idx) => (
                    <span
                      key={`${d}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      {new Date(d + "T12:00:00").toLocaleDateString("es-PE")}
                      <button
                        type="button"
                        onClick={() => removeFechaPago(idx)}
                        className="rounded hover:bg-muted-foreground/20 p-0.5"
                        aria-label="Quitar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Método de pago</Label>
              <select
                value={form.metodo_pago}
                onChange={(e) => handleChange("metodo_pago", e.target.value)}
                className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar</option>
                {PERIOD_PAYMENT_METHODS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>N° operación</Label>
              <Input
                value={form.numero_operacion}
                onChange={(e) => handleChange("numero_operacion", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Factura/Boleta</Label>
              <Input
                value={form.factura_boleta}
                onChange={(e) => handleChange("factura_boleta", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? " Guardando..." : mode === "add" ? "Agregar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
