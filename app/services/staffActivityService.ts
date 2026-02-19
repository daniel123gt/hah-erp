/**
 * Actividad reciente de un empleado: citas (médico), turnos de cuidado, registros de enfermería, etc.
 */

import supabase from "~/utils/supabase";
import { appointmentsService } from "~/services/appointmentsService";
import { shiftCareService } from "~/services/shiftCareService";

export interface StaffActivityItem {
  id: string;
  type: "cita_medicina" | "cita_procedimiento" | "turno_cuidado" | "eliminacion" | "valoracion" | "evolucion" | "signos_vitales";
  typeLabel: string;
  description: string;
  date: string;
  time: string;
  extra?: string;
}

const LIMIT_PER_SOURCE = 15;

/** Normaliza nombre para comparación (trim, mayúsculas). */
function normalizeName(name: string | null | undefined): string {
  return (name ?? "").trim().toUpperCase();
}

/** Devuelve true si el nombre del staff coincide con el de la actividad (comparación flexible). */
function nameMatches(staffName: string, activityName: string | null | undefined): boolean {
  if (!activityName || !staffName) return false;
  const s = normalizeName(staffName);
  const a = normalizeName(activityName);
  return a === s || a.includes(s) || s.includes(a);
}

/**
 * Obtiene la actividad reciente de un empleado (citas como doctor, turnos como enfermera,
 * registros de eliminación, valoraciones, evoluciones, signos vitales).
 */
export async function getStaffActivity(staffName: string): Promise<StaffActivityItem[]> {
  if (!staffName?.trim()) return [];

  const items: StaffActivityItem[] = [];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const fromDate = threeMonthsAgo.toISOString().slice(0, 10);

  try {
    const [
      medicinaCitas,
      procedimientosCitas,
      careShiftsRaw,
      eliminationRecords,
      initialAssessments,
      evolutions,
      vitalSigns,
    ] = await Promise.all([
      appointmentsService.list("medicina"),
      appointmentsService.list("procedimientos"),
      shiftCareService.getShifts({ limit: 100 }),
      supabase
        .from("elimination_records")
        .select("id, record_date, patient_name, nurse_name, created_at")
        .ilike("nurse_name", `%${staffName.trim()}%`)
        .order("record_date", { ascending: false })
        .limit(LIMIT_PER_SOURCE)
        .then((r) => (r.data ?? [])),
      supabase
        .from("nursing_initial_assessments")
        .select("id, assessment_date, patient_name, nurse_name, created_at")
        .ilike("nurse_name", `%${staffName.trim()}%`)
        .order("assessment_date", { ascending: false })
        .limit(LIMIT_PER_SOURCE)
        .then((r) => (r.data ?? [])),
      supabase
        .from("nursing_evolutions")
        .select("id, evolution_date, patient_name, nurse_name, created_at")
        .ilike("nurse_name", `%${staffName.trim()}%`)
        .order("evolution_date", { ascending: false })
        .limit(LIMIT_PER_SOURCE)
        .then((r) => (r.data ?? [])),
      supabase
        .from("nursing_vital_signs")
        .select("id, assessment_datetime, nurse_name, created_at")
        .ilike("nurse_name", `%${staffName.trim()}%`)
        .order("assessment_datetime", { ascending: false })
        .limit(LIMIT_PER_SOURCE)
        .then((r) => (r.data ?? [])),
    ]);

    const nameNorm = normalizeName(staffName);

    medicinaCitas
      .filter((c) => nameMatches(staffName, c.doctorName))
      .slice(0, LIMIT_PER_SOURCE)
      .forEach((c) => {
        items.push({
          id: `med-${c.id}`,
          type: "cita_medicina",
          typeLabel: "Cita medicina",
          description: `Cita con ${c.patientName}`,
          date: c.date,
          time: c.time || "",
          extra: c.type,
        });
      });

    procedimientosCitas
      .filter((c) => nameMatches(staffName, c.doctorName))
      .slice(0, LIMIT_PER_SOURCE)
      .forEach((c) => {
        items.push({
          id: `proc-${c.id}`,
          type: "cita_procedimiento",
          typeLabel: "Cita procedimiento",
          description: `${c.procedure_name || c.type} - ${c.patientName}`,
          date: c.date,
          time: c.time || "",
        });
      });

    careShiftsRaw
      .filter((s) => s.enfermera && normalizeName(s.enfermera) === nameNorm)
      .slice(0, LIMIT_PER_SOURCE)
      .forEach((s) => {
        const patientName = Array.isArray(s.patient) ? s.patient[0]?.name : (s.patient as { name?: string } | null)?.name;
        items.push({
          id: `shift-${s.id}`,
          type: "turno_cuidado",
          typeLabel: "Turno cuidado",
          description: patientName ? `Turno - ${patientName}` : "Turno de cuidado",
          date: (s.fecha || "").slice(0, 10),
          time: s.hora_inicio || "",
          extra: s.turno ?? undefined,
        });
      });

    (eliminationRecords as { id: string; record_date: string; patient_name?: string; nurse_name?: string }[]).forEach(
      (r) => {
        items.push({
          id: `elim-${r.id}`,
          type: "eliminacion",
          typeLabel: "Eliminación heces/orina",
          description: `Registro - ${r.patient_name ?? "Paciente"}`,
          date: (r.record_date || "").slice(0, 10),
          time: "",
        });
      }
    );

    (initialAssessments as { id: string; assessment_date: string; patient_name?: string }[]).forEach((r) => {
      items.push({
        id: `val-${r.id}`,
        type: "valoracion",
        typeLabel: "Valoración inicial",
        description: `Valoración - ${r.patient_name ?? "Paciente"}`,
        date: (r.assessment_date || "").slice(0, 10),
        time: "",
      });
    });

    (evolutions as { id: string; evolution_date: string; patient_name?: string }[]).forEach((r) => {
      items.push({
        id: `evol-${r.id}`,
        type: "evolucion",
        typeLabel: "Evolución enfermería",
        description: `Evolución - ${r.patient_name ?? "Paciente"}`,
        date: (r.evolution_date || "").slice(0, 10),
        time: "",
      });
    });

    (vitalSigns as { id: string; assessment_datetime: string }[]).forEach((r) => {
      const dt = r.assessment_datetime || "";
      const date = dt.slice(0, 10);
      const time = dt.length >= 16 ? dt.slice(11, 16) : "";
      items.push({
        id: `vs-${r.id}`,
        type: "signos_vitales",
        typeLabel: "Signos vitales",
        description: "Registro de signos vitales",
        date,
        time,
      });
    });

    items.sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return (b.time || "").localeCompare(a.time || "");
    });

    return items.slice(0, 30);
  } catch (err) {
    console.error("getStaffActivity:", err);
    return [];
  }
}
