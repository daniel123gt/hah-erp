import type { LabExamOrder } from "~/services/labOrderService";

export type LabOrderSortColumn =
  | "id"
  | "sample_date"
  | "status"
  | "patient"
  | "exams"
  | "order_date"
  | "physician"
  | "priority"
  | "total";

export const DEFAULT_LAB_ORDER_SORT: LabOrderSortColumn = "sample_date";
export const DEFAULT_LAB_ORDER_SORT_ASC = false;

function dateMs(value: string | null | undefined): number {
  if (!value) return 0;
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? 0 : t;
}

function priorityRank(p: string | undefined): number {
  if (p === "urgente") return 0;
  if (p === "normal") return 1;
  return 2;
}

/** Ordena en memoria (búsqueda RPC, columna exámenes o respaldo). */
export function sortLabOrders(
  orders: LabExamOrder[],
  column: LabOrderSortColumn,
  ascending: boolean,
  patientNames: Record<string, string> = {}
): LabExamOrder[] {
  const dir = ascending ? 1 : -1;
  return [...orders].sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "sample_date":
        cmp =
          dateMs(a.sample_date ?? a.order_date) - dateMs(b.sample_date ?? b.order_date);
        break;
      case "status":
        cmp = (a.status ?? "").localeCompare(b.status ?? "", "es");
        break;
      case "patient": {
        const na = patientNames[a.patient_id] ?? "";
        const nb = patientNames[b.patient_id] ?? "";
        cmp = na.localeCompare(nb, "es", { sensitivity: "base" });
        break;
      }
      case "exams":
        cmp = (a.items?.length ?? 0) - (b.items?.length ?? 0);
        break;
      case "order_date":
        cmp = dateMs(a.order_date) - dateMs(b.order_date);
        break;
      case "physician":
        cmp = (a.physician_name ?? "").localeCompare(b.physician_name ?? "", "es", {
          sensitivity: "base",
        });
        break;
      case "priority":
        cmp = priorityRank(a.priority) - priorityRank(b.priority);
        break;
      case "total":
        cmp = Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0);
        break;
      default:
        cmp = 0;
    }
    if (cmp === 0) {
      cmp = dateMs(b.created_at) - dateMs(a.created_at);
    }
    return cmp * dir;
  });
}

export function needsClientSideLabSort(column: LabOrderSortColumn): boolean {
  return column === "exams";
}
