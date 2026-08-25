import supabase from "~/utils/supabase";
import { normalizeSearchText } from "~/lib/utils";

/** Tipos de egreso de Movilidad. */
export const MOVILIDAD_TYPES: { value: string; label: string }[] = [
  { value: "taxi", label: "Taxi" },
  { value: "combustible", label: "Combustible" },
  { value: "mantenimiento", label: "Mantenimiento de vehículo" },
  { value: "otro", label: "Otro" },
];

export function movilidadTypeLabel(type: string | null | undefined): string {
  const found = MOVILIDAD_TYPES.find((t) => t.value === type);
  return found ? found.label : type || "—";
}

/** Métodos de pago del egreso (con qué se pagó el gasto). */
export const EXPENSE_PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta / Link / POS" },
];

export interface Expense {
  id: string;
  fecha: string;
  category: string;
  type: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  numero_operacion: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseData {
  fecha: string;
  category?: string;
  type: string;
  description?: string | null;
  amount?: number;
  payment_method?: string | null;
  numero_operacion?: string | null;
  notes?: string | null;
}

export interface UpdateExpenseData extends CreateExpenseData {
  id: string;
}

export const expensesService = {
  async list(options: {
    category?: string;
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    search?: string;
    type?: string;
  } = {}): Promise<{ data: Expense[]; total: number }> {
    const { category = "movilidad", page = 1, limit = 20, fromDate, toDate, search = "", type } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("category", category)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("fecha", fromDate);
    if (toDate) query = query.lte("fecha", toDate);
    if (type) query = query.eq("type", type);
    if (search.trim()) {
      const term = normalizeSearchText(search);
      if (term) {
        query = query.or(
          `description.ilike.%${term}%,numero_operacion.ilike.%${term}%,notes.ilike.%${term}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data ?? []) as Expense[];
    rows.forEach((r) => {
      if (r.fecha && r.fecha.length > 10) r.fecha = r.fecha.slice(0, 10);
    });
    return { data: rows, total: count ?? 0 };
  },

  /** Total de egresos (suma de amount) en un rango, por categoría. */
  async getTotal(options: { category?: string; fromDate?: string; toDate?: string } = {}): Promise<number> {
    const { category = "movilidad", fromDate, toDate } = options;
    let query = supabase.from("expenses").select("amount").eq("category", category);
    if (fromDate) query = query.gte("fecha", fromDate);
    if (toDate) query = query.lte("fecha", toDate);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).reduce((s, r: { amount?: number }) => s + Number(r.amount ?? 0), 0);
  },

  async create(data: CreateExpenseData): Promise<Expense> {
    const { data: row, error } = await supabase
      .from("expenses")
      .insert({
        fecha: data.fecha,
        category: data.category ?? "movilidad",
        type: data.type,
        description: data.description?.trim() || null,
        amount: Number(data.amount ?? 0),
        payment_method: data.payment_method ?? null,
        numero_operacion: data.numero_operacion?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as Expense;
  },

  async update(data: UpdateExpenseData): Promise<Expense> {
    const { id, ...rest } = data;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (rest.fecha !== undefined) payload.fecha = rest.fecha;
    if (rest.type !== undefined) payload.type = rest.type;
    if (rest.description !== undefined) payload.description = rest.description?.trim() || null;
    if (rest.amount !== undefined) payload.amount = Number(rest.amount ?? 0);
    if (rest.payment_method !== undefined) payload.payment_method = rest.payment_method ?? null;
    if (rest.numero_operacion !== undefined) payload.numero_operacion = rest.numero_operacion?.trim() || null;
    if (rest.notes !== undefined) payload.notes = rest.notes?.trim() || null;
    const { data: row, error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as Expense;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  },
};
