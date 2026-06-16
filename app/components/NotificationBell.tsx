"use client";

import { useState } from "react";
import { Bell, Calendar, FlaskConical, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  useNotifications,
  isReminderType,
  type NotificationType,
  type AppNotification,
} from "~/contexts/NotificationsContext";
import { cn } from "~/lib/utils";

function getIcon(type: NotificationType) {
  switch (type) {
    case "cita_programada":
    case "recordatorio_cita":
      return <Calendar className="w-4 h-4 text-primary-blue shrink-0" />;
    case "laboratorio_programado":
    case "recordatorio_laboratorio":
      return <FlaskConical className="w-4 h-4 text-primary-blue shrink-0" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500 shrink-0" />;
  }
}

function formatTime(createdAt: number) {
  const d = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Ahora";
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function NotificationList({ items, accent }: { items: AppNotification[]; accent?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        No hay {accent ? "avisos" : "notificaciones"}
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {items.map((n) => (
        <li
          key={n.id}
          className={cn("px-3 py-2.5 hover:bg-gray-50", accent && "border-l-4 border-orange-400 bg-orange-50/40")}
        >
          <div className="flex gap-2">
            {accent ? <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" /> : getIcon(n.type)}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-gray-900 truncate">{n.title}</p>
              <p className="text-xs text-gray-600 line-clamp-2">{n.body}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NotificationBell() {
  const { notifications, permission, requestPermission, clearNotifications } = useNotifications();
  const [openBell, setOpenBell] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  const reminders = notifications.filter((n) => isReminderType(n.type));
  const regular = notifications.filter((n) => !isReminderType(n.type));

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) setOpenBell(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Campana: notificaciones generales */}
      <Popover open={openBell} onOpenChange={setOpenBell}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-11 w-11 text-primary-blue hover:bg-primary-blue/10">
            <Bell className="w-7 h-7" />
            {regular.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-blue text-[10px] font-medium text-white">
                {regular.length > 99 ? "99+" : regular.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-3 py-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearNotifications}>
                Limpiar
              </Button>
            )}
          </div>
          {permission !== "granted" && (
            <div className="p-3 border-b bg-amber-50">
              <p className="text-sm text-gray-700 mb-2">
                Permite notificaciones para recibir avisos de citas y laboratorio aunque uses otra pestaña.
              </p>
              <Button size="sm" className="w-full" onClick={handleRequestPermission}>
                Permitir notificaciones
              </Button>
            </div>
          )}
          <div className="max-h-[320px] overflow-y-auto">
            <NotificationList items={regular} />
          </div>
        </PopoverContent>
      </Popover>

      {/* Icono de alerta: avisos (recordatorios), más llamativo */}
      <Popover open={openAlert} onOpenChange={setOpenAlert}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-11 w-11",
              reminders.length > 0 ? "text-orange-500 hover:bg-orange-100" : "text-gray-400 hover:bg-gray-100"
            )}
            aria-label="Avisos"
          >
            <AlertTriangle className={cn("w-7 h-7", reminders.length > 0 && "animate-pulse")} />
            {reminders.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {reminders.length > 99 ? "99+" : reminders.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-3 py-2 flex items-center justify-between bg-orange-50">
            <h3 className="font-semibold text-orange-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Avisos
            </h3>
            {reminders.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearNotifications}>
                Limpiar
              </Button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            <NotificationList items={reminders} accent />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
