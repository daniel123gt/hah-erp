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
import { AddContractModal } from "~/components/ui/add-contract-modal";
import { EditContractModal } from "~/components/ui/edit-contract-modal";
import { contractsService, type PatientContract } from "~/services/contractsService";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Eye
} from "lucide-react";

export default function ContratosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [contracts, setContracts] = useState<PatientContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    finished: 0,
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar datos de contratos al montar el componente
  useEffect(() => {
    loadContracts();
    loadStats();
  }, []);

  // Recargar contratos cuando cambien los filtros o paginación
  useEffect(() => {
    loadContracts();
  }, [pagination.page, debouncedSearchTerm, filterStatus, filterServiceType]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await contractsService.getContracts({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        status: filterStatus === "all" ? undefined : filterStatus,
        serviceType: filterServiceType === "all" ? undefined : filterServiceType,
      });
      
      setContracts(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage
      }));
    } catch (error) {
      toast.error("Error al cargar contratos.");
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await contractsService.getContractStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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
    setFilterServiceType("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleContractAdded = (newContract: PatientContract) => {
    setContracts(prev => [newContract, ...prev]);
    loadStats();
  };

  const handleContractUpdated = (updatedContract: PatientContract) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === updatedContract.id ? updatedContract : c
      )
    );
    loadStats();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Activo":
        return <Badge variant="success">Activo</Badge>;
      case "Inactivo":
        return <Badge variant="destructive">Inactivo</Badge>;
      case "Suspendido":
        return <Badge variant="warning">Suspendido</Badge>;
      case "Finalizado":
        return <Badge variant="secondary">Finalizado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceTypeBadge = (serviceType: string) => {
    switch (serviceType) {
      case "24 HORAS":
        return <Badge variant="default">24 HORAS</Badge>;
      case "8 HORAS":
        return <Badge variant="outline">8 HORAS</Badge>;
      case "12 HORAS":
        return <Badge variant="outline">12 HORAS</Badge>;
      default:
        return <Badge variant="outline">{serviceType}</Badge>;
    }
  };

  const totalPagesArray = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gestión de Contratos</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">Total de contratos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500">Contratos en curso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-gray-500">Contratos inactivos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.suspended}</div>
            <p className="text-xs text-gray-500">Contratos suspendidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.finished}</div>
            <p className="text-xs text-gray-500">Contratos finalizados</p>
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
                  placeholder="Buscar por número de contrato, paciente o familiar responsable..."
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
              <AddContractModal onContractAdded={handleContractAdded} />
            </div>

            {/* Filtros avanzados */}
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
                  <option value="Suspendido">Suspendidos</option>
                  <option value="Finalizado">Finalizados</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Servicio
                </label>
                <select
                  value={filterServiceType}
                  onChange={(e) => setFilterServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="24 HORAS">24 HORAS</option>
                  <option value="8 HORAS">8 HORAS</option>
                  <option value="12 HORAS">12 HORAS</option>
                  <option value="PROCEDIMIENTO">PROCEDIMIENTO</option>
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

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Contrato</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Familiar Responsable</TableHead>
                  <TableHead>Tipo de Servicio</TableHead>
                  <TableHead>Monto Mensual</TableHead>
                  <TableHead>Fecha de Inicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-blue mx-auto" />
                      <p className="text-gray-500 mt-2">Cargando contratos...</p>
                    </TableCell>
                  </TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron contratos.
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-medium">{contract.contract_number}</p>
                          <p className="text-sm text-gray-500">{contract.patient?.district}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.patient?.name}</p>
                          <p className="text-sm text-gray-500">{contract.patient?.emergency_contact_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{contract.responsible_family_member}</TableCell>
                      <TableCell>{getServiceTypeBadge(contract.service_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">S/. {contract.monthly_amount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(contract.start_date).toLocaleDateString('es-ES')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar vista de detalles
                              toast.info("Vista de detalles próximamente");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <EditContractModal
                            contract={contract}
                            onContractUpdated={handleContractUpdated}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableCaption>
                {pagination.total > 0
                  ? `Mostrando ${
                      (pagination.page - 1) * pagination.limit + 1
                    }-${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )} de ${pagination.total} contratos.`
                  : "No hay contratos para mostrar."}
              </TableCaption>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {totalPagesArray.map((page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
