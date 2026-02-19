import supabase from "~/utils/supabase";

export interface CareShift {
  id: string;
  fecha: string;
  hora_inicio: string | null;
  patient_id: string | null;
  familiar_responsable: string | null;
  distrito: string | null;
  turno: string | null;
  monto_a_pagar: number;
  forma_de_pago: string | null;
  numero_operacion: string | null;
  enfermera: string | null;
  gastos_extras: number | null;
  observacion: string | null;
  utilidad: number | null;
  created_at: string;
  updated_at: string;
}

export interface CareShiftWithPatient extends CareShift {
  patient?: { id: string; name: string } | null;
}

export interface CareShiftFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  patient_id?: string;
  distrito?: string;
  enfermera?: string;
}

export interface CreateCareShiftData {
  fecha: string;
  hora_inicio?: string | null;
  patient_id?: string | null;
  familiar_responsable?: string | null;
  distrito?: string | null;
  turno?: string | null;
  monto_a_pagar: number;
  forma_de_pago?: string | null;
  numero_operacion?: string | null;
  enfermera?: string | null;
  gastos_extras?: number | null;
  observacion?: string | null;
  utilidad?: number | null;
}

export const shiftCareService = {
  async getShifts(filters?: CareShiftFilters): Promise<CareShiftWithPatient[]> {
    let q = supabase
      .from("care_shifts")
      .select(`
        *,
        patient:patients(id, name)
      `)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: true });

    if (filters?.fecha_desde) q = q.gte("fecha", filters.fecha_desde);
    if (filters?.fecha_hasta) q = q.lte("fecha", filters.fecha_hasta);
    if (filters?.patient_id) q = q.eq("patient_id", filters.patient_id);
    if (filters?.distrito) q = q.ilike("distrito", `%${filters.distrito}%`);
    if (filters?.enfermera) q = q.ilike("enfermera", `%${filters.enfermera}%`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CareShiftWithPatient[];
  },

  async getShiftById(id: string): Promise<CareShiftWithPatient | null> {
    const { data, error } = await supabase
      .from("care_shifts")
      .select(`
        *,
        patient:patients(id, name)
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as CareShiftWithPatient | null;
  },

  async createShift(data: CreateCareShiftData): Promise<CareShift> {
    const payload = {
      fecha: data.fecha,
      hora_inicio: data.hora_inicio ?? null,
      patient_id: data.patient_id ?? null,
      familiar_responsable: data.familiar_responsable ?? null,
      distrito: data.distrito ?? null,
      turno: data.turno ?? null,
      monto_a_pagar: Number(data.monto_a_pagar) || 0,
      forma_de_pago: data.forma_de_pago ?? null,
      numero_operacion: data.numero_operacion ?? null,
      enfermera: data.enfermera ?? null,
      gastos_extras: data.gastos_extras != null ? Number(data.gastos_extras) : null,
      observacion: data.observacion ?? null,
      utilidad: data.utilidad != null ? Number(data.utilidad) : null,
      updated_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase
      .from("care_shifts")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return row as CareShift;
  },

  async updateShift(
    id: string,
    data: Partial<CreateCareShiftData>
  ): Promise<CareShift> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.fecha !== undefined) payload.fecha = data.fecha;
    if (data.hora_inicio !== undefined) payload.hora_inicio = data.hora_inicio;
    if (data.patient_id !== undefined) payload.patient_id = data.patient_id;
    if (data.familiar_responsable !== undefined) payload.familiar_responsable = data.familiar_responsable;
    if (data.distrito !== undefined) payload.distrito = data.distrito;
    if (data.turno !== undefined) payload.turno = data.turno;
    if (data.monto_a_pagar !== undefined) payload.monto_a_pagar = Number(data.monto_a_pagar);
    if (data.forma_de_pago !== undefined) payload.forma_de_pago = data.forma_de_pago;
    if (data.numero_operacion !== undefined) payload.numero_operacion = data.numero_operacion;
    if (data.enfermera !== undefined) payload.enfermera = data.enfermera;
    if (data.gastos_extras !== undefined) payload.gastos_extras = data.gastos_extras;
    if (data.observacion !== undefined) payload.observacion = data.observacion;
    if (data.utilidad !== undefined) payload.utilidad = data.utilidad;

    const { data: row, error } = await supabase
      .from("care_shifts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as CareShift;
  },

  async deleteShift(id: string): Promise<void> {
    const { error } = await supabase.from("care_shifts").delete().eq("id", id);
    if (error) throw error;
  },
};

export default shiftCareService;
