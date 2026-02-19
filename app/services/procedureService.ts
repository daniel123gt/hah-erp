import supabase from "~/utils/supabase";

export interface ProcedureCatalogItem {
  id: string;
  name: string;
  base_price_soles: number;
  total_cost_soles: number;
  utility_soles: number;
  honorarios_soles?: number;
  movilidad_soles?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureCatalogMaterial {
  id: string;
  procedure_catalog_id: string;
  material_name: string;
  quantity: number;
  cost_soles: number;
  sort_order: number;
}

export interface ProcedureRecord {
  id: string;
  fecha: string;
  patient_id: string | null;
  patient_name: string | null;
  quantity: number;
  procedure_catalog_id: string | null;
  procedure_name: string | null;
  district: string | null;
  yape: number;
  plin: number;
  transfer_deposito: number;
  tarjeta_link_pos: number;
  efectivo: number;
  numero_operacion: string | null;
  gastos_material: number;
  combustible: number;
  costo_adicional_servicio: number;
  utilidad: number | null;
  observacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcedureRecordWithDetails extends ProcedureRecord {
  procedure_catalog?: ProcedureCatalogItem | null;
  patient?: { id: string; name: string } | null;
}

export interface CreateProcedureRecordData {
  fecha: string;
  patient_id?: string | null;
  patient_name?: string | null;
  quantity?: number;
  procedure_catalog_id?: string | null;
  procedure_name?: string | null;
  district?: string | null;
  yape?: number;
  plin?: number;
  transfer_deposito?: number;
  tarjeta_link_pos?: number;
  efectivo?: number;
  numero_operacion?: string | null;
  gastos_material?: number;
  combustible?: number;
  costo_adicional_servicio?: number;
  observacion?: string | null;
}

export interface UpdateProcedureRecordData extends CreateProcedureRecordData {
  id: string;
}

export type PaymentMethodKey = "yape" | "plin" | "transfer_deposito" | "tarjeta_link_pos" | "efectivo";

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethodKey; label: string }[] = [
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transfer_deposito", label: "Transferencia / Depósito" },
  { value: "tarjeta_link_pos", label: "Tarjeta / Link / POS" },
  { value: "efectivo", label: "Efectivo" },
];

export function getPaymentFromRecord(
  r: Pick<ProcedureRecord, "yape" | "plin" | "transfer_deposito" | "tarjeta_link_pos" | "efectivo">
): { method: PaymentMethodKey; amount: number } {
  for (const opt of PAYMENT_METHOD_OPTIONS) {
    const v = Number(r[opt.value] ?? 0);
    if (v > 0) return { method: opt.value, amount: v };
  }
  return { method: "efectivo", amount: 0 };
}

export function recordToPaymentPayload(
  method: PaymentMethodKey,
  amount: number
): Pick<ProcedureRecord, "yape" | "plin" | "transfer_deposito" | "tarjeta_link_pos" | "efectivo"> {
  return {
    yape: method === "yape" ? amount : 0,
    plin: method === "plin" ? amount : 0,
    transfer_deposito: method === "transfer_deposito" ? amount : 0,
    tarjeta_link_pos: method === "tarjeta_link_pos" ? amount : 0,
    efectivo: method === "efectivo" ? amount : 0,
  };
}

function totalIngreso(r: ProcedureRecord): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

export const procedureService = {
  async getCatalog(activeOnly = true): Promise<ProcedureCatalogItem[]> {
    let query = supabase
      .from("procedure_catalog")
      .select("*")
      .order("name");
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ProcedureCatalogItem[];
  },

  async getMaterials(procedureCatalogId: string): Promise<ProcedureCatalogMaterial[]> {
    const { data, error } = await supabase
      .from("procedure_catalog_materials")
      .select("*")
      .eq("procedure_catalog_id", procedureCatalogId)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ProcedureCatalogMaterial[];
  },

  /** Lista maestra de materiales (tabla materials) para seleccionar al editar procedimientos */
  async getMaterialsMaster(): Promise<Array<{ id: string; name: string; cost_soles: number }>> {
    const { data, error } = await supabase
      .from("materials")
      .select("id, name, cost_soles")
      .eq("is_active", true)
      .order("name");
    if (error) return []; // Si la tabla no existe o falla, devolver lista vacía
    return (data ?? []) as Array<{ id: string; name: string; cost_soles: number }>;
  },

  /** Crea en la tabla materials los nombres que no existan (para insumos nuevos) */
  async ensureMaterialsExist(
    items: Array<{ name: string; cost_soles: number }>
  ): Promise<void> {
    if (items.length === 0) return;
    const { data: existing } = await supabase
      .from("materials")
      .select("name")
      .in("name", items.map((i) => i.name.trim()).filter(Boolean));
    const existingNames = new Set((existing ?? []).map((r: { name: string }) => r.name));
    const toInsert = items.filter((i) => {
      const name = i.name.trim();
      return name && !existingNames.has(name);
    });
    if (toInsert.length === 0) return;
    const uniqueByName = new Map<string, number>();
    toInsert.forEach((i) => {
      const n = i.name.trim();
      if (!uniqueByName.has(n)) uniqueByName.set(n, Number(i.cost_soles) ?? 0);
    });
    const rows = [...uniqueByName.entries()].map(([name, cost_soles]) => ({ name, cost_soles }));
    await supabase.from("materials").insert(rows);
  },

  /** Crea un procedimiento nuevo en el catálogo (nombre, precio, honorarios, movilidad, insumos) */
  async createProcedureCatalog(data: {
    name: string;
    base_price_soles: number;
    honorarios_soles?: number;
    movilidad_soles?: number;
    materials?: Array<{ material_name: string; quantity: number; cost_soles: number }>;
  }): Promise<ProcedureCatalogItem> {
    const honorarios = Number(data.honorarios_soles ?? 0);
    const movilidad = Number(data.movilidad_soles ?? 0);
    const materialsCost = (data.materials ?? []).reduce(
      (sum, m) => sum + Number(m.quantity || 0) * Number(m.cost_soles || 0),
      0
    );
    const total_cost_soles = honorarios + movilidad + materialsCost;
    const base_price = Number(data.base_price_soles ?? 0);
    const utility_soles = base_price - total_cost_soles;

    const { data: created, error: insertError } = await supabase
      .from("procedure_catalog")
      .insert({
        name: data.name.trim(),
        base_price_soles: base_price,
        honorarios_soles: honorarios,
        movilidad_soles: movilidad,
        total_cost_soles,
        utility_soles,
        is_active: true,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    const id = (created as ProcedureCatalogItem).id;

    if (data.materials && data.materials.length > 0) {
      const byName = new Map<string, { quantity: number; cost_soles: number; order: number }>();
      data.materials.forEach((m, i) => {
        const name = m.material_name.trim();
        if (!name) return;
        const qty = Number(m.quantity) || 1;
        const cost = Number(m.cost_soles) ?? 0;
        const existing = byName.get(name);
        if (existing) {
          existing.quantity += qty;
        } else {
          byName.set(name, { quantity: qty, cost_soles: cost, order: i });
        }
      });
      const rows = [...byName.entries()]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([material_name], i) => ({
          procedure_catalog_id: id,
          material_name,
          quantity: byName.get(material_name)!.quantity,
          cost_soles: byName.get(material_name)!.cost_soles,
          sort_order: i,
        }));
      const { error: matError } = await supabase
        .from("procedure_catalog_materials")
        .insert(rows);
      if (matError) throw matError;
      try {
        await this.ensureMaterialsExist(rows.map((r) => ({ name: r.material_name, cost_soles: r.cost_soles })));
      } catch (_) {}
    }

    return created as ProcedureCatalogItem;
  },

  /** Actualiza un procedimiento del catálogo y sus insumos; recalcula costo total y utilidad */
  async updateProcedureCatalog(
    id: string,
    data: {
      name?: string;
      base_price_soles?: number;
      honorarios_soles?: number;
      movilidad_soles?: number;
      materials?: Array<{ material_name: string; quantity: number; cost_soles: number }>;
    }
  ): Promise<ProcedureCatalogItem> {
    const honorarios = Number(data.honorarios_soles ?? 0);
    const movilidad = Number(data.movilidad_soles ?? 0);
    const materialsCost = (data.materials ?? []).reduce(
      (sum, m) => sum + Number(m.quantity || 0) * Number(m.cost_soles || 0),
      0
    );
    const total_cost_soles = honorarios + movilidad + materialsCost;
    const base_price = Number(data.base_price_soles ?? 0);
    const utility_soles = base_price - total_cost_soles;

    const { data: updated, error: updateError } = await supabase
      .from("procedure_catalog")
      .update({
        ...(data.name != null && { name: data.name }),
        ...(data.base_price_soles != null && { base_price_soles: data.base_price_soles }),
        ...(data.honorarios_soles != null && { honorarios_soles: data.honorarios_soles }),
        ...(data.movilidad_soles != null && { movilidad_soles: data.movilidad_soles }),
        total_cost_soles,
        utility_soles,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("procedure_catalog_materials")
      .delete()
      .eq("procedure_catalog_id", id);
    if (deleteError) throw deleteError;

    if (data.materials && data.materials.length > 0) {
      const byName = new Map<string, { quantity: number; cost_soles: number; order: number }>();
      data.materials.forEach((m, i) => {
        const name = m.material_name.trim();
        if (!name) return;
        const qty = Number(m.quantity) || 1;
        const cost = Number(m.cost_soles) ?? 0;
        const existing = byName.get(name);
        if (existing) {
          existing.quantity += qty;
        } else {
          byName.set(name, { quantity: qty, cost_soles: cost, order: i });
        }
      });
      const rows = [...byName.entries()]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([material_name], i) => {
          const v = byName.get(material_name)!;
          return {
            procedure_catalog_id: id,
            material_name,
            quantity: v.quantity,
            cost_soles: v.cost_soles,
            sort_order: i,
          };
        });
      const { error: insertError } = await supabase
        .from("procedure_catalog_materials")
        .insert(rows);
      if (insertError) throw insertError;
      try {
        await this.ensureMaterialsExist(rows.map((r) => ({ name: r.material_name, cost_soles: r.cost_soles })));
      } catch (_) {
        // Si la tabla materials no existe o falla, el procedimiento ya se guardó
      }
    }

    return updated as ProcedureCatalogItem;
  },

  /** Desactiva un procedimiento (soft delete); deja de mostrarse en el catálogo */
  async deleteProcedureCatalog(id: string): Promise<void> {
    const { error } = await supabase
      .from("procedure_catalog")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  /** Obtiene un procedimiento del catálogo por nombre (p. ej. "Toma de muestra" para recargo en lab). */
  async getProcedureByName(namePattern: string): Promise<{ base_price_soles: number; total_cost_soles: number } | null> {
    const { data, error } = await supabase
      .from("procedure_catalog")
      .select("base_price_soles, total_cost_soles")
      .ilike("name", `%${namePattern}%`)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      base_price_soles: Number(data.base_price_soles ?? 0),
      total_cost_soles: Number(data.total_cost_soles ?? 0),
    };
  },

  async getRecords(options: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    search?: string;
    paymentStatus?: "pendiente" | "cancelado";
  } = {}): Promise<{ data: ProcedureRecordWithDetails[]; total: number }> {
    const { page = 1, limit = 20, fromDate, toDate, search = "", paymentStatus } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("procedure_records")
      .select(
        "*, procedure_catalog:procedure_catalog_id(id, name, base_price_soles, total_cost_soles, utility_soles), patient:patient_id(id, name)",
        { count: "exact" }
      )
      .order("fecha", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("fecha", fromDate);
    if (toDate) query = query.lte("fecha", toDate);
    if (search.trim()) {
      query = query.or(
        `patient_name.ilike.%${search}%,procedure_name.ilike.%${search}%,district.ilike.%${search}%,numero_operacion.ilike.%${search}%`
      );
    }
    if (paymentStatus === "pendiente") {
      query = query
        .eq("yape", 0)
        .eq("plin", 0)
        .eq("transfer_deposito", 0)
        .eq("tarjeta_link_pos", 0)
        .eq("efectivo", 0);
    } else if (paymentStatus === "cancelado") {
      query = query.or("yape.gt.0,plin.gt.0,transfer_deposito.gt.0,tarjeta_link_pos.gt.0,efectivo.gt.0");
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []) as ProcedureRecordWithDetails[];
    rows.forEach((r) => {
      if (r.utilidad == null && (r.yape || r.plin || r.transfer_deposito || r.tarjeta_link_pos || r.efectivo || r.gastos_material || r.combustible)) {
        const ing = totalIngreso(r);
        const catalog = r.procedure_catalog as ProcedureCatalogItem | null;
        const totalCostSoles = catalog ? Number(catalog.total_cost_soles ?? 0) : 0;
        (r as ProcedureRecord).utilidad = ing - totalCostSoles - Number(r.gastos_material || 0) - Number(r.combustible || 0) - Number(r.costo_adicional_servicio || 0);
      }
    });

    return { data: rows, total: count ?? 0 };
  },

  async getRecordById(id: string): Promise<ProcedureRecordWithDetails | null> {
    const { data, error } = await supabase
      .from("procedure_records")
      .select(
        "*, procedure_catalog:procedure_catalog_id(id, name, base_price_soles, total_cost_soles, utility_soles), patient:patient_id(id, name)"
      )
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    const row = data as ProcedureRecordWithDetails;
    if (row.utilidad == null) {
      const ing = totalIngreso(row);
      const catalog = row.procedure_catalog as ProcedureCatalogItem | null;
      const totalCostSoles = catalog ? Number(catalog.total_cost_soles ?? 0) : 0;
      (row as ProcedureRecord).utilidad = ing - totalCostSoles - Number(row.gastos_material || 0) - Number(row.combustible || 0) - Number(row.costo_adicional_servicio || 0);
    }
    return row;
  },

  async createRecord(data: CreateProcedureRecordData): Promise<ProcedureRecord> {
    const ing =
      Number(data.yape || 0) +
      Number(data.plin || 0) +
      Number(data.transfer_deposito || 0) +
      Number(data.tarjeta_link_pos || 0) +
      Number(data.efectivo || 0);
    let totalCostSoles = 0;
    if (data.procedure_catalog_id) {
      const { data: plan } = await supabase
        .from("procedure_catalog")
        .select("total_cost_soles")
        .eq("id", data.procedure_catalog_id)
        .single();
      totalCostSoles = Number(plan?.total_cost_soles ?? 0);
    }
    const gastosMaterial = Number(data.gastos_material || 0);
    const combustible = Number(data.combustible || 0);
    const utilidad =
      ing - totalCostSoles - gastosMaterial - combustible - Number(data.costo_adicional_servicio || 0);

    const { data: row, error } = await supabase
      .from("procedure_records")
      .insert([
        {
          fecha: data.fecha,
          patient_id: data.patient_id ?? null,
          patient_name: data.patient_name ?? null,
          quantity: data.quantity ?? 1,
          procedure_catalog_id: data.procedure_catalog_id ?? null,
          procedure_name: data.procedure_name ?? null,
          district: data.district ?? null,
          yape: data.yape ?? 0,
          plin: data.plin ?? 0,
          transfer_deposito: data.transfer_deposito ?? 0,
          tarjeta_link_pos: data.tarjeta_link_pos ?? 0,
          efectivo: data.efectivo ?? 0,
          numero_operacion: data.numero_operacion ?? null,
          gastos_material: data.gastos_material ?? 0,
          combustible: data.combustible ?? 0,
          costo_adicional_servicio: data.costo_adicional_servicio ?? 0,
          utilidad: utilidad,
          observacion: data.observacion ?? null,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return row as ProcedureRecord;
  },

  async updateRecord(data: UpdateProcedureRecordData): Promise<ProcedureRecord> {
    const ing =
      Number(data.yape || 0) +
      Number(data.plin || 0) +
      Number(data.transfer_deposito || 0) +
      Number(data.tarjeta_link_pos || 0) +
      Number(data.efectivo || 0);
    let totalCostSoles = 0;
    if (data.procedure_catalog_id) {
      const { data: plan } = await supabase
        .from("procedure_catalog")
        .select("total_cost_soles")
        .eq("id", data.procedure_catalog_id)
        .single();
      totalCostSoles = Number(plan?.total_cost_soles ?? 0);
    }
    const gastosMaterial = Number(data.gastos_material || 0);
    const combustible = Number(data.combustible || 0);
    const utilidad =
      ing - totalCostSoles - gastosMaterial - combustible - Number(data.costo_adicional_servicio || 0);

    const { id, ...rest } = data;
    const { data: row, error } = await supabase
      .from("procedure_records")
      .update({
        ...rest,
        utilidad,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as ProcedureRecord;
  },

  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase.from("procedure_records").delete().eq("id", id);
    if (error) throw error;
  },

  /** Totales para reporte de cierre por período (ingreso, materiales, movilidad) */
  async getReportTotals(
    fromDate: string,
    toDate: string
  ): Promise<{ ingresoTotal: number; materiales: number; movilidad: number }> {
    const { data, error } = await supabase
      .from("procedure_records")
      .select("yape, plin, transfer_deposito, tarjeta_link_pos, efectivo, gastos_material, combustible")
      .gte("fecha", fromDate)
      .lte("fecha", toDate);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      yape?: number;
      plin?: number;
      transfer_deposito?: number;
      tarjeta_link_pos?: number;
      efectivo?: number;
      gastos_material?: number;
      combustible?: number;
    }>;
    let ingresoTotal = 0;
    let materiales = 0;
    let movilidad = 0;
    for (const r of rows) {
      ingresoTotal +=
        Number(r.yape ?? 0) +
        Number(r.plin ?? 0) +
        Number(r.transfer_deposito ?? 0) +
        Number(r.tarjeta_link_pos ?? 0) +
        Number(r.efectivo ?? 0);
      materiales += Number(r.gastos_material ?? 0);
      movilidad += Number(r.combustible ?? 0);
    }
    return { ingresoTotal, materiales, movilidad };
  },

  /**
   * Reporte de procedimientos por BD (RPC): totals y rows con ingreso, costo y utilidad por registro.
   */
  async getReportProcedimientos(
    fromDate: string,
    toDate: string
  ): Promise<{
    totals: {
      total_records: number;
      total_ingreso: number;
      total_materiales: number;
      total_movilidad: number;
      total_costo: number;
      total_utilidad: number;
    };
    rows: Array<{
      id: string;
      fecha: string;
      patient_name: string;
      procedure_name: string;
      district: string | null;
      ingreso: number;
      costo: number;
      utility: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc("get_report_procedimientos", {
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
          total_materiales: Number(totals.total_materiales ?? 0),
          total_movilidad: Number(totals.total_movilidad ?? 0),
          total_costo: Number(totals.total_costo ?? 0),
          total_utilidad: Number(totals.total_utilidad ?? 0),
        },
        rows: rows.map((r) => ({
          id: String(r.id ?? ""),
          fecha: String(r.fecha ?? ""),
          patient_name: String(r.patient_name ?? ""),
          procedure_name: String(r.procedure_name ?? ""),
          district: r.district != null ? String(r.district) : null,
          ingreso: Number(r.ingreso ?? 0),
          costo: Number(r.costo ?? 0),
          utility: Number(r.utility ?? 0),
        })),
      };
    } catch (e) {
      console.error("Error al obtener reporte de procedimientos por BD:", e);
      return {
        totals: {
          total_records: 0,
          total_ingreso: 0,
          total_materiales: 0,
          total_movilidad: 0,
          total_costo: 0,
          total_utilidad: 0,
        },
        rows: [],
      };
    }
  },
};
