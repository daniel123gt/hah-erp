import supabase from "~/utils/supabase";
import { getTodayLocal } from "~/lib/dateUtils";

export type LeadType = "llamada" | "whatsapp";
export type LeadCategory = "potencial" | "basura" | "no_apto";

export interface ContactLead {
  id: string;
  type: LeadType;
  category: LeadCategory;
  notes?: string | null;
  created_by?: string | null;
  created_by_email?: string | null;
  created_at: string;
}

export interface CreateLeadData {
  type: LeadType;
  category: LeadCategory;
  notes?: string;
}

export interface TodayLeadCounts {
  total: number;
  potencial: number;
  basura: number;
  no_apto: number;
}

// Etiquetas para mostrar en la UI.
export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  llamada: "Llamada",
  whatsapp: "Mensaje de WhatsApp",
};

export const LEAD_CATEGORY_LABELS: Record<LeadCategory, string> = {
  potencial: "Cliente potencial",
  basura: "Basura",
  no_apto: "Cliente no apto",
};

export const leadsService = {
  async createLead(data: CreateLeadData): Promise<ContactLead> {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const { data: inserted, error } = await supabase
      .from("contact_leads")
      .insert([
        {
          type: data.type,
          category: data.category,
          notes: data.notes?.trim() || null,
          created_by: user?.id ?? null,
          created_by_email: user?.email ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return inserted as ContactLead;
  },

  /** Conteo de registros de hoy (día de Perú, UTC-5), total y por categoría. */
  async getTodayCounts(): Promise<TodayLeadCounts> {
    const today = getTodayLocal();
    const start = new Date(`${today}T00:00:00-05:00`).toISOString();
    const end = new Date(`${today}T00:00:00-05:00`);
    end.setDate(end.getDate() + 1);
    const endIso = end.toISOString();

    const { data, error } = await supabase
      .from("contact_leads")
      .select("category")
      .gte("created_at", start)
      .lt("created_at", endIso);

    if (error) throw error;

    const counts: TodayLeadCounts = { total: 0, potencial: 0, basura: 0, no_apto: 0 };
    (data ?? []).forEach((row: { category: LeadCategory }) => {
      counts.total += 1;
      if (row.category in counts) counts[row.category] += 1;
    });
    return counts;
  },

  /** Lista de registros en un rango [fromYMD, toYMD] (para reportes futuros). */
  async getLeads(fromYMD: string, toYMD: string): Promise<ContactLead[]> {
    const start = new Date(`${fromYMD}T00:00:00-05:00`).toISOString();
    const end = new Date(`${toYMD}T00:00:00-05:00`);
    end.setDate(end.getDate() + 1);
    const endIso = end.toISOString();

    const { data, error } = await supabase
      .from("contact_leads")
      .select("*")
      .gte("created_at", start)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ContactLead[];
  },
};

export default leadsService;
