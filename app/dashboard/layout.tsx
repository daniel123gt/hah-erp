import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { useAuthStore, getAppRole } from "~/store/authStore";
import { Navigate, Outlet, useLocation } from "react-router";
import Loading from "~/components/root/Loading/Loading";

/** Rutas que el rol gestor puede acceder (prefijos o ruta exacta). */
const GESTOR_ALLOWED_PATHS = ["/", "/pacientes", "/enfermeria", "/laboratorio", "/citas"];
/** Prefijos prohibidos para gestor (aunque esté dentro de una ruta permitida). */
const GESTOR_FORBIDDEN_PATHS = ["/laboratorio/reportes"];

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
    <SidebarProvider style={{
        "--sidebar-width": "17rem",
        "--sidebar-background": "#1F3666"
    } as React.CSSProperties }>
      <AppSidebar />
      <main className="py-12 px-8 text-primary-blue flex-1 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <RightSidebar />
    </SidebarProvider>
  );
}
