import {
  Home,
  Settings,
  FlaskConical,
  Users,
  Power,
  UserCheck,
  Calendar,
  Stethoscope,
  Package,
  DollarSign,
  BarChart3,
  HeartPulse,
  ClipboardList,
  Building2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "~/components/ui/sidebar";
import { logout } from "~/services/authService";
import { useAuthStore } from "~/store/authStore";
import { useNavigate, useLocation, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "./button";
import "./sidebar-scroll.css";

const items = [
  // Prioridad solicitada: Inicio, Pacientes, Enfermería, Laboratorio
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
  },
  {
    title: "Laboratorio",
    url: "/laboratorio",
    icon: FlaskConical,
  },
  // Resto de opciones
  {
    title: "Personal",
    url: "/personal",
    icon: UserCheck,
  },
  {
    title: "Citas",
    url: "/citas",
    icon: Calendar,
  },
  {
    title: "Procedimientos",
    url: "/procedimientos",
    icon: ClipboardList,
  },
  {
    title: "Servicios",
    url: "/servicios",
    icon: Stethoscope,
  },
  {
    title: "Cuidados en casa",
    url: "/cuidados-en-casa",
    icon: Building2,
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Package,
  },
  {
    title: "Facturacion",
    url: "/facturacion",
    icon: DollarSign,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { logout: logoutUser, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      logoutUser();
      toast.success("Sesión cerrada exitosamente");
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  console.log(user);

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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="text-base hover:bg-transparent hover:text-accent-blue cursor-pointer"
                    size={"lg"}
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
              ))}
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
