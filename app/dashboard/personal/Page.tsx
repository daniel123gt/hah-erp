import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
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
  Search, 
  Plus, 
  Filter, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  FileText,
  Stethoscope,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { staffService, type Staff as SupabaseStaff } from "~/services/staffService";
import { toast } from "sonner";

// Interfaz para la UI (compatible con modales existentes)
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

// Función para convertir de Supabase a Modal
const convertToModalStaff = (supabaseStaff: SupabaseStaff): ModalStaff => ({
  id: supabaseStaff.id,
  name: supabaseStaff.name,
  email: supabaseStaff.email || '',
  phone: supabaseStaff.phone || '',
  position: supabaseStaff.position,
  department: supabaseStaff.department || '',
  hireDate: supabaseStaff.hire_date || new Date().toISOString().split('T')[0],
  status: supabaseStaff.status === 'Activo' ? 'active' : supabaseStaff.status === 'Inactivo' ? 'inactive' : 'vacation',
  salary: supabaseStaff.salary || 0,
  specialties: supabaseStaff.qualifications,
  schedule: 'Horario por definir'
});

// Función para convertir de Modal a Supabase
const convertToSupabaseStaff = (modalStaff: ModalStaff): SupabaseStaff => ({
  id: modalStaff.id,
  name: modalStaff.name,
  email: modalStaff.email,
  phone: modalStaff.phone,
  position: modalStaff.position,
  department: modalStaff.department,
  hire_date: modalStaff.hireDate,
  status: modalStaff.status === 'active' ? 'Activo' : modalStaff.status === 'inactive' ? 'Inactivo' : 'Suspendido',
  salary: modalStaff.salary,
  qualifications: modalStaff.specialties,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export default function PersonalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [staff, setStaff] = useState<SupabaseStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    active: 0,
    thisMonth: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar datos de personal al montar el componente
  useEffect(() => {
    loadStaff();
    loadStats();
  }, []);

  // Recargar personal cuando cambien los filtros o paginación
  useEffect(() => {
    loadStaff();
  }, [pagination.page, debouncedSearchTerm, filterStatus, filterDepartment, filterGender, filterPosition]);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const result = await staffService.getStaff({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        status: filterStatus,
        department: filterDepartment,
        gender: filterGender,
        position: filterPosition
      });
      
      setStaff(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }));
    } catch (error) {
      console.error('Error al cargar personal:', error);
      toast.error('Error al cargar la lista de personal');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, filterStatus, filterDepartment, filterGender, filterPosition]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await staffService.getStaffStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterDepartment("all");
    setFilterGender("all");
    setFilterPosition("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStaffAdded = async (modalStaff: ModalStaff) => {
    try {
      // El personal ya fue creado en el modal, solo actualizamos la UI
      const supabaseStaff = convertToSupabaseStaff(modalStaff);
      
      setStaff(prev => [supabaseStaff, ...prev]);
      await loadStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error al actualizar lista de personal:', error);
      toast.error('Error al actualizar la lista de personal');
    }
  };

  const handleStaffUpdated = async (modalStaff: ModalStaff) => {
    try {
      // El personal ya fue actualizado en el modal, solo actualizamos la UI
      const supabaseStaff = convertToSupabaseStaff(modalStaff);
      
      setStaff(prev => 
        prev.map(staffMember => 
          staffMember.id === supabaseStaff.id ? supabaseStaff : staffMember
        )
      );
    } catch (error) {
      console.error('Error al actualizar lista de personal:', error);
      toast.error('Error al actualizar la lista de personal');
    }
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
        return <Badge className="bg-blue-100 text-blue-800">{status || 'Activo'}</Badge>;
    }
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'M':
        return 'Masculino';
      case 'F':
        return 'Femenino';
      default:
        return gender || 'No especificado';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Medicina General":
        return "bg-blue-100 text-blue-800";
      case "Enfermería":
        return "bg-green-100 text-green-800";
      case "Laboratorio":
        return "bg-purple-100 text-purple-800";
      case "Administración":
        return "bg-orange-100 text-orange-800";
      case "Cardiología":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Personal</h1>
          <p className="text-gray-600 mt-2">Administra el personal médico y administrativo</p>
        </div>
        <AddStaffModal onStaffAdded={handleStaffAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Personal</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Personal Activo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Médicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter(s => s.position.includes("Dr.") || s.position.includes("Dra.") || s.position.includes("Médico")).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contratados Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Fila principal de filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar personal por nombre, email o posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar Filtros
              </Button>
            </div>

            {/* Filtros avanzados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los departamentos</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Enfermería">Enfermería</option>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Administración">Administración</option>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Pediatría">Pediatría</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Radiología">Radiología</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                  <option value="Suspendido">Suspendidos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los géneros</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elementos por página
                </label>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personal</CardTitle>
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
                <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                      <span className="ml-2">Cargando personal...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No se encontró personal</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((staffMember) => (
                  <TableRow key={staffMember.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={undefined} alt={staffMember.name} />
                          <AvatarFallback className="bg-primary-blue text-white">
                            {staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staffMember.name}</p>
                          <p className="text-sm text-gray-500">ID: {staffMember.id.slice(-8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{staffMember.position}</p>
                        {staffMember.qualifications && staffMember.qualifications.length > 0 && (
                          <p className="text-sm text-gray-500">{staffMember.qualifications.slice(0, 2).join(', ')}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDepartmentColor(staffMember.department || '')}>
                        {staffMember.department || 'Sin departamento'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{staffMember.email || 'Sin email'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{staffMember.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{staffMember.hire_date ? new Date(staffMember.hire_date).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(staffMember.status)}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex space-x-2">
                        <ViewStaffModal staff={convertToModalStaff(staffMember)} />
                        <EditStaffModal 
                          staff={convertToModalStaff(staffMember)} 
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

      {/* Paginación */}
      {!loading && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} empleados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              {/* Números de página */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, pagination.page - 2);
                const pageNum = startPage + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={pageNum === pagination.page ? "bg-primary-blue text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
