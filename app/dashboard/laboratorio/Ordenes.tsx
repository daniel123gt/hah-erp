import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Search, Eye, Calendar, FileText, Loader2, Filter } from "lucide-react";
import labOrderService, { type LabExamOrder } from "~/services/labOrderService";
import patientsService, { type Patient } from "~/services/patientsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function OrdenesLaboratorio() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LabExamOrder[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await labOrderService.getAllOrders({
        page: currentPage,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      setOrders(result.data);
      setTotalOrders(result.total);

      // Obtener información de pacientes únicos
      const uniquePatientIds = [...new Set(result.data.map(o => o.patient_id))];
      const patientsData = await Promise.all(
        uniquePatientIds.map(async (id) => {
          try {
            const patient = await patientsService.getPatientById(id);
            return patient ? { id, patient } : null;
          } catch {
            return null;
          }
        })
      );

      const patientsMap: Record<string, Patient> = {};
      patientsData.forEach(item => {
        if (item) patientsMap[item.id] = item.patient;
      });

      setPatients(patientsMap);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completado":
        return "default";
      case "En Proceso":
        return "secondary";
      case "En toma de muestra":
        return "secondary";
      case "Cancelado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "destructive";
      case "normal":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const patient = patients[order.patient_id];
    const search = searchTerm.toLowerCase();
    return (
      patient?.name.toLowerCase().includes(search) ||
      order.id.toLowerCase().includes(search) ||
      order.physician_name?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(totalOrders / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/laboratorio")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Exámenes</h1>
        </div>
        <Button onClick={() => navigate("/laboratorio/seleccionar")}>
          <FileText className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por paciente, ID de orden o médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En toma de muestra">En toma de muestra</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Órdenes</CardTitle>
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalOrders)} de {totalOrders} órdenes
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Cargando órdenes...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron órdenes</p>
              <Button className="mt-4" onClick={() => navigate("/laboratorio/seleccionar")}>
                Crear Primera Orden
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Exámenes</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const patient = patients[order.patient_id];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {patient?.name || 'Paciente no encontrado'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.items.length} exámenes</Badge>
                          </TableCell>
                          <TableCell>
                            {order.physician_name || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(order.priority)}>
                              {order.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            S/ {order.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/laboratorio/ordenes/${order.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

