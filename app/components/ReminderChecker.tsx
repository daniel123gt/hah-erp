"use client";

import { useEffect, useRef } from "react";
import { appointmentsService } from "~/services/appointmentsService";
import labOrderService from "~/services/labOrderService";
import { getTodayLocal } from "~/lib/dateUtils";
import { useNotifications, type NotifCategory } from "~/contexts/NotificationsContext";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 min

/** Convierte date (YYYY-MM-DD) + time (HH:mm o H:mm) a timestamp local (mediodía del día + time). */
function parseAppointmentDateTime(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const time = (timeStr || "").trim();
  const [hh = 0, mm = 0] = time.includes(":") ? time.split(":").map(Number) : [0, 0];
  return new Date(y, m - 1, d, hh, mm, 0).getTime();
}

/** Parsea sample_date (YYYY-MM-DD o ISO con hora) a timestamp. */
function parseSampleDateTime(sampleDate: string | null | undefined): number | null {
  if (!sampleDate) return null;
  const s = String(sampleDate).trim();
  if (s.includes("T")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

/** Formatea sample_date a hora local HH:mm para mostrar en notificaciones (sin afectar calendario). */
function formatSampleTimeLocal(sampleDate: string | null | undefined): string {
  if (!sampleDate) return "programado";
  const s = String(sampleDate).trim();
  if (!s.includes("T")) return "programado";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "programado";
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Texto del tiempo restante para el aviso (ej. "en 10 minutos", "en 1 hora"). */
function relativeWhen(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins <= 0) return "ahora";
  if (mins === 1) return "en 1 minuto";
  if (mins < 60) return `en ${mins} minutos`;
  return "en 1 hora";
}

export function ReminderChecker() {
  const { addNotification, markReminderSent, wasReminderSent } = useNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReminders = () => {
    const now = Date.now();
    const oneHourFromNow = now + 60 * 60 * 1000;
    const today = getTodayLocal();

    // Citas (medicina + procedimientos + RX/Ecografías) con fecha/hora en la próxima hora
    Promise.all([
      appointmentsService.list("medicina"),
      appointmentsService.list("procedimientos"),
      appointmentsService.list("rx_ecografias"),
    ]).then(([med, proc, rxEco]) => {
      const groups: Array<{ list: typeof med; cat: NotifCategory }> = [
        { list: med, cat: "medicina" },
        { list: proc, cat: "procedimientos" },
        { list: rxEco, cat: "rx_ecografias" },
      ];
      groups.forEach(({ list, cat }) => {
        list.forEach((apt) => {
          if (apt.date !== today) return;
          const ts = parseAppointmentDateTime(apt.date, apt.time);
          if (ts < now || ts > oneHourFromNow) return;
          const key = `cita-${apt.id}-${apt.date}-${apt.time}`;
          if (wasReminderSent(key)) return;
          if (!markReminderSent(key)) return;
          const place = apt.location || apt.district || "";
          const profLabel =
            cat === "procedimientos" ? "Enfermera" : cat === "rx_ecografias" ? "Téc./Méd." : "Médico";
          const lines = [`${apt.patientName} · ${apt.time}`];
          if (cat === "procedimientos" && apt.procedure_name) lines.push(apt.procedure_name);
          if (apt.doctorName) lines.push(`${profLabel}: ${apt.doctorName}`);
          if (place) lines.push(`📍 ${place}`);
          addNotification("recordatorio_cita", `Recordatorio: cita ${relativeWhen(ts - now)}`, lines.join("\n"), {
            reminderKey: key,
            category: cat,
          });
        });
      });
    }).catch(() => {});

    // Órdenes de laboratorio con sample_date en la próxima hora
    labOrderService.getOrdersForSampleDate(today).then((orders) => {
      orders.forEach((order) => {
        const sampleStr = order.sample_date ?? order.order_date;
        const ts = parseSampleDateTime(sampleStr);
        if (ts == null || ts < now || ts > oneHourFromNow) return;
        const key = `lab-${order.id}-${sampleStr}`;
        if (wasReminderSent(key)) return;
        if (!markReminderSent(key)) return;
        const timePart = formatSampleTimeLocal(sampleStr);
        addNotification(
          "recordatorio_laboratorio",
          `Recordatorio: toma de muestra ${relativeWhen(ts - now)}`,
          `Orden con ${order.items?.length ?? 0} examen(es) — ${timePart}`,
          { reminderKey: key }
        );
      });
    }).catch(() => {});
  };

  useEffect(() => {
    checkReminders();
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
