"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type NotificationType =
  | "cita_programada"
  | "laboratorio_programado"
  | "recordatorio_cita"
  | "recordatorio_laboratorio";

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
      toast.info(title, { description: body, duration: 5000 });
    },
    [permission]
  );

  const clearNotifications = useCallback(() => setNotifications([]), []);

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
