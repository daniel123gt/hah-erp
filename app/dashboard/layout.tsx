import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { NotificationsProvider } from "~/contexts/NotificationsContext";
import { NotificationBell } from "~/components/NotificationBell";
import { ReminderChecker } from "~/components/ReminderChecker";
import { RealtimeNotificationsSubscriber } from "~/components/RealtimeNotificationsSubscriber";
import { useAuthStore, getAppRole } from "~/store/authStore";
import { Navigate, Outlet, useLocation } from "react-router";
import Loading from "~/components/root/Loading/Loading";
import { getPrimaryColor } from "~/lib/erpBranding";

/** Rutas que el rol gestor puede acceder (prefijos o ruta exacta). /reportes (Reportes general) solo admin. */
const GESTOR_ALLOWED_PATHS = ["/", "/pacientes", "/enfermeria", "/laboratorio", "/citas"];
/** Prefijos prohibidos para gestor (aunque esté dentro de una ruta permitida). */
const GESTOR_FORBIDDEN_PATHS: string[] = [];

function gestorCanAccessPath(pathname: string): boolean {
  if (GESTOR_FORBIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return false;
  if (pathname === "/") return true;
  return GESTOR_ALLOWED_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
}

export default function Layout() {
  const { user, hasHydrated } = useAuthStore();
  const location = useLocation();
  const role = getAppRole(user);

  if (!hasHydrated) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to={"login"} replace />;
  }

  if (role === "gestor" && !gestorCanAccessPath(location.pathname)) {
    const to = location.pathname.startsWith("/laboratorio") ? "/laboratorio" : "/";
    return <Navigate to={to} replace />;
  }

  return (
    <NotificationsProvider>
      <ReminderChecker />
      <RealtimeNotificationsSubscriber />
      <SidebarProvider style={{
          "--sidebar-width": "17rem",
          "--sidebar-background": getPrimaryColor()
      } as React.CSSProperties }>
        <AppSidebar />
        <main className="py-12 px-8 text-primary-blue flex-1 max-w-full overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex justify-end">
              <NotificationBell />
            </div>
            <Outlet />
          </div>
        </main>
        <RightSidebar />
      </SidebarProvider>
    </NotificationsProvider>
  );
}
