import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha ISO o YYYY-MM-DD como fecha local (evita desfase de un día por UTC).
 * Útil para order_date y campos que se guardan solo como fecha.
 */
export function formatDateOnly(isoOrDateStr: string | null | undefined, locale = "es-ES"): string {
  if (isoOrDateStr == null) return "";
  const s = String(isoOrDateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoOrDateStr;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}
