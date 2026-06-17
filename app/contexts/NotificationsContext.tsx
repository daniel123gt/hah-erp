"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";
import { playNotificationSound } from "~/lib/notificationSound";
import { useAuthStore } from "~/store/authStore";

export type NotificationType =
  | "cita_programada"
  | "laboratorio_programado"
  | "recordatorio_cita"
  | "recordatorio_laboratorio";

/** Un aviso/recordatorio (vs una notificación de creación). Estos son más llamativos. */
export function isReminderType(type: NotificationType): boolean {
  return type === "recordatorio_cita" || type === "recordatorio_laboratorio";
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: number;
  /** Para recordatorios: id del item (cita o orden) para no repetir */
  reminderKey?: string;
}

type CreatedByMeType = "appointment" | "lab_order";
const CREATED_BY_ME_TTL_MS = 15_000;

interface NotificationsContextValue {
  notifications: AppNotification[];
  permission: NotificationPermission | "default";
  addNotification: (
    type: NotificationType,
    title: string,
    body: string,
    options?: { showNative?: boolean; reminderKey?: string }
  ) => void;
  requestPermission: () => Promise<boolean>;
  clearNotifications: () => void;
  markReminderSent: (key: string) => boolean;
  wasReminderSent: (key: string) => boolean;
  /** Para no mostrar por Realtime la acción que acabo de hacer en esta pestaña */
  markCreatedByMe: (type: CreatedByMeType, id: string) => void;
  isCreatedByMe: (type: CreatedByMeType, id: string) => boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const MAX_NOTIFICATIONS = 50;
/** Cada cuánto vuelve a sonar un aviso mientras su toast siga sin cerrarse. */
const RESOUND_AVISO_MS = 5 * 60 * 1000; // 5 minutos

function showNativeNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/logo.svg",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "default">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const remindedKeysRef = useRef<Set<string>>(new Set());
  const createdByMeRef = useRef<Map<string, number>>(new Map());
  /** Intervalos de re-sonido por cada toast de aviso abierto (clave = id del toast). */
  const avisoIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  /** Detiene el re-sonido de un aviso (cuando se cierra su toast). */
  const stopAvisoSound = useCallback((toastId: string) => {
    const iv = avisoIntervalsRef.current.get(toastId);
    if (iv) {
      clearInterval(iv);
      avisoIntervalsRef.current.delete(toastId);
    }
  }, []);

  // Al desmontar, limpiar todos los intervalos pendientes.
  useEffect(() => {
    const intervals = avisoIntervalsRef.current;
    return () => {
      intervals.forEach((iv) => clearInterval(iv));
      intervals.clear();
    };
  }, []);

  // Persistencia POR USUARIO: cada usuario guarda su propia lista en su
  // navegador (localStorage). Es independiente entre usuarios y sobrevive
  // recargas. Limpiar solo afecta a ese usuario.
  const user = useAuthStore((s) => s.user);
  const storageKey = user?.id
    ? `hah-notif:${user.id}`
    : user?.email
      ? `hah-notif:${user.email}`
      : null;
  /** Salta exactamente un guardado tras una carga (evita pisar lo guardado al montar). */
  const skipSaveRef = useRef(false);

  // Cargar las notificaciones guardadas del usuario actual.
  useEffect(() => {
    if (typeof window === "undefined") return;
    skipSaveRef.current = true;
    if (!storageKey) {
      setNotifications([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setNotifications(Array.isArray(parsed) ? (parsed as AppNotification[]) : []);
    } catch {
      setNotifications([]);
    }
  }, [storageKey]);

  // Guardar al cambiar las notificaciones (omitiendo el guardado posterior a la carga).
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // ignorar (cuota llena, modo privado, etc.)
    }
  }, [notifications, storageKey]);

  const markCreatedByMe = useCallback((type: CreatedByMeType, id: string) => {
    const key = `${type}:${id}`;
    createdByMeRef.current.set(key, Date.now());
    setTimeout(() => {
      createdByMeRef.current.delete(key);
    }, CREATED_BY_ME_TTL_MS);
  }, []);

  const isCreatedByMe = useCallback((type: CreatedByMeType, id: string): boolean => {
    const key = `${type}:${id}`;
    const ts = createdByMeRef.current.get(key);
    if (!ts) return false;
    if (Date.now() - ts > CREATED_BY_ME_TTL_MS) {
      createdByMeRef.current.delete(key);
      return false;
    }
    return true;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const markReminderSent = useCallback((key: string): boolean => {
    if (remindedKeysRef.current.has(key)) return false;
    remindedKeysRef.current.add(key);
    return true;
  }, []);

  const wasReminderSent = useCallback((key: string) => remindedKeysRef.current.has(key), []);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      body: string,
      options?: { showNative?: boolean; reminderKey?: string }
    ) => {
      const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const item: AppNotification = {
        id,
        type,
        title,
        body,
        createdAt: Date.now(),
        reminderKey: options?.reminderKey,
      };
      setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));

      const showNative = options?.showNative !== false;
      if (showNative && permission === "granted") showNativeNotification(title, body);

      const isAviso = isReminderType(type);
      // Sonido: sutil al crear, más potente en los avisos.
      playNotificationSound(isAviso ? "alert" : "subtle");

      if (isAviso) {
        // Aviso (recordatorio): tarjeta naranja grande y llamativa que NO se
        // cierra sola (queda hasta que el usuario presione la X).
        const close = () => {
          stopAvisoSound(id);
          toast.dismiss(id);
        };
        toast.custom(
          () => (
            <div className="flex w-[min(94vw,480px)] items-start gap-3 rounded-xl border-2 border-orange-500 bg-orange-50 p-5 shadow-2xl">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-tight text-orange-900">{title}</p>
                <p className="mt-1 text-base text-orange-800">{body}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="shrink-0 rounded-md p-1 text-orange-500 hover:bg-orange-200 hover:text-orange-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ),
          { id, duration: Infinity, onDismiss: () => stopAvisoSound(id) }
        );
        // Mientras el toast siga abierto, vuelve a sonar cada 5 minutos.
        stopAvisoSound(id); // por si ya existía uno con este id
        const iv = setInterval(() => playNotificationSound("alert"), RESOUND_AVISO_MS);
        avisoIntervalsRef.current.set(id, iv);
      } else {
        toast.info(title, { description: body, duration: 5000 });
      }
    },
    [permission, stopAvisoSound]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Detener todos los re-sonidos y cerrar los toasts abiertos.
    avisoIntervalsRef.current.forEach((iv) => clearInterval(iv));
    avisoIntervalsRef.current.clear();
    toast.dismiss();
  }, []);

  const value: NotificationsContextValue = {
    notifications,
    permission,
    addNotification,
    requestPermission,
    clearNotifications,
    markReminderSent,
    wasReminderSent,
    markCreatedByMe,
    isCreatedByMe,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

/** Versión opcional: devuelve null si no hay provider (evita error en modales/portales). */
export function useNotificationsOptional(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}
