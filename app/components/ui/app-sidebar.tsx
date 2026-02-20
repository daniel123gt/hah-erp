import { useState, useEffect, useMemo } from "react";
import {
  Home,
  Settings,
  FlaskConical,
  Users,
  Power,
  UserCheck,
  Calendar,
  Package,
  HeartPulse,
  ClipboardList,
  Building2,
  Clock,
  ChevronDown,
  BarChart3,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "~/components/ui/sidebar";
import { logout } from "~/services/authService";
import { useAuthStore, getAppRole, type AppRole } from "~/store/authStore";
import { useNavigate, useLocation, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "~/lib/utils";
import "./sidebar-scroll.css";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  children?: { title: string; url: string }[];
};

const items: NavItem[] = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
  },
  {
    title: "Enfermería",
    url: "/enfermeria",
    icon: HeartPulse,
    children: [
      { title: "Valoración inicial", url: "/enfermeria/valoracion-inicial" },
      { title: "Signos vitales", url: "/enfermeria/signos-vitales" },
      { title: "Evolución", url: "/enfermeria/evolucion" },
      { title: "Eliminación", url: "/enfermeria/eliminacion" },
      { title: "Valoraciones", url: "/enfermeria/valoraciones" },
    ],
  },
  {
    title: "Laboratorio",
    url: "/laboratorio",
    icon: FlaskConical,
    children: [
      { title: "Nueva orden", url: "/laboratorio/seleccionar" },
      { title: "Órdenes", url: "/laboratorio/ordenes" },
      { title: "Catálogo de exámenes", url: "/laboratorio/buscar" },
      { title: "Reportes", url: "/laboratorio/reportes" },
    ],
  },
  {
    title: "Personal",
    url: "/personal",
    icon: UserCheck,
    children: [
      { title: "Enfermería", url: "/personal/enfermeria" },
      { title: "Medicina", url: "/personal/medicina" },
      { title: "Administración", url: "/personal/administracion" },
    ],
  },
  {
    title: "Citas",
    url: "/citas",
    icon: Calendar,
    children: [
      { title: "Citas Medicina", url: "/citas/medicina" },
      { title: "Citas Procedimientos", url: "/citas/procedimientos" },
    ],
  },
  {
    title: "Procedimientos",
    url: "/procedimientos",
    icon: ClipboardList,
    children: [
      { title: "Catálogo", url: "/procedimientos/catalogo" },
      { title: "Listado", url: "/procedimientos/listado" },
      { title: "Reportes", url: "/procedimientos/reportes" },
    ],
  },
  {
    title: "Registro Citas Médicas",
    url: "/registro-citas-medicas",
    icon: Calendar,
    children: [
      { title: "Listado", url: "/registro-citas-medicas/listado" },
      { title: "Reportes", url: "/registro-citas-medicas/reportes" },
    ],
  },
  {
    title: "Cuidados en casa",
    url: "/cuidados-en-casa",
    icon: Building2,
    children: [
      { title: "Reportes", url: "/cuidados-en-casa/reportes" },
    ],
  },
  {
    title: "Cuidados por turnos",
    url: "/cuidados-por-turnos",
    icon: Clock,
    children: [
      { title: "Reportes", url: "/cuidados-por-turnos/reportes" },
    ],
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
    children: [
      { title: "Laboratorio", url: "/laboratorio/reportes" },
      { title: "Procedimientos", url: "/procedimientos/reportes" },
      { title: "Cuidados por turnos", url: "/cuidados-por-turnos/reportes" },
    ],
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Package,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
];

/** Títulos de sección que el rol "gestor" puede ver. Admin ve todo. "Reportes" (reportes general) solo admin. */
const GESTOR_ALLOWED_TITLES: string[] = [
  "Inicio",
  "Pacientes",
  "Enfermería",
  "Laboratorio",
  "Citas",
];

/** Subrutas que el gestor no puede ver (por sección). */
const GESTOR_HIDDEN_CHILDREN: Record<string, string[]> = {
  Laboratorio: ["/laboratorio/reportes"],
};

function filterItemsByRole(items: NavItem[], role: AppRole): NavItem[] {
  if (role === "admin") return items;
  return items
    .filter((item) => GESTOR_ALLOWED_TITLES.includes(item.title))
    .map((item) => {
      const hiddenUrls: string[] | undefined =
        role === "gestor" && item.children ? GESTOR_HIDDEN_CHILDREN[item.title] : undefined;
      if (!hiddenUrls?.length) return item;
      return {
        ...item,
        children: item.children!.filter((c) => !hiddenUrls.includes(c.url)),
      };
    });
}

function getOpenSectionForPath(pathname: string, visibleItems: NavItem[]): string | null {
  const match = visibleItems.find(
    (item) =>
      item.children && item.children.length > 0 &&
      (item.url === "/"
        ? pathname === "/"
        : pathname === item.url || pathname.startsWith(item.url + "/"))
  );
  return match?.title ?? null;
}

export function AppSidebar() {
  const { logout: logoutUser, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getAppRole(user);
  const visibleItems = useMemo(() => filterItemsByRole(items, role), [role]);
  const [openSection, setOpenSection] = useState<string | null>(() =>
    getOpenSectionForPath(location.pathname, visibleItems)
  );

  useEffect(() => {
    const key = getOpenSectionForPath(location.pathname, visibleItems);
    if (key) setOpenSection(key);
  }, [location.pathname, visibleItems]);

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignorar: authService ya no lanza, pero por si acaso
    } finally {
      logoutUser();
      toast.success("Sesión cerrada exitosamente");
      navigate("/login");
    }
  };

  return (
    <Sidebar
      style={{
        background: "#1F3666",
      }}
    >
      <SidebarContent className="bg-primary-blue text-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="p-8 flex justify-center">
              <img src="/logo.svg" alt="Health at Home" className="w-2/3" />
            </div>
          </SidebarGroupContent>
          
          {/* Información del usuario */}
            {user && (
              <SidebarGroupContent className="px-4 pb-4">
                <div className="bg-accent-blue rounded-full flex items-center gap-3 p-3">
                  <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary-blue font-bold truncate">
                      {user?.user_metadata?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-200 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </SidebarGroupContent>
            )}
          
          <SidebarGroupContent className="px-4">
            <SidebarMenu className="custom-scrollbar-ondemand">
              {visibleItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openSection === item.title;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className="text-base hover:bg-transparent hover:text-accent-blue cursor-pointer"
                        size="lg"
                        asChild
                      >
                        <Link to={item.url}>
                          <item.icon color={isActive(item.url) ? "#73CBCF" : "white"} />
                          <span className={isActive(item.url) ? "text-accent-blue" : ""}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={(open) => setOpenSection(open ? item.title : null)}
                    >
                      <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none hover:bg-white/10 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2 [&>span:last-child]:truncate">
                        <Link
                          to={item.url}
                          className={cn(
                            "flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                            "text-base hover:text-accent-blue cursor-pointer",
                            isActive(item.url) && "text-accent-blue"
                          )}
                        >
                          <item.icon color={isActive(item.url) ? "#73CBCF" : "white"} className="size-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 text-white/80 outline-none hover:bg-white/10 hover:text-accent-blue focus-visible:ring-2 focus-visible:ring-white/50"
                            aria-label={isOpen ? "Cerrar sección" : "Abrir sección"}
                          >
                            <ChevronDown
                              className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children!.map((sub) => (
                            <SidebarMenuSubItem key={sub.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(sub.url)}
                                className={
                                  isActive(sub.url)
                                    ? "text-accent-blue bg-white/10"
                                    : "text-white/90 hover:text-accent-blue"
                                }
                              >
                                <Link to={sub.url}>{sub.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-primary-blue p-6">
        <Button 
          onClick={handleLogout}
          className="bg-accent-blue hover:bg-accent-blue/80 cursor-pointer"
        >
          <Power />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
