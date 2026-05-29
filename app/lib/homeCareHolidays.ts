/** Feriados con recargo doble: monto quincena / 7.5 (en lugar de / 15). */
const SPECIAL_HOLIDAY_MM_DD = new Set(["01-01", "07-28", "07-29", "12-25"]);

function monthDayFromIso(isoDate: string): string | null {
  const normalized = isoDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized.slice(5);
}

/** 1 ene, 28-29 jul y 25 dic: recargo doble (÷ 7.5). */
export function isSpecialHomeCareHoliday(isoDate: string): boolean {
  const mmdd = monthDayFromIso(isoDate);
  return mmdd != null && SPECIAL_HOLIDAY_MM_DD.has(mmdd);
}

/** Recargo por un día feriado según tipo (normal ÷15, especial ÷7.5). */
export function montoRecargoPorFeriado(montoQuincena: number, isoDate: string): number {
  const divisor = isSpecialHomeCareHoliday(isoDate) ? 7.5 : 15;
  return montoQuincena / divisor;
}

/** Suma el recargo de todos los feriados del periodo. */
export function computeMontoFeriados(montoQuincena: number, feriadoDates: string[]): number {
  return feriadoDates.reduce((sum, d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.trim().slice(0, 10))) return sum;
    return sum + montoRecargoPorFeriado(montoQuincena, d);
  }, 0);
}
