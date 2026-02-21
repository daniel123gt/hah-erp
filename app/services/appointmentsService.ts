import supabase from "~/utils/supabase";
import {
  toNoonUtc,
  toLocalDateString,
  formatDateOnlyDdMmYyyy,
} from "~/lib/dateUtils";

/** Re-export para listados de citas (formato dd/mm/yyyy) */
export const formatDateOnly = formatDateOnlyDdMmYyyy;

export type AppointmentVariant = "medicina" | "procedimientos";

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  duration: number;
  type: "consulta" | "examen" | "emergencia" | "seguimiento" | "procedimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
  patient_id?: string;
  procedure_catalog_id?: string;
  procedure_name?: string;
}

interface AppointmentRow {
  id: string;
  variant: string;
  patient_id: string | null;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string | null;
  doctor_name: string;
  doctor_specialty: string | null;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  location: string;
  procedure_catalog_id: string | null;
  procedure_name: string | null;
}

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientEmail: row.patient_email ?? "",
    patientPhone: row.patient_phone ?? "",
    doctorName: row.doctor_name,
    doctorSpecialty: row.doctor_specialty ?? "",
    date: toLocalDateString(row.date),
    time: row.time,
    duration: row.duration,
    type: row.type as Appointment["type"],
    status: row.status as Appointment["status"],
    notes: row.notes ?? undefined,
    location: row.location,
    patient_id: row.patient_id ?? undefined,
    procedure_catalog_id: row.procedure_catalog_id ?? undefined,
    procedure_name: row.procedure_name ?? undefined,
  };
}

export interface CreateAppointmentData {
  variant: AppointmentVariant;
  patient_id?: string | null;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorName: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  location: string;
  procedure_catalog_id?: string | null;
  procedure_name?: string | null;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  id: string;
}

export const appointmentsService = {
  async list(variant: AppointmentVariant): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("variant", variant)
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => rowToAppointment(row as AppointmentRow));
  },

  async create(payload: CreateAppointmentData): Promise<Appointment> {
    let patientName = payload.patientName?.trim() ?? "";
    let patientEmail = payload.patientEmail?.trim() ?? null;
    let patientPhone = payload.patientPhone?.trim() ?? null;

    // Si hay patient_id pero faltan datos del paciente, rellenar desde la tabla patients (evita bug de crear cita sin nombre)
    if (payload.patient_id && (!patientName || !patientEmail || !patientPhone)) {
      const { data: patient } = await supabase
        .from("patients")
        .select("name, email, phone")
        .eq("id", payload.patient_id)
        .maybeSingle();
      if (patient) {
        if (!patientName) patientName = (patient.name ?? "").trim();
        if (!patientEmail) patientEmail = (patient.email ?? "").trim() || null;
        if (!patientPhone) patientPhone = (patient.phone ?? "").trim() || null;
      }
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        variant: payload.variant,
        patient_id: payload.patient_id ?? null,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        doctor_name: payload.doctorName,
        doctor_specialty: payload.doctorSpecialty ?? null,
        date: toNoonUtc(payload.date),
        time: payload.time,
        duration: payload.duration,
        type: payload.type,
        status: payload.status,
        notes: payload.notes ?? null,
        location: payload.location,
        procedure_catalog_id: payload.procedure_catalog_id ?? null,
        procedure_name: payload.procedure_name ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToAppointment(data as AppointmentRow);
  },

  async update(payload: UpdateAppointmentData): Promise<Appointment> {
    const { id, ...rest } = payload;
    const updatePayload: Record<string, unknown> = {};
    if (rest.patient_id !== undefined) updatePayload.patient_id = rest.patient_id;
    if (rest.patientName !== undefined) updatePayload.patient_name = rest.patientName;
    if (rest.patientEmail !== undefined) updatePayload.patient_email = rest.patientEmail;
    if (rest.patientPhone !== undefined) updatePayload.patient_phone = rest.patientPhone;
    if (rest.doctorName !== undefined) updatePayload.doctor_name = rest.doctorName;
    if (rest.doctorSpecialty !== undefined) updatePayload.doctor_specialty = rest.doctorSpecialty;
    if (rest.date !== undefined) updatePayload.date = toNoonUtc(rest.date);
    if (rest.time !== undefined) updatePayload.time = rest.time;
    if (rest.duration !== undefined) updatePayload.duration = rest.duration;
    if (rest.type !== undefined) updatePayload.type = rest.type;
    if (rest.status !== undefined) updatePayload.status = rest.status;
    if (rest.notes !== undefined) updatePayload.notes = rest.notes;
    if (rest.location !== undefined) updatePayload.location = rest.location;
    if (rest.procedure_catalog_id !== undefined) updatePayload.procedure_catalog_id = rest.procedure_catalog_id;
    if (rest.procedure_name !== undefined) updatePayload.procedure_name = rest.procedure_name;

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToAppointment(data as AppointmentRow);
  },
};
