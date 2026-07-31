/** Método de pago normalizado para filtrar reportes (unifica los valores de cada módulo). */
export type PaymentMethodKey = "yape" | "plin" | "transferencia" | "efectivo" | "tarjeta" | "otro";

export const PAYMENT_METHOD_FILTER_OPTIONS: { value: PaymentMethodKey | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los métodos" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta / Link / POS" },
  { value: "otro", label: "Otro" },
];

/**
 * Normaliza el método de pago crudo (que difiere por módulo: "YAPE", "yape",
 * "transfer_deposito", "TRANSFERENCIA", "Tarjeta/Link/POS", etc.) a una clave común.
 * Devuelve "" si no hay método.
 */
export function normalizePaymentMethod(raw: string | null | undefined): PaymentMethodKey | "" {
  const s = (raw ?? "").toString().trim().toLowerCase();
  if (!s || s === "sin definir" || s === "-") return "";
  if (s.includes("yape")) return "yape";
  if (s.includes("plin")) return "plin";
  if (s.includes("transfer") || s.includes("deposito") || s.includes("depósito")) return "transferencia";
  if (s.includes("efectivo") || s.includes("cash")) return "efectivo";
  if (s.includes("tarjeta") || s.includes("pos") || s.includes("link")) return "tarjeta";
  return "otro";
}

/** ¿El método crudo coincide con el filtro seleccionado? (filtro "todos" siempre pasa) */
export function matchesPaymentFilter(raw: string | null | undefined, filter: PaymentMethodKey | "todos"): boolean {
  if (filter === "todos") return true;
  return normalizePaymentMethod(raw) === filter;
}

/** Etiqueta legible del método de pago para mostrar en tablas ("—" si no hay). */
export function paymentMethodLabel(raw: string | null | undefined): string {
  switch (normalizePaymentMethod(raw)) {
    case "yape": return "Yape";
    case "plin": return "Plin";
    case "transferencia": return "Transferencia";
    case "efectivo": return "Efectivo";
    case "tarjeta": return "Tarjeta / Link / POS";
    case "otro": return "Otro";
    default: return "—";
  }
}
