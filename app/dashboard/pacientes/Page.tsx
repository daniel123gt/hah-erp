import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
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
import { AddPatientModal } from "~/components/ui/add-patient-modal";
// Detalle se navega a nueva página: /pacientes/:id
import { EditPatientModal } from "~/components/ui/edit-patient-modal";
import { patientsService, type Patient } from "~/services/patientsService";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Filter, 
  User, 
  Phone, 
  Mail,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

// Interfaz para los modales (compatible con la UI existente)
interface ModalPatient {
  id: string;
  name: string;
  dni?: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  district?: string;
  lastVisit: string;
  status: "active" | "inactive" | "pending";
  bloodType?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  primaryPhysician?: string;
  currentMedications?: string[];
  primaryDiagnosis?: string;
}

// Función para convertir Patient (Supabase) a ModalPatient (UI)
const convertToModalPatient = (patient: Patient): ModalPatient => ({
  id: patient.id,
  name: patient.name,
  dni: patient.dni,
  email: patient.email || '',
  phone: patient.phone || '',
  age: patient.age || 0,
  gender: patient.gender === 'M' ? 'Masculino' : 'Femenino',
  address: patient.address || '',
  district: patient.district,
  lastVisit: patient.last_visit || new Date().toISOString().split('T')[0],
  status: patient.status === 'Activo' ? 'active' : patient.status === 'Inactivo' ? 'inactive' : 'pending',
  bloodType: patient.blood_type,
  allergies: patient.allergies,
  emergencyContactName: patient.emergency_contact_name,
  emergencyContactPhone: patient.emergency_contact_phone,
  primaryPhysician: patient.primary_physician,
  currentMedications: patient.current_medications,
  primaryDiagnosis: patient.primary_diagnosis
});

// Función para convertir ModalPatient (UI) a Patient (Supabase)
const convertToSupabasePatient = (modalPatient: ModalPatient): Patient => ({
  id: modalPatient.id,
  name: modalPatient.name,
  dni: modalPatient.dni,
  email: modalPatient.email,
  phone: modalPatient.phone,
  age: modalPatient.age,
  gender: modalPatient.gender === 'Masculino' ? 'M' : 'F',
  address: modalPatient.address,
  district: modalPatient.district,
  last_visit: modalPatient.lastVisit,
  status: modalPatient.status === 'active' ? 'Activo' : modalPatient.status === 'inactive' ? 'Inactivo' : 'Pendiente',
  blood_type: modalPatient.bloodType,
  allergies: modalPatient.allergies,
  emergency_contact_name: modalPatient.emergencyContactName,
  emergency_contact_phone: modalPatient.emergencyContactPhone,
  primary_physician: modalPatient.primaryPhysician,
  current_medications: modalPatient.currentMedications,
  primary_diagnosis: modalPatient.primaryDiagnosis,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export default function PacientesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterBloodType, setFilterBloodType] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [districts, setDistricts] = useState<Array<{name: string, zone: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    active: 0,
    thisMonth: 0
  });

  // Cargar datos de pacientes al montar el componente
  useEffect(() => {
    loadPatients();
    loadStats();
    loadDistricts();
  }, []);

  // Debounce para la búsqueda
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Recargar pacientes cuando cambien los filtros o paginación
  useEffect(() => {
    loadPatients();
  }, [pagination.page, debouncedSearchTerm, filterStatus, filterGender, filterBloodType, filterDistrict]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsService.getPatients({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        status: filterStatus,
        gender: filterGender,
        bloodType: filterBloodType,
        district: filterDistrict
      });
      
      setPatients(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage
      }));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast.error('Error al cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await patientsService.getPatientStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadDistricts = async () => {
    try {
      const districtsData = await patientsService.getDistricts();
      setDistricts(districtsData);
    } catch (error) {
      console.error('Error al cargar distritos:', error);
    }
  };

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Función para cambiar el límite de elementos por página
  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Función para resetear filtros
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterGender("all");
    setFilterBloodType("all");
    setFilterDistrict("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePatientAdded = async (modalPatient: ModalPatient) => {
    try {
      // El paciente ya fue creado en el modal, solo actualizamos la UI
      const supabasePatient = convertToSupabasePatient(modalPatient);
      
      setPatients(prev => [supabasePatient, ...prev]);
      await loadStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error al actualizar lista de pacientes:', error);
      toast.error('Error al actualizar la lista de pacientes');
    }
  };

  const handlePatientUpdated = async (modalPatient: ModalPatient) => {
    try {
      // El paciente ya fue actualizado en el modal, solo actualizamos la UI
      const supabasePatient = convertToSupabasePatient(modalPatient);
      
      setPatients(prev => 
        prev.map(patient => 
          patient.id === supabasePatient.id ? supabasePatient : patient
        )
      );
    } catch (error) {
      console.error('Error al actualizar lista de pacientes:', error);
      toast.error('Error al actualizar la lista de pacientes');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Activo":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "Inactivo":
        return <Badge className="bg-red-100 text-red-800">Inactivo</Badge>;
      case "Pendiente":
        return <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">{status || 'Pendiente'}</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Pacientes</h1>
          <p className="text-gray-600 mt-2">Administra la información de todos los pacientes</p>
        </div>
        <AddPatientModal onPatientAdded={handlePatientAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Visitas Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.last_visit && new Date(p.last_visit).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos Registros</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.created_at && new Date(p.created_at).getDate() >= new Date().getDate() - 7).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Primera fila: Búsqueda */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, nro. documento, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleResetFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>

            {/* Segunda fila: Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="Pendiente">Pendientes</option>
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
                  Tipo de Sangre
                </label>
                <select
                  value={filterBloodType}
                  onChange={(e) => setFilterBloodType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito
                </label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los distritos</option>
                  {districts.map((district) => (
                    <option key={district.name} value={district.name}>
                      {district.name} ({district.zone})
                    </option>
                  ))}
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Pacientes</CardTitle>
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} pacientes
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Cargando pacientes...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nro. documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[140px]">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No se encontraron pacientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="w-[100px]">{getStatusBadge(patient.status)}</TableCell>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{patient.dni || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{patient.email || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{patient.phone || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{patient.address || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('es-ES') : '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{new Date(patient.created_at).toLocaleDateString('es-ES')}</span>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/pacientes/${patient.id}`)}>
                              Ver
                            </Button>
                            <EditPatientModal 
                              patient={convertToModalPatient(patient)} 
                              onPatientUpdated={handlePatientUpdated} 
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Paginación */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
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
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={pagination.page === pageNum ? "bg-primary-blue text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
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
      </Card>
    </div>
  );
}
