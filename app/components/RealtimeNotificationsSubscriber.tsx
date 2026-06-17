"use client";

import { useEffect, useRef } from "react";
import supabase from "~/utils/supabase";
import { useNotifications, type NotifCategory } from "~/contexts/NotificationsContext";

/** Formatea fecha ISO o YYYY-MM-DD a dd/mm/yyyy para mostrar */
function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const part = String(s).trim().split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  const [y, m, d] = part.split("-");
  return `${d}/${m}/${y}`;
}

export function RealtimeNotificationsSubscriber() {
  const { addNotification, isCreatedByMe } = useNotifications();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-appointments-lab")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = row?.id as string | undefined;
          if (!id || isCreatedByMe("appointment", id)) return;
          const patientName = (row?.patient_name as string) ?? "Paciente";
          const date = formatDate((row?.date as string) ?? "");
          const time = (row?.time as string) ?? "";
          const variant = (row?.variant as string) ?? "";
          const procedureName = (row?.procedure_name as string) ?? "";
          const doctorName = (row?.doctor_name as string) ?? "";
          const place = (row?.location as string) || (row?.district as string) || "";

          const title =
            variant === "procedimientos"
              ? "Nuevo procedimiento programado"
              : variant === "rx_ecografias"
                ? "Nueva cita de RX / Ecografía"
                : "Nueva cita médica";
          const profLabel =
            variant === "procedimientos"
              ? "Enfermera"
              : variant === "rx_ecografias"
                ? "Téc./Méd."
                : "Médico";

          const lines = [`${patientName} · ${date} ${time}`.trim()];
          if (variant === "procedimientos" && procedureName) lines.push(procedureName);
          if (doctorName) lines.push(`${profLabel}: ${doctorName}`);
          if (place) lines.push(`📍 ${place}`);

          const category = (["medicina", "procedimientos", "rx_ecografias"].includes(variant)
            ? variant
            : undefined) as NotifCategory | undefined;

          addNotification("cita_programada", title, lines.join("\n"), { category });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lab_exam_orders" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = row?.id as string | undefined;
          if (!id || isCreatedByMe("lab_order", id)) return;
          const sampleDate = (row?.sample_date as string) ?? row?.order_date ?? "";
          const dateStr = sampleDate ? formatDate(String(sampleDate).slice(0, 10)) : "";
          const timeStr = String(sampleDate).includes("T") ? String(sampleDate).slice(11, 16) : "";
          const when = dateStr && timeStr ? `${dateStr} ${timeStr}` : dateStr || "Programada";
          addNotification(
            "laboratorio_programado",
            "Nueva orden de laboratorio",
            `Orden creada · ${when}`
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Error al suscribirse a notificaciones. ¿Realtime habilitado en Supabase para appointments y lab_exam_orders?");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [addNotification, isCreatedByMe]);

  return null;
}
