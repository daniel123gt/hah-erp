import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function todayStr(): string {
  const t = new Date();
  return toStr(t.getFullYear(), t.getMonth(), t.getDate());
}

interface MultiDateCalendarProps {
  /** Fechas seleccionadas en formato YYYY-MM-DD */
  selected: string[];
  onToggle: (dateStr: string) => void;
  /** Si true, no se pueden seleccionar días anteriores a hoy */
  disablePast?: boolean;
}

export function MultiDateCalendar({ selected, onToggle, disablePast = true }: MultiDateCalendarProps) {
  const now = new Date();
  const [view, setView] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const today = todayStr();
  const selectedSet = new Set(selected);

  const firstDay = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Índice de la primera celda con lunes como primer día (0=Lun ... 6=Dom)
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));

  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-gray-400 py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const ds = toStr(view.year, view.month, d);
          const isSelected = selectedSet.has(ds);
          const isToday = ds === today;
          const isPast = disablePast && ds < today;
          return (
            <button
              key={ds}
              type="button"
              disabled={isPast}
              onClick={() => onToggle(ds)}
              className={cn(
                "h-9 rounded-md text-sm transition-colors flex items-center justify-center",
                isPast && "text-gray-300 cursor-not-allowed",
                !isPast && !isSelected && "text-gray-700 hover:bg-blue-50",
                isSelected && "bg-primary-blue text-white font-semibold hover:bg-primary-blue/90",
                isToday && !isSelected && "ring-1 ring-primary-blue/40",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
