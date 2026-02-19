import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AddStaffModal } from "~/components/ui/add-staff-modal";
import { ViewStaffModal } from "~/components/ui/view-staff-modal";
import { EditStaffModal } from "~/components/ui/edit-staff-modal";
import {
  getFilterForSubcategory,
  getCategoryBySlug,
  getDepartmentForCategory,
} from "./categories";
import { formatDateOnly } from "~/lib/dateUtils";
import { Search, Users, Phone, Mail, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { staffService, type Staff as SupabaseStaff } from "~/services/staffService";
import { toast } from "sonner";

interface ModalStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "vacation";
  salary: number;
  avatar?: string;
  specialties?: string[];
  schedule?: string;
}

const convertToModalStaff = (s: SupabaseStaff): ModalStaff => ({
  id: s.id,
  name: s.name,
  email: s.email || "",
  phone: s.phone || "",
  position: s.position,
  department: s.department || "",
  hireDate: s.hire_date || new Date().toISOString().split("T")[0],
  status: s.status === "Activo" ? "active" : s.status === "Inactivo" ? "inactive" : "vacation",
  salary: s.salary || 0,
  specialties: s.qualifications,
  schedule: "Horario por definir",
});

const convertToSupabaseStaff = (m: ModalStaff): SupabaseStaff => ({
  id: m.id,
  name: m.name,
  email: m.email,
  phone: m.phone,
  position: m.position,
  department: m.department,
  hire_date: m.hireDate,
  status: m.status === "active" ? "Activo" : m.status === "inactive" ? "Inactivo" : "Suspendido",
  salary: m.salary,
  qualifications: m.specialties,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function PersonalCategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams();
  const categoryDef = category ? getCategoryBySlug(category) : null;
  const department = category ? getDepartmentForCategory(category) : null;

  const [subcategorySlug, setSubcategorySlug] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [staff, setStaff] = useState<SupabaseStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Opciones del filtro: "Todas" + subcategorías
  const subcategoryOptions = categoryDef
    ? [{ slug: "", title: "Todas" }, ...categoryDef.subcategories]
    : [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadStaff = useCallback(async () => {
    if (!department || !category) return;
    const filter = subcategorySlug
      ? getFilterForSubcategory(category, subcategorySlug)
      : { department, position: undefined as string | undefined, positionPattern: undefined as string | undefined };
    if (subcategorySlug && !filter) return;
    try {
      setLoading(true);
      const result = await staffService.getStaff({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        status: filterStatus,
        department: filter.department,
        position: filter.position ?? undefined,
        positionPattern: filter.position ? undefined : (filter.positionPattern && filter.positionPattern !== "%" ? filter.positionPattern : undefined),
      });
      setStaff(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar la lista de personal");
    } finally {
      setLoading(false);
    }
  }, [
    category,
    department,
    subcategorySlug,
    pagination.page,
    pagination.limit,
    debouncedSearchTerm,
    filterStatus,
  ]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [subcategorySlug]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleStaffAdded = (modalStaff: ModalStaff) => {
    const s = convertToSupabaseStaff(modalStaff);
    setStaff((prev) => [s, ...prev]);
  };

  const handleStaffUpdated = (modalStaff: ModalStaff) => {
    const s = convertToSupabaseStaff(modalStaff);
    setStaff((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Activo":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "Inactivo":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case "Suspendido":
        return <Badge className="bg-yellow-100 text-yellow-800">Suspendido</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{status || "Activo"}</Badge>;
    }
  };

  const getDepartmentColor = (d: string) => {
    if (d === "Medicina") return "bg-blue-100 text-blue-800";
    if (d === "Enfermeria") return "bg-green-100 text-green-800";
    if (d === "Administracion") return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  if (!category || !categoryDef || !department) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/personal")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="text-gray-500">Categoría no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="text-sm text-gray-500 mb-1">
            <button type="button" onClick={() => navigate("/personal")} className="hover:text-primary-blue">
              Personal
            </button>
            <span className="mx-1">/</span>
            <span className="text-gray-900 font-medium">{categoryDef.title}</span>
          </nav>
          <h1 className="text-3xl font-bold text-primary-blue">{categoryDef.title}</h1>
          <p className="text-gray-600 mt-1">Listado de personal. Filtre por área si lo desea.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/personal")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <AddStaffModal onStaffAdded={handleStaffAdded} />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select
                  value={subcategorySlug}
                  onChange={(e) => setSubcategorySlug(e.target.value)}
                  className="border rounded-md px-3 py-2 min-w-[160px]"
                >
                  {subcategoryOptions.map((opt) => (
                    <option key={opt.slug || "todas"} value={opt.slug}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                  <option value="Suspendido">Suspendidos</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de personal ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha Contratación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue" />
                        <span className="ml-2">Cargando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay personal en esta área</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={undefined} alt={member.name} />
                            <AvatarFallback className="bg-primary-blue text-white">
                              {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">ID: {member.id.slice(-8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{member.position}</p>
                        {member.qualifications?.length ? (
                          <p className="text-sm text-gray-500">{member.qualifications.slice(0, 2).join(", ")}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentColor(member.department || "")}>
                          {member.department || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{member.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{member.phone || "—"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {member.hire_date
                            ? formatDateOnly(member.hire_date)
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex gap-2">
                          <ViewStaffModal staff={convertToModalStaff(member)} />
                          <EditStaffModal
                            staff={convertToModalStaff(member)}
                            onStaffUpdated={handleStaffUpdated}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-700">
            Mostrando {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
