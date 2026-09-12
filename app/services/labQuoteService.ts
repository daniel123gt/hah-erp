import supabase from "~/utils/supabase";
import { procedureService } from "~/services/procedureService";
import labOrderService, { type LabExamOrder } from "~/services/labOrderService";

const TOMA_DE_MUESTRA_NAME = "toma de muestra";
const RECARGO_FALLBACK = 120;

export type LabQuoteStatus = "Pendiente" | "Convertida" | "Vencida" | "Anulada";

export interface LabQuoteItem {
  id: string;
  exam_id: string | null;
  exam_code: string;
  exam_name: string;
  price: number;
}

export interface LabQuote {
  id: string;
  quote_number: string;
  status: LabQuoteStatus;
  total_amount: number;
  observations?: string | null;
  order_id?: string | null;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
  items: LabQuoteItem[];
}

export interface CreateLabQuoteData {
  /** IDs de los exámenes seleccionados */
  exam_ids: string[];
  observations?: string;
  valid_until?: string | null;
}

export interface ConvertQuoteData {
  patient_id: string;
  order_date: string;
  sample_date?: string | null;
  physician_name?: string;
  priority?: "urgente" | "normal" | "programada";
  observations?: string;
}

const parsePrice = (precio: string) =>
  parseFloat(String(precio).replace("S/", "").replace(",", "").trim()) || 0;

export const labQuoteService = {
  /**
   * Crea una cotización con los exámenes seleccionados. El precio de cada examen
   * se congela (mismo cálculo que la orden: precio * 1.2 + recargo de toma de muestra).
   */
  async createQuote(data: CreateLabQuoteData): Promise<LabQuote> {
    if (!data.exam_ids || data.exam_ids.length === 0) {
      throw new Error("Debes seleccionar al menos un examen");
    }

    const { data: exams, error: examsError } = await supabase
      .from("laboratory_exams")
      .select("id, codigo, nombre, precio")
      .in("id", data.exam_ids);

    if (examsError) throw examsError;
    if (!exams || exams.length === 0) {
      throw new Error("No se encontraron los exámenes seleccionados");
    }

    const tomaMuestra = await procedureService.getProcedureByName(TOMA_DE_MUESTRA_NAME);
    const RECARGO_TOTAL = tomaMuestra?.base_price_soles ?? RECARGO_FALLBACK;
    const recargoUnitario = exams.length > 0 ? RECARGO_TOTAL / exams.length : 0;

    const itemsToInsert = exams.map((exam) => ({
      exam_id: exam.id,
      exam_code: exam.codigo,
      exam_name: exam.nombre,
      price: parsePrice(exam.precio) * 1.2 + recargoUnitario,
    }));

    const totalAmount = itemsToInsert.reduce((acc, it) => acc + it.price, 0);

    const { data: quote, error: quoteError } = await supabase
      .from("lab_quotes")
      .insert([
        {
          total_amount: totalAmount,
          observations: data.observations || null,
          valid_until: data.valid_until || null,
          status: "Pendiente",
        },
      ])
      .select()
      .single();

    if (quoteError) throw quoteError;

    const { error: itemsError } = await supabase
      .from("lab_quote_items")
      .insert(itemsToInsert.map((it) => ({ ...it, quote_id: quote.id })));

    if (itemsError) throw itemsError;

    return this.getQuoteById(quote.id);
  },

  async getQuoteById(quoteId: string): Promise<LabQuote> {
    const { data: quote, error: quoteError } = await supabase
      .from("lab_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError) throw quoteError;

    const { data: items, error: itemsError } = await supabase
      .from("lab_quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...quote,
      items: (items || []).map((it) => ({
        id: it.id,
        exam_id: it.exam_id,
        exam_code: it.exam_code,
        exam_name: it.exam_name,
        price: Number(it.price),
      })),
    } as LabQuote;
  },

  async getQuotes(params?: { search?: string; status?: LabQuoteStatus | "all" }): Promise<LabQuote[]> {
    let query = supabase
      .from("lab_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params?.search?.trim()) {
      query = query.ilike("quote_number", `%${params.search.trim()}%`);
    }

    const { data: quotes, error } = await query;
    if (error) throw error;

    const ids = (quotes || []).map((q) => q.id);
    let itemsByQuote: Record<string, LabQuoteItem[]> = {};
    if (ids.length > 0) {
      const { data: items } = await supabase
        .from("lab_quote_items")
        .select("*")
        .in("quote_id", ids);
      itemsByQuote = (items || []).reduce((acc, it) => {
        (acc[it.quote_id] ||= []).push({
          id: it.id,
          exam_id: it.exam_id,
          exam_code: it.exam_code,
          exam_name: it.exam_name,
          price: Number(it.price),
        });
        return acc;
      }, {} as Record<string, LabQuoteItem[]>);
    }

    return (quotes || []).map((q) => ({ ...q, items: itemsByQuote[q.id] || [] })) as LabQuote[];
  },

  /**
   * Convierte una cotización en una orden real, respetando los precios congelados.
   * Marca la cotización como "Convertida" y la enlaza con la orden creada.
   */
  async convertToOrder(quoteId: string, data: ConvertQuoteData): Promise<LabExamOrder> {
    const quote = await this.getQuoteById(quoteId);
    if (quote.status === "Convertida" && quote.order_id) {
      throw new Error("Esta cotización ya fue convertida en una orden");
    }
    if (quote.items.length === 0) {
      throw new Error("La cotización no tiene exámenes");
    }

    // Crear la orden con el total congelado.
    const { data: order, error: orderError } = await supabase
      .from("lab_exam_orders")
      .insert([
        {
          patient_id: data.patient_id,
          order_date: data.order_date,
          sample_date: data.sample_date || null,
          physician_name: data.physician_name || null,
          priority: data.priority || "normal",
          observations: data.observations ?? quote.observations ?? null,
          total_amount: quote.total_amount,
          status: "Pendiente",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Ítems con el precio congelado de la cotización.
    const items = quote.items.map((it) => ({
      order_id: order.id,
      exam_id: it.exam_id,
      exam_code: it.exam_code,
      exam_name: it.exam_name,
      price: it.price,
      status: "Pendiente",
    }));

    const { error: itemsError } = await supabase.from("lab_exam_order_items").insert(items);
    if (itemsError) throw itemsError;

    const { error: updError } = await supabase
      .from("lab_quotes")
      .update({ status: "Convertida", order_id: order.id })
      .eq("id", quoteId);
    if (updError) throw updError;

    return labOrderService.getOrderById(order.id);
  },

  async annulQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from("lab_quotes")
      .update({ status: "Anulada" })
      .eq("id", quoteId);
    if (error) throw error;
  },
};

export default labQuoteService;
