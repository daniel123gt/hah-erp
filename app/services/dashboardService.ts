/**
 * Datos agregados para el dashboard principal (Home).
 * Usa pacientes, citas y procedimientos para métricas reales.
 */

import { getTodayLocal } from "~/lib/dateUtils";
import { isAppointmentCancelado, isLabCancelado } from "~/lib/estadoDisplay";
import patientsService from "~/services/patientsService";
import { appointmentsService } from "~/services/appointmentsService";
import { procedureService, type ProcedureRecord } from "~/services/procedureService";
import labOrderService from "~/services/labOrderService";
import { homeCareService } from "~/services/homeCareService";
import { shiftCareService } from "~/services/shiftCareService";
import { rxEcografiaRecordsService } from "~/services/rxEcografiaRecordsService";
import { medicalAppointmentRecordsService } from "~/services/medicalAppointmentRecordsService";

function sumRecordRevenue(r: ProcedureRecord): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export interface DashboardStats {
  totalPatients: number;
  patientGrowth: number; // 0 si no hay dato anterior
  citasHoy: number;
  appointmentGrowth: number;
  labOrdersHoy: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeServices: number;
  serviceGrowth: number;
}

export interface TodayLabOrderItem {
  id: string;
  patient_id: string;
  patientName: string;
  itemsCount: number;
  total_amount: number;
  status: string;
}

export interface TodayAppointmentItem {
  id: string;
  patient: string;
  time: string;
  doctor: string;
  type: string;
  status: string;
  priority: string;
  variant: "medicina" | "procedimientos" | "rx_ecografias";
}

export interface TopServiceItem {
  name: string;
  count: number;
  revenue: number;
  growth: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  description: string;
  time: string;
  date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  todayAppointments: TodayAppointmentItem[];
  todayLabOrders: TodayLabOrderItem[];
  topServices: TopServiceItem[];
  recentActivity: RecentActivityItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = getTodayLocal();
  const { from: monthFrom, to: monthTo } = getMonthRange();

  const [
    patientStats,
    medicinaCitas,
    procedimientosCitas,
    rxEcografiasCitas,
    todayLabOrdersRaw,
    procedureCatalog,
    procedureRecords,
    procedimientosReport,
    labReport,
    shiftCareReport,
    homeCareRevenue,
    rxEcografiaReport,
    medicalAppointmentReport,
  ] = await Promise.all([
    patientsService.getPatientStats().catch(() => ({ total: 0, thisMonth: 0 })),
    appointmentsService.list("medicina"),
    appointmentsService.list("procedimientos"),
    appointmentsService.list("rx_ecografias"),
    labOrderService.getOrdersForSampleDate(today),
    procedureService.getCatalog(true),
    procedureService.getRecords({
      fromDate: monthFrom,
      toDate: monthTo,
      limit: 500,
    }),
    // Ingresos del mes por fuente: se usan los RPC de reporte (agregan en BD,
    // sin tope de filas) para que el card coincida con cada página de Reportes.
    procedureService.getReportProcedimientos(monthFrom, monthTo),
    labOrderService.getReportLaboratorio(monthFrom, monthTo),
    shiftCareService.getReportCuidadosPorTurnos(monthFrom, monthTo),
    // Cuidado en casa: se usa getPeriodsInRange (misma fuente que la página de
    // Reportes), NO getMonthlyRevenue ni el RPC. fecha_pago puede traer varias
    // fechas legacy (ej. "2026-06-15, 2026-06-30"); getPeriodsInRange parsea
    // todas las fechas, mientras que el filtro de texto >=/<= se pierde pagos.
    homeCareService
      .getPeriodsInRange(monthFrom, monthTo)
      .then((rows) => rows.reduce((s, p) => s + Number(p.monto_total ?? 0), 0))
      .catch(() => 0),
    rxEcografiaRecordsService.getReport(monthFrom, monthTo),
    medicalAppointmentRecordsService.getReport(monthFrom, monthTo),
  ]);

  const labPatientIds = [...new Set(todayLabOrdersRaw.map((o) => o.patient_id))];
  const labPatients = await Promise.all(
    labPatientIds.map((id) => patientsService.getPatientById(id).catch(() => null))
  );
  const labPatientMap: Record<string, string> = {};
  labPatients.forEach((p, i) => {
    if (p) labPatientMap[labPatientIds[i]] = p.name;
  });
  const todayLabOrders: TodayLabOrderItem[] = todayLabOrdersRaw
    .filter((o) => !isLabCancelado(o.status))
    .map((o) => ({
    id: o.id,
    patient_id: o.patient_id,
    patientName: labPatientMap[o.patient_id] ?? "Paciente",
    itemsCount: o.items.length,
    total_amount: o.total_amount,
    status: o.status,
  }));

  const todayMedicina = medicinaCitas.filter(
    (c) => c.date === today && !isAppointmentCancelado(c.status)
  );
  const todayProcedimientos = procedimientosCitas.filter(
    (c) => c.date === today && !isAppointmentCancelado(c.status)
  );
  const todayRxEcografias = rxEcografiasCitas.filter(
    (c) => c.date === today && !isAppointmentCancelado(c.status)
  );
  const todayAppointments: TodayAppointmentItem[] = [
    ...todayMedicina.map((c) => ({
      id: c.id,
      patient: c.patientName,
      time: c.time,
      doctor: c.doctorName,
      type: c.type,
      status: c.status,
      priority: "normal" as const,
      variant: "medicina" as const,
    })),
    ...todayProcedimientos.map((c) => ({
      id: c.id,
      patient: c.patientName,
      time: c.time,
      doctor: c.doctorName,
      type: c.procedure_name || c.type,
      status: c.status,
      priority: "normal" as const,
      variant: "procedimientos" as const,
    })),
    ...todayRxEcografias.map((c) => ({
      id: c.id,
      patient: c.patientName,
      time: c.time,
      doctor: c.doctorName,
      type: c.type,
      status: c.status,
      priority: "normal" as const,
      variant: "rx_ecografias" as const,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  // Laboratorio: se excluyen las órdenes Canceladas, igual que la página de
  // Reportes. El totals.total_revenue del RPC SÍ las incluye, por eso el
  // ingreso se suma desde rows filtrando con isLabCancelado.
  const labRevenue = (labReport.rows ?? [])
    .filter((r) => !isLabCancelado(r.status))
    .reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

  // Ingresos del mes = suma de las 6 fuentes (agregados en BD, sin tope de
  // filas). Coincide con el total de las páginas de Reportes.
  const monthlyRevenue =
    Number(procedimientosReport.totals.total_ingreso || 0) +
    labRevenue +
    Number(shiftCareReport.totals.total_revenue || 0) +
    Number(homeCareRevenue || 0) +
    Number(rxEcografiaReport.totals.total_ingreso || 0) +
    Number(medicalAppointmentReport.totals.total_ingreso || 0);

  const byProcedure = new Map<string, { count: number; revenue: number }>();
  procedureRecords.data.forEach((r) => {
    const name = r.procedure_name || "Sin nombre";
    const rev = sumRecordRevenue(r);
    const prev = byProcedure.get(name) || { count: 0, revenue: 0 };
    byProcedure.set(name, {
      count: prev.count + (r.quantity || 1),
      revenue: prev.revenue + rev,
    });
  });
  const topServices: TopServiceItem[] = [...byProcedure.entries()]
    .map(([name, { count, revenue }]) => ({ name, count, revenue, growth: 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentActivity: RecentActivityItem[] = procedureRecords.data
    .slice(0, 5)
    .map((r, i) => {
      const name = r.patient_name || r.procedure_name || "Servicio";
      const proc = r.procedure_name || "";
      const desc = proc ? `${proc} - ${name}` : `Registro - ${name}`;
      const d = new Date(r.fecha + "T12:00:00");
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      let timeStr = "Hace poco";
      if (diffDays > 0) timeStr = `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
      else if (diffHours > 0) timeStr = `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
      return {
        id: r.id || `act-${i}`,
        type: "procedimiento",
        description: desc,
        time: timeStr,
        date: r.fecha,
      };
    });

  const stats: DashboardStats = {
    totalPatients: patientStats.total ?? 0,
    patientGrowth: 0,
    citasHoy: todayAppointments.length,
    appointmentGrowth: 0,
    labOrdersHoy: todayLabOrders.length,
    monthlyRevenue,
    revenueGrowth: 0,
    activeServices: procedureCatalog.length,
    serviceGrowth: 0,
  };

  return {
    stats,
    todayAppointments,
    todayLabOrders,
    topServices,
    recentActivity,
  };
}

/** Genera un array de fechas YYYY-MM-DD para los últimos N días (incluye hoy). */
function getLastDays(n: number): string[] {
  const today = getTodayLocal();
  const [y, m, d] = today.split("-").map(Number);
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(y, m - 1, d - i);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    dates.push(`${yy}-${mm}-${dd}`);
  }
  return dates;
}

export interface DashboardChartPoint {
  date: string;
  /** Formato corto para eje X (ej. "15/02") */
  label: string;
  citasMedicina: number;
  citasProcedimientos: number;
  citasRxEcografias: number;
  laboratorio: number;
  cuidadosPorTurnos: number;
}

const CHART_DAYS = 14;

/** Datos para el gráfico del dashboard: citas medicina, procedimientos, RX/Ecografías y laboratorio por día (últimos 14 días). */
export async function getDashboardChartData(): Promise<DashboardChartPoint[]> {
  const dates = getLastDays(CHART_DAYS);
  const [medicinaCitas, procedimientosCitas, rxEcografiasCitas, shifts, ...labOrdersByDay] = await Promise.all([
    appointmentsService.list("medicina"),
    appointmentsService.list("procedimientos"),
    appointmentsService.list("rx_ecografias"),
    shiftCareService
      .getShifts({ fecha_desde: dates[0], fecha_hasta: dates[dates.length - 1] })
      .catch(() => []),
    ...dates.map((d) => labOrderService.getOrdersForSampleDate(d)),
  ]);

  const dateSet = new Set(dates);
  const medicinaByDate: Record<string, number> = {};
  const procedimientosByDate: Record<string, number> = {};
  const rxEcografiasByDate: Record<string, number> = {};
  const cuidadosPorTurnosByDate: Record<string, number> = {};
  dates.forEach((d) => {
    medicinaByDate[d] = 0;
    procedimientosByDate[d] = 0;
    rxEcografiasByDate[d] = 0;
    cuidadosPorTurnosByDate[d] = 0;
  });
  shifts.forEach((s) => {
    if (s.estado === "Cancelado") return; // los turnos cancelados no son actividad
    const d = String(s.fecha ?? "").slice(0, 10);
    if (dateSet.has(d)) cuidadosPorTurnosByDate[d] = (cuidadosPorTurnosByDate[d] ?? 0) + 1;
  });
  medicinaCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (dateSet.has(d)) medicinaByDate[d] = (medicinaByDate[d] ?? 0) + 1;
  });
  procedimientosCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (dateSet.has(d)) procedimientosByDate[d] = (procedimientosByDate[d] ?? 0) + 1;
  });
  rxEcografiasCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (dateSet.has(d)) rxEcografiasByDate[d] = (rxEcografiasByDate[d] ?? 0) + 1;
  });

  return dates.map((date) => {
    const [y, m, d] = date.split("-");
    const label = `${d}/${m}`;
    const labCount = Array.isArray(labOrdersByDay[dates.indexOf(date)]) ? (labOrdersByDay[dates.indexOf(date)] as unknown[]).length : 0;
    return {
      date,
      label,
      citasMedicina: medicinaByDate[date] ?? 0,
      citasProcedimientos: procedimientosByDate[date] ?? 0,
      citasRxEcografias: rxEcografiasByDate[date] ?? 0,
      laboratorio: labCount,
      cuidadosPorTurnos: cuidadosPorTurnosByDate[date] ?? 0,
    };
  });
}

export type CalendarEventType = "medicina" | "procedimientos" | "rx_ecografias" | "laboratorio";

export interface CalendarEventResource {
  type: CalendarEventType;
  id: string;
  patientName?: string;
  doctorName?: string;
  status?: string;
  /** Para laboratorio: número de exámenes */
  itemsCount?: number;
  total_amount?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEventResource;
}

/** Parsea hora "HH:MM" o "HH:MM:SS" a minutos desde medianoche. */
function parseTimeToMinutes(time: string): number {
  const parts = String(time).trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/** Genera eventos para el calendario (citas medicina, procedimientos, RX/Ecografías y laboratorio) en el rango [fromDate, toDate]. */
export async function getCalendarEvents(fromDate: string, toDate: string): Promise<CalendarEvent[]> {
  const [medicinaCitas, procedimientosCitas, rxEcografiasCitas, labOrders] = await Promise.all([
    appointmentsService.list("medicina"),
    appointmentsService.list("procedimientos"),
    appointmentsService.list("rx_ecografias"),
    labOrderService.getOrdersForSampleDateRange(fromDate, toDate),
  ]);

  const events: CalendarEvent[] = [];
  const from = fromDate.slice(0, 10);
  const to = toDate.slice(0, 10);

  medicinaCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (d < from || d > to) return;
    const startMins = parseTimeToMinutes(c.time);
    const start = new Date(d + "T12:00:00");
    start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
    const end = new Date(start.getTime() + (c.duration || 30) * 60 * 1000);
    events.push({
      id: `med-${c.id}`,
      title: `${c.patientName} · ${c.type}`,
      start,
      end,
      resource: {
        type: "medicina",
        id: c.id,
        patientName: c.patientName,
        doctorName: c.doctorName,
        status: c.status,
      },
    });
  });

  procedimientosCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (d < from || d > to) return;
    const startMins = parseTimeToMinutes(c.time);
    const start = new Date(d + "T12:00:00");
    start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
    const end = new Date(start.getTime() + (c.duration || 30) * 60 * 1000);
    events.push({
      id: `proc-${c.id}`,
      title: `${c.patientName} · ${c.procedure_name || c.type}`,
      start,
      end,
      resource: {
        type: "procedimientos",
        id: c.id,
        patientName: c.patientName,
        doctorName: c.doctorName,
        status: c.status,
      },
    });
  });

  rxEcografiasCitas.forEach((c) => {
    if (isAppointmentCancelado(c.status)) return;
    const d = c.date.length >= 10 ? c.date.slice(0, 10) : c.date;
    if (d < from || d > to) return;
    const startMins = parseTimeToMinutes(c.time);
    const start = new Date(d + "T12:00:00");
    start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
    const end = new Date(start.getTime() + (c.duration || 30) * 60 * 1000);
    events.push({
      id: `rx-${c.id}`,
      title: `${c.patientName} · ${c.type}`,
      start,
      end,
      resource: {
        type: "rx_ecografias",
        id: c.id,
        patientName: c.patientName,
        doctorName: c.doctorName,
        status: c.status,
      },
    });
  });

  const labPatientMap: Record<string, string> = {};
  await Promise.all(
    [...new Set(labOrders.map((o) => o.patient_id))].map(async (pid) => {
      const p = await patientsService.getPatientById(pid).catch(() => null);
      if (p) labPatientMap[pid] = p.name;
    })
  );

  labOrders.forEach((order) => {
    if (isLabCancelado(order.status)) return;
    const raw = order.sample_date || order.order_date || "";
    const rawStr = String(raw);
    const d =
      raw instanceof Date
        ? `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`
        : rawStr.slice(0, 10);
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d) || d < from || d > to) return;
    const hasTime = raw instanceof Date || rawStr.includes("T");
    let start: Date;
    if (hasTime) {
      const parsed = raw instanceof Date ? raw : new Date(raw as string);
      if (isNaN(parsed.getTime())) {
        start = new Date(d + "T08:00:00");
      } else {
        const utcH = parsed.getUTCHours();
        const localH = parsed.getHours();
        const offsetMinutes = parsed.getTimezoneOffset();
        const looksLikeLocalStoredAsUtc =
          offsetMinutes > 0 &&
          utcH >= 7 &&
          utcH <= 22 &&
          localH >= 0 &&
          localH <= 9;
        if (looksLikeLocalStoredAsUtc) {
          start = new Date(parsed.getTime() + offsetMinutes * 60 * 1000);
        } else {
          start = parsed;
        }
      }
    } else {
      start = new Date(d + "T08:00:00");
    }
    const end = hasTime ? new Date(start.getTime() + 30 * 60 * 1000) : new Date(d + "T08:30:00");
    const patientName = labPatientMap[order.patient_id] ?? "Paciente";
    events.push({
      id: `lab-${order.id}`,
      title: `${patientName} · ${order.items.length} exám.`,
      start,
      end,
      resource: {
        type: "laboratorio",
        id: order.id,
        patientName,
        itemsCount: order.items.length,
        total_amount: order.total_amount,
      },
    });
  });

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type AgendaKind = "medicina" | "procedimientos" | "rx_ecografias" | "laboratorio" | "turno";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  time: string;
  patientName: string;
  /** Tipo de cita / procedimiento / "Laboratorio" / turno */
  detail: string;
  address: string;
  district: string;
  /** Mejor texto para ubicar en el mapa (dirección o, si no hay, distrito). "" si no hay. */
  mapQuery: string;
}

/**
 * Agenda del día (para la card Home con mapa): citas (medicina/procedimientos/
 * RX) + órdenes de laboratorio + turnos de cuidado, con su mejor ubicación.
 */
export async function getDayAgenda(dateYMD: string): Promise<AgendaItem[]> {
  const [med, proc, rx, labOrders, shifts] = await Promise.all([
    appointmentsService.list("medicina").catch(() => []),
    appointmentsService.list("procedimientos").catch(() => []),
    appointmentsService.list("rx_ecografias").catch(() => []),
    labOrderService.getOrdersForSampleDate(dateYMD).catch(() => []),
    shiftCareService.getShifts({ fecha_desde: dateYMD, fecha_hasta: dateYMD }).catch(() => []),
  ]);

  const items: AgendaItem[] = [];

  const pushCitas = (list: typeof med, kind: AgendaKind) => {
    list
      .filter((c) => c.date === dateYMD && !isAppointmentCancelado(c.status))
      .forEach((c) => {
        const address = c.location ?? "";
        const district = c.district ?? "";
        items.push({
          id: `${kind}-${c.id}`,
          kind,
          time: c.time ?? "",
          patientName: c.patientName ?? "Paciente",
          detail:
            kind === "procedimientos"
              ? c.procedure_name || c.type || "Procedimiento"
              : c.type || "Cita",
          address,
          district,
          mapQuery: address || district || "",
        });
      });
  };
  pushCitas(med, "medicina");
  pushCitas(proc, "procedimientos");
  pushCitas(rx, "rx_ecografias");

  // Laboratorio: nombre y dirección vienen del paciente.
  const labActive = labOrders.filter((o) => !isLabCancelado(o.status));
  const labPatientIds = [...new Set(labActive.map((o) => o.patient_id))];
  const patientInfo: Record<string, { name: string; address: string; district: string }> = {};
  await Promise.all(
    labPatientIds.map(async (pid) => {
      const p = await patientsService.getPatientById(pid).catch(() => null);
      if (p) patientInfo[pid] = { name: p.name, address: p.address ?? "", district: p.district ?? "" };
    })
  );
  labActive.forEach((o) => {
    const p = patientInfo[o.patient_id];
    const sd = o.sample_date ?? o.order_date;
    const time = sd && String(sd).includes("T") ? String(sd).slice(11, 16) : "";
    const address = p?.address ?? "";
    const district = p?.district ?? "";
    items.push({
      id: `laboratorio-${o.id}`,
      kind: "laboratorio",
      time,
      patientName: p?.name ?? "Paciente",
      detail: `Laboratorio · ${o.items?.length ?? 0} examen(es)`,
      address,
      district,
      mapQuery: address || district || "",
    });
  });

  // Turnos (solo distrito disponible como ubicación).
  shifts.forEach((s) => {
    if (s.estado === "Cancelado") return;
    const pt = s.patient;
    const patientName = Array.isArray(pt)
      ? pt[0]?.name ?? "Turno"
      : pt?.name ?? s.familiar_responsable ?? "Turno";
    const district = s.distrito ?? "";
    items.push({
      id: `turno-${s.id}`,
      kind: "turno",
      time: s.hora_inicio ?? "",
      patientName,
      detail: `Turno${s.turno ? ` · ${s.turno}` : ""}`,
      address: "",
      district,
      mapQuery: district || "",
    });
  });

  return items.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}
