import supabase from "~/utils/supabase";
import { toLocalDateString } from "~/lib/dateUtils";

export interface MedicalAppointmentRecord {
  id: string;
  appointment_id: string | null;
  fecha: string;
  patient_id: string | null;
  patient_name: string | null;
  appointment_type: string;
  doctor_name: string | null;
  ingreso: number;
  costo: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMedicalRecordData {
  /** Opcional: si es null/undefined se considera registro manual (no vinculado a cita). */
  appointment_id?: string | null;
  fecha: string;
  patient_id?: string | null;
  patient_name?: string | null;
  appointment_type: string;
  doctor_name?: string | null;
  ingreso?: number;
  costo?: number;
  notes?: string | null;
}

export interface UpdateMedicalRecordData {
  id: string;
  ingreso?: number;
  costo?: number;
  notes?: string | null;
}

export interface ReportRow {
  id: string;
  fecha: string;
  patient_name: string;
  appointment_type: string;
  doctor_name: string | null;
  ingreso: number;
  costo: number;
  utility: number;
}

export interface ReportResult {
  totals: {
    total_records: number;
    total_ingreso: number;
    total_costo: number;
    total_utilidad: number;
  };
  rows: ReportRow[];
}

export const medicalAppointmentRecordsService = {
  async list(options: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    search?: string;
  } = {}): Promise<{ data: MedicalAppointmentRecord[]; total: number }> {
    const { page = 1, limit = 10, fromDate, toDate, search = "" } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("medical_appointment_records")
      .select("*", { count: "exact" })
      .order("fecha", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("fecha", fromDate);
    if (toDate) query = query.lte("fecha", toDate);
    if (search.trim()) {
      query = query.or(
        `patient_name.ilike.%${search}%,doctor_name.ilike.%${search}%,appointment_type.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data ?? []) as MedicalAppointmentRecord[];
    rows.forEach((r) => {
      if (r.fecha && r.fecha.length > 10) r.fecha = r.fecha.slice(0, 10);
    });
    return { data: rows, total: count ?? 0 };
  },

  async getByAppointmentId(appointmentId: string): Promise<MedicalAppointmentRecord | null> {
    const { data, error } = await supabase
      .from("medical_appointment_records")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle();
    if (error) throw error;
    return data as MedicalAppointmentRecord | null;
  },

  async create(data: CreateMedicalRecordData): Promise<MedicalAppointmentRecord> {
    const { data: row, error } = await supabase
      .from("medical_appointment_records")
      .insert({
        appointment_id: data.appointment_id ?? null,
        fecha: data.fecha,
        patient_id: data.patient_id ?? null,
        patient_name: data.patient_name ?? null,
        appointment_type: data.appointment_type || "consulta",
        doctor_name: data.doctor_name ?? null,
        ingreso: Number(data.ingreso ?? 0),
        costo: Number(data.costo ?? 0),
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as MedicalAppointmentRecord;
  },

  async createFromAppointment(appointment: {
    id: string;
    date: string;
    patient_id?: string | null;
    patientName: string;
    type: string;
    doctorName: string;
    notes?: string | null;
  }): Promise<MedicalAppointmentRecord | null> {
    const existing = await this.getByAppointmentId(appointment.id);
    if (existing) return existing;
    const fecha = appointment.date.slice(0, 10);
    return this.create({
      appointment_id: appointment.id,
      fecha,
      patient_id: appointment.patient_id ?? null,
      patient_name: appointment.patientName ?? null,
      appointment_type: appointment.type || "consulta",
      doctor_name: appointment.doctorName ?? null,
      ingreso: 0,
      costo: 0,
      notes: appointment.notes ?? null,
    });
  },

  async update(data: UpdateMedicalRecordData): Promise<MedicalAppointmentRecord> {
    const { id, ...rest } = data;
    const { data: row, error } = await supabase
      .from("medical_appointment_records")
      .update({
        ...rest,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as MedicalAppointmentRecord;
  },

  async getReport(fromDate: string, toDate: string): Promise<ReportResult> {
    try {
      const { data, error } = await supabase.rpc("get_report_citas_medicas", {
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
      console.error("Error al obtener reporte citas médicas:", e);
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
