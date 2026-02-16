import supabase from "~/utils/supabase";

export interface HomeCareContract {
  id: string;
  patient_id: string;
  plan_id?: string | null;
  familiar_encargado: string | null;
  hora_inicio: string | null;
  fecha_inicio: string;
  plan_nombre: string | null;
  plan_monto_mensual: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeCarePeriod {
  id: string;
  contract_id: string;
  item: number;
  fecha_pago_quincena: string | null;
  turno: string | null;
  n_pago: number;
  f_desde: string;
  f_hasta: string;
  monto: number;
  f_feriados: string | null;
  m_feriados: number;
  p_del_serv: string | null;
  f_pausas: string | null;
  monto_total: number;
  fecha_pago: string | null;
  metodo_pago: string | null;
  numero_operacion: string | null;
  factura_boleta: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeCareContractWithPatient extends HomeCareContract {
  patient?: { id: string; name: string; dni?: string; phone?: string } | null;
}

export interface HomeCarePlan {
  id: string;
  name: string;
  turno: string | null;
  monto_mensual: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const homeCareService = {
  /** Lista planes activos (para selector en alta de contrato) */
  async getPlans(): Promise<HomeCarePlan[]> {
    const { data, error } = await supabase
      .from("home_care_plans")
      .select("*")
      .eq("is_active", true)
      .order("monto_mensual", { ascending: true });

    if (error) throw error;
    return (data ?? []) as HomeCarePlan[];
  },

  /** Lista contratos con datos del paciente. Si is_active no se pasa, devuelve todos. */
  async getContracts(options?: { is_active?: boolean }): Promise<HomeCareContractWithPatient[]> {
    let q = supabase
      .from("home_care_contracts")
      .select(`
        *,
        patient:patients(id, name, dni, phone)
      `)
      .order("fecha_inicio", { ascending: false });
    if (options?.is_active !== undefined) {
      q = q.eq("is_active", options.is_active);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as HomeCareContractWithPatient[];
  },

  /** Lista contratos activos (alias para compatibilidad) */
  async getActiveContracts(): Promise<HomeCareContractWithPatient[]> {
    return this.getContracts({ is_active: true });
  },

  /** Obtiene el contrato de un paciente por patient_id (activo o inactivo) */
  async getContractByPatientId(patientId: string): Promise<HomeCareContractWithPatient | null> {
    const { data, error } = await supabase
      .from("home_care_contracts")
      .select(`
        *,
        patient:patients(id, name, dni, phone)
      `)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (error) throw error;
    return data as HomeCareContractWithPatient | null;
  },

  /** Lista periodos quincenales de un contrato (incluye f_feriados y f_pausas para el modal de edición) */
  async getPeriodsByContractId(contractId: string): Promise<HomeCarePeriod[]> {
    const { data, error } = await supabase
      .from("home_care_periods")
      .select("id, contract_id, item, fecha_pago_quincena, turno, n_pago, f_desde, f_hasta, monto, f_feriados, m_feriados, p_del_serv, f_pausas, monto_total, fecha_pago, metodo_pago, numero_operacion, factura_boleta, created_at, updated_at")
      .eq("contract_id", contractId)
      .order("item", { ascending: true });

    if (error) throw error;
    return (data ?? []) as HomeCarePeriod[];
  },

  /** Crea un contrato de cuidado en casa para un paciente. Si se pasa plan_id, se usan nombre y monto del plan. */
  async createContract(data: {
    patient_id: string;
    plan_id?: string | null;
    familiar_encargado?: string | null;
    hora_inicio?: string | null;
    fecha_inicio: string;
    plan_nombre?: string | null;
    plan_monto_mensual: number;
  }): Promise<HomeCareContract> {
    let planNombre = data.plan_nombre ?? null;
    let planMonto = data.plan_monto_mensual;

    if (data.plan_id) {
      const { data: plan, error: planError } = await supabase
        .from("home_care_plans")
        .select("name, monto_mensual")
        .eq("id", data.plan_id)
        .single();
      if (!planError && plan) {
        planNombre = plan.name;
        planMonto = Number(plan.monto_mensual);
      }
    }

    const { data: contract, error } = await supabase
      .from("home_care_contracts")
      .insert([
        {
          patient_id: data.patient_id,
          plan_id: data.plan_id ?? null,
          familiar_encargado: data.familiar_encargado ?? null,
          hora_inicio: data.hora_inicio ?? "8:00 AM",
          fecha_inicio: data.fecha_inicio,
          plan_nombre: planNombre,
          plan_monto_mensual: planMonto,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return contract as HomeCareContract;
  },

  /** Actualiza un contrato de cuidado en casa */
  async updateContract(
    contractId: string,
    data: Partial<{
      plan_id: string | null;
      familiar_encargado: string | null;
      hora_inicio: string | null;
      fecha_inicio: string;
      plan_nombre: string | null;
      plan_monto_mensual: number;
      is_active: boolean;
    }>
  ): Promise<HomeCareContract> {
    const payload: Record<string, unknown> = { ...data };
    if (data.plan_id !== undefined) payload.plan_id = data.plan_id;
    if (data.familiar_encargado !== undefined) payload.familiar_encargado = data.familiar_encargado;
    if (data.hora_inicio !== undefined) payload.hora_inicio = data.hora_inicio;
    if (data.fecha_inicio !== undefined) payload.fecha_inicio = data.fecha_inicio;
    if (data.plan_nombre !== undefined) payload.plan_nombre = data.plan_nombre;
    if (data.plan_monto_mensual !== undefined) payload.plan_monto_mensual = data.plan_monto_mensual;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    const { data: contract, error } = await supabase
      .from("home_care_contracts")
      .update(payload)
      .eq("id", contractId)
      .select()
      .single();
    if (error) throw error;
    return contract as HomeCareContract;
  },

  /** Crea un periodo quincenal en un contrato. item y n_pago se calculan si no se envían. */
  async createPeriod(
    contractId: string,
    data: Partial<{
      item: number;
      fecha_pago_quincena: string | null;
      turno: string | null;
      n_pago: number;
      f_desde: string;
      f_hasta: string;
      monto: number;
      f_feriados: string | null;
      m_feriados: number;
      p_del_serv: string | null;
      f_pausas: string | null;
      monto_total: number;
      fecha_pago: string | null;
      metodo_pago: string | null;
      numero_operacion: string | null;
      factura_boleta: string | null;
    }>
  ): Promise<HomeCarePeriod> {
    let item = data.item;
    let n_pago = data.n_pago;
    if (item == null || n_pago == null) {
      const existing = await this.getPeriodsByContractId(contractId);
      const next = existing.length + 1;
      item = data.item ?? next;
      n_pago = data.n_pago ?? next;
    }
    const { data: period, error } = await supabase
      .from("home_care_periods")
      .insert([
        {
          contract_id: contractId,
          item,
          n_pago,
          fecha_pago_quincena: data.fecha_pago_quincena ?? null,
          turno: data.turno ?? "24X24",
          f_desde: data.f_desde ?? data.fecha_pago_quincena ?? new Date().toISOString().split("T")[0],
          f_hasta: (() => {
            if (data.f_hasta) return data.f_hasta;
            const desde = data.f_desde ?? data.fecha_pago_quincena ?? new Date().toISOString().split("T")[0];
            const d = new Date(desde);
            d.setDate(d.getDate() + 14);
            return d.toISOString().split("T")[0];
          })(),
          monto: data.monto ?? 0,
          f_feriados: data.f_feriados ?? null,
          m_feriados: data.m_feriados ?? 0,
          p_del_serv: data.p_del_serv ?? null,
          f_pausas: data.f_pausas ?? null,
          monto_total: data.monto_total ?? data.monto ?? 0,
          fecha_pago: data.fecha_pago ?? null,
          metodo_pago: data.metodo_pago ?? null,
          numero_operacion: data.numero_operacion ?? null,
          factura_boleta: data.factura_boleta ?? null,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return period as HomeCarePeriod;
  },

  /** Actualiza un periodo quincenal. */
  async updatePeriod(
    periodId: string,
    data: Partial<{
      fecha_pago_quincena: string | null;
      turno: string | null;
      f_desde: string;
      f_hasta: string;
      monto: number;
      f_feriados: string | null;
      m_feriados: number;
      p_del_serv: string | null;
      f_pausas: string | null;
      monto_total: number;
      fecha_pago: string | null;
      metodo_pago: string | null;
      numero_operacion: string | null;
      factura_boleta: string | null;
    }>
  ): Promise<HomeCarePeriod> {
    const payload: Record<string, unknown> = { ...data };
    if (data.fecha_pago_quincena !== undefined) payload.fecha_pago_quincena = data.fecha_pago_quincena;
    if (data.f_desde !== undefined) payload.f_desde = data.f_desde;
    if (data.f_hasta !== undefined) payload.f_hasta = data.f_hasta;
    if (data.monto !== undefined) payload.monto = data.monto;
    if (data.f_feriados !== undefined) payload.f_feriados = data.f_feriados;
    if (data.m_feriados !== undefined) payload.m_feriados = data.m_feriados;
    if (data.p_del_serv !== undefined) payload.p_del_serv = data.p_del_serv;
    if (data.f_pausas !== undefined) payload.f_pausas = data.f_pausas;
    if (data.monto_total !== undefined) payload.monto_total = data.monto_total;
    if (data.fecha_pago !== undefined) payload.fecha_pago = data.fecha_pago;
    if (data.metodo_pago !== undefined) payload.metodo_pago = data.metodo_pago;
    if (data.numero_operacion !== undefined) payload.numero_operacion = data.numero_operacion;
    if (data.factura_boleta !== undefined) payload.factura_boleta = data.factura_boleta;
    const { data: period, error } = await supabase
      .from("home_care_periods")
      .update(payload)
      .eq("id", periodId)
      .select()
      .single();
    if (error) throw error;
    return period as HomeCarePeriod;
  },

  /** Elimina un periodo quincenal */
  async deletePeriod(periodId: string): Promise<void> {
    const { error } = await supabase
      .from("home_care_periods")
      .delete()
      .eq("id", periodId);
    if (error) throw error;
  },
};

export default homeCareService;
