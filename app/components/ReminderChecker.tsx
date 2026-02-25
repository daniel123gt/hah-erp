"use client";

import { useEffect, useRef } from "react";
import { appointmentsService } from "~/services/appointmentsService";
import labOrderService from "~/services/labOrderService";
import { getTodayLocal } from "~/lib/dateUtils";
import { useNotifications } from "~/contexts/NotificationsContext";

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

export function ReminderChecker() {
  const { addNotification, markReminderSent, wasReminderSent } = useNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReminders = () => {
    const now = Date.now();
    const oneHourFromNow = now + 60 * 60 * 1000;
    const today = getTodayLocal();

    // Citas (medicina + procedimientos) con fecha/hora en la próxima hora
    Promise.all([
      appointmentsService.list("medicina"),
      appointmentsService.list("procedimientos"),
    ]).then(([med, proc]) => {
      const all = [...med, ...proc];
      all.forEach((apt) => {
        if (apt.date !== today) return;
        const ts = parseAppointmentDateTime(apt.date, apt.time);
        if (ts < now || ts > oneHourFromNow) return;
        const key = `cita-${apt.id}-${apt.date}-${apt.time}`;
        if (wasReminderSent(key)) return;
        if (!markReminderSent(key)) return;
        addNotification(
          "recordatorio_cita",
          "Recordatorio: cita en 1 hora",
          `${apt.patientName} — ${apt.time}${apt.procedure_name ? ` · ${apt.procedure_name}` : ""}`,
          { reminderKey: key }
        );
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
          "Recordatorio: toma de muestra en 1 hora",
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
