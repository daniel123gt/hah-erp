/**
 * Datos agregados para el dashboard principal (Home).
 * Usa pacientes, citas y procedimientos para métricas reales.
 */

import patientsService from "~/services/patientsService";
import { appointmentsService } from "~/services/appointmentsService";
import { procedureService, type ProcedureRecord } from "~/services/procedureService";

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
  const from = new Date(y, m, 1).toISOString().split("T")[0];
  const to = new Date(y, m + 1, 0).toISOString().split("T")[0];
  return { from, to };
}

export interface DashboardStats {
  totalPatients: number;
  patientGrowth: number; // 0 si no hay dato anterior
  citasHoy: number;
  appointmentGrowth: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeServices: number;
  serviceGrowth: number;
}

export interface TodayAppointmentItem {
  id: string;
  patient: string;
  time: string;
  doctor: string;
  type: string;
  status: string;
  priority: string;
  variant: "medicina" | "procedimientos";
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
  topServices: TopServiceItem[];
  recentActivity: RecentActivityItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date().toISOString().split("T")[0];
  const { from: monthFrom, to: monthTo } = getMonthRange();

  const [patientStats, medicinaCitas, procedimientosCitas, procedureCatalog, procedureRecords] =
    await Promise.all([
      patientsService.getPatientStats().catch(() => ({ total: 0, thisMonth: 0 })),
      appointmentsService.list("medicina"),
      appointmentsService.list("procedimientos"),
      procedureService.getCatalog(true),
      procedureService.getRecords({
        fromDate: monthFrom,
        toDate: monthTo,
        limit: 500,
      }),
    ]);

  const todayMedicina = medicinaCitas.filter((c) => c.date === today);
  const todayProcedimientos = procedimientosCitas.filter((c) => c.date === today);
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
  ].sort((a, b) => a.time.localeCompare(b.time));

  const monthlyRevenue = procedureRecords.data.reduce(
    (sum, r) => sum + sumRecordRevenue(r),
    0
  );

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
    monthlyRevenue,
    revenueGrowth: 0,
    activeServices: procedureCatalog.length,
    serviceGrowth: 0,
  };

  return {
    stats,
    todayAppointments,
    topServices,
    recentActivity,
  };
}
