/** Estados homologados en toda la app: Pendiente, Completado, Cancelado */

export type EstadoTres = "Pendiente" | "Completado" | "Cancelado";

export const ESTADO_BADGE_CLASS: Record<EstadoTres, string> = {
  Pendiente: "bg-amber-100 text-amber-800 border-amber-300",
  Completado: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Cancelado: "bg-red-100 text-red-800 border-red-300",
};

/** Laboratorio: "En Proceso" y "En toma de muestra" se muestran como Pendiente */
export function normalizeLabEstado(status: string | null | undefined): EstadoTres {
  const s = (status ?? "").trim();
  if (s === "Completado") return "Completado";
  if (s === "Cancelado") return "Cancelado";
  return "Pendiente";
}

export function getLabEstadoBadgeClassName(status: string | null | undefined): string {
  return ESTADO_BADGE_CLASS[normalizeLabEstado(status)];
}

export function getLabEstadoLabel(status: string | null | undefined): EstadoTres {
  return normalizeLabEstado(status);
}

/** Citas: scheduled/confirmed → Pendiente; completed → Completado; cancelled/no-show → Cancelado */
export function normalizeAppointmentEstado(status: string | null | undefined): EstadoTres {
  const s = (status ?? "").trim();
  if (s === "completed") return "Completado";
  if (s === "cancelled" || s === "no-show") return "Cancelado";
  return "Pendiente";
}

export function getAppointmentEstadoBadgeClassName(status: string | null | undefined): string {
  return ESTADO_BADGE_CLASS[normalizeAppointmentEstado(status)];
}

export function getAppointmentEstadoLabel(status: string | null | undefined): EstadoTres {
  return normalizeAppointmentEstado(status);
}

export function getAppointmentEstadoIconClassName(status: string | null | undefined): string {
  const e = normalizeAppointmentEstado(status);
  if (e === "Completado") return "text-emerald-600";
  if (e === "Cancelado") return "text-red-600";
  return "text-amber-600";
}

export function isAppointmentPendiente(status: string | null | undefined): boolean {
  return normalizeAppointmentEstado(status) === "Pendiente";
}

export function isAppointmentCompletado(status: string | null | undefined): boolean {
  return normalizeAppointmentEstado(status) === "Completado";
}

export function isAppointmentCancelado(status: string | null | undefined): boolean {
  return normalizeAppointmentEstado(status) === "Cancelado";
}

/** Filtro de citas por estado homologado (valores: all | pendiente | completado | cancelado) */
export function matchesAppointmentEstadoFilter(
  status: string | null | undefined,
  filter: string
): boolean {
  // Por defecto ("all") no mostrar canceladas; solo con filtro "cancelado"
  if (filter === "all") return !isAppointmentCancelado(status);
  const norm = normalizeAppointmentEstado(status);
  if (filter === "pendiente") return norm === "Pendiente";
  if (filter === "completado") return norm === "Completado";
  if (filter === "cancelado") return norm === "Cancelado";
  // Compatibilidad con filtros legacy por valor de BD
  if (filter === "scheduled" || filter === "confirmed") return norm === "Pendiente";
  if (filter === "completed") return norm === "Completado";
  if (filter === "cancelled") return norm === "Cancelado";
  return status === filter;
}

/** Filtro de laboratorio por estado homologado */
export function matchesLabEstadoFilter(status: string | null | undefined, filter: string): boolean {
  if (filter === "all") return normalizeLabEstado(status) !== "Cancelado";
  return normalizeLabEstado(status) === filter;
}

export function isLabCancelado(status: string | null | undefined): boolean {
  return normalizeLabEstado(status) === "Cancelado";
}
