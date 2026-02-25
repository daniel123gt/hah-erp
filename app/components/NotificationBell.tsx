"use client";

import { useState } from "react";
import { Bell, Calendar, FlaskConical, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useNotifications, type NotificationType } from "~/contexts/NotificationsContext";

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

export function NotificationBell() {
  const { notifications, permission, requestPermission, clearNotifications } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-blue hover:bg-primary-blue/10">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-blue text-[10px] font-medium text-white">
              {notifications.length > 99 ? "99+" : notifications.length}
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
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              No hay notificaciones
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="px-3 py-2.5 hover:bg-gray-50">
                  <div className="flex gap-2">
                    {getIcon(n.type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
