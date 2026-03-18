import supabase from "~/utils/supabase";
import { toLocalDateString } from "~/lib/dateUtils";
import { normalizeSearchText } from "~/lib/utils";

export interface RxEcografiaRecord {
  id: string;
  appointment_id: string | null;
  fecha: string;
  patient_id: string | null;
  patient_name: string | null;
  appointment_type: string;
  doctor_name: string | null;
  ingreso: number;
  costo: number;
  payment_method: string | null;
  numero_operacion: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRxEcografiaRecordData {
  appointment_id?: string | null;
  fecha: string;
  patient_id?: string | null;
  patient_name?: string | null;
  appointment_type: string;
  doctor_name?: string | null;
  ingreso?: number;
  costo?: number;
  payment_method?: string | null;
  numero_operacion?: string | null;
  notes?: string | null;
}

export interface UpdateRxEcografiaRecordData {
  id: string;
  fecha?: string;
  ingreso?: number;
  costo?: number;
  payment_method?: string | null;
  numero_operacion?: string | null;
  notes?: string | null;
}

export interface RxEcografiaReportRow {
  id: string;
  fecha: string;
  patient_name: string;
  appointment_type: string;
  doctor_name: string | null;
  ingreso: number;
  costo: number;
  utility: number;
}

export interface RxEcografiaReportResult {
  totals: {
    total_records: number;
    total_ingreso: number;
    total_costo: number;
    total_utilidad: number;
  };
  rows: RxEcografiaReportRow[];
}

export const rxEcografiaRecordsService = {
  async list(options: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    search?: string;
  } = {}): Promise<{ data: RxEcografiaRecord[]; total: number }> {
    const { page = 1, limit = 10, fromDate, toDate, search = "" } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("rx_ecografia_records")
      .select("*", { count: "exact" })
      .order("fecha", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("fecha", fromDate);
    if (toDate) query = query.lte("fecha", toDate);
    if (search.trim()) {
      const term = normalizeSearchText(search);
      if (term) {
        query = query.or(
          `patient_name.ilike.%${term}%,doctor_name.ilike.%${term}%,appointment_type.ilike.%${term}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data ?? []) as RxEcografiaRecord[];
    rows.forEach((r) => {
      if (r.fecha && r.fecha.length > 10) r.fecha = r.fecha.slice(0, 10);
    });
    return { data: rows, total: count ?? 0 };
  },

  async getByAppointmentId(appointmentId: string): Promise<RxEcografiaRecord | null> {
    const { data, error } = await supabase
      .from("rx_ecografia_records")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle();
    if (error) throw error;
    return data as RxEcografiaRecord | null;
  },

  async create(data: CreateRxEcografiaRecordData): Promise<RxEcografiaRecord> {
    const patientName =
      data.patient_name != null && data.patient_name !== ""
        ? String(data.patient_name).trim().toUpperCase()
        : null;
    const { data: row, error } = await supabase
      .from("rx_ecografia_records")
      .insert({
        appointment_id: data.appointment_id ?? null,
        fecha: data.fecha,
        patient_id: data.patient_id ?? null,
        patient_name: patientName,
        appointment_type: data.appointment_type || "rx",
        doctor_name: data.doctor_name ?? null,
        ingreso: Number(data.ingreso ?? 0),
        costo: Number(data.costo ?? 0),
        payment_method: data.payment_method ?? null,
        numero_operacion: data.numero_operacion ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as RxEcografiaRecord;
  },

  async createFromAppointment(appointment: {
    id: string;
    date: string;
    patient_id?: string | null;
    patientName: string;
    type: string;
    doctorName: string;
    notes?: string | null;
    appointment_ingreso?: number | null;
    payment_method?: string | null;
    numero_operacion?: string | null;
  }): Promise<RxEcografiaRecord | null> {
    const existing = await this.getByAppointmentId(appointment.id);
    if (existing) return existing;
    const fecha = appointment.date.slice(0, 10);
    const ingreso = Number(appointment.appointment_ingreso ?? 0);
    return this.create({
      appointment_id: appointment.id,
      fecha,
      patient_id: appointment.patient_id ?? null,
      patient_name:
        appointment.patientName != null && appointment.patientName !== ""
          ? String(appointment.patientName).trim().toUpperCase()
          : null,
      appointment_type: appointment.type || "rx",
      doctor_name: appointment.doctorName ?? null,
      ingreso,
      costo: 0,
      payment_method: appointment.payment_method ?? null,
      numero_operacion: appointment.numero_operacion ?? null,
      notes: null,
    });
  },

  async update(data: UpdateRxEcografiaRecordData): Promise<RxEcografiaRecord> {
    const { id, ...rest } = data;
    const updatePayload: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
    const { data: row, error } = await supabase
      .from("rx_ecografia_records")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as RxEcografiaRecord;
  },

  async getReport(fromDate: string, toDate: string): Promise<RxEcografiaReportResult> {
    try {
      const { data, error } = await supabase.rpc("get_report_rx_ecografias", {
        p_from: fromDate,
        p_to: toDate,
      });
      if (error) throw error;
      const raw = (data as { totals?: unknown; rows?: unknown }) ?? {};
      const totals = (raw.totals as Record<string, number>) ?? {};
      const rows = (raw.rows as Array<Record<string, unknown>>) ?? [];
      return {
        totals: {
          total_records: Number(totals.total_records ?? 0),
          total_ingreso: Number(totals.total_ingreso ?? 0),
          total_costo: Number(totals.total_costo ?? 0),
          total_utilidad: Number(totals.total_utilidad ?? 0),
        },
        rows: rows.map((r) => ({
          id: String(r.id ?? ""),
          fecha: toLocalDateString(String(r.fecha ?? "")),
          patient_name: String(r.patient_name ?? ""),
          appointment_type: String(r.appointment_type ?? ""),
          doctor_name: r.doctor_name != null ? String(r.doctor_name) : null,
          ingreso: Number(r.ingreso ?? 0),
          costo: Number(r.costo ?? 0),
          utility: Number(r.utility ?? 0),
        })),
      };
    } catch (e) {
      console.error("Error al obtener reporte RX/Ecografías:", e);
      return {
        totals: {
          total_records: 0,
          total_ingreso: 0,
          total_costo: 0,
          total_utilidad: 0,
        },
        rows: [],
      };
    }
  },
};
