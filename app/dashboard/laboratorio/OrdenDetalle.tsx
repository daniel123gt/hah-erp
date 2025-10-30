import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, User, Calendar } from "lucide-react";
import labOrderService, { type LabExamOrder } from "~/services/labOrderService";
import patientsService, { type Patient } from "~/services/patientsService";
import { UploadResultPdf } from "~/components/ui/upload-result-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function OrdenDetalle() {
  const { id } = useParams("/laboratorio/ordenes/:id");
  const navigate = useNavigate();
  const [order, setOrder] = useState<LabExamOrder | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await labOrderService.getOrderById(id!);
      setOrder(orderData);

      if (orderData.patient_id) {
        try {
          const patientData = await patientsService.getPatientById(orderData.patient_id);
          setPatient(patientData);
        } catch (error) {
          console.warn('Error al cargar paciente:', error);
        }
      }
    } catch (error: any) {
      console.error("Error al cargar orden:", error);
      toast.error(error?.message || "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: LabExamOrder['status']) => {
    if (!order) return;
    
    try {
      setUpdating(true);
      await labOrderService.updateOrderStatus(order.id, newStatus);
      toast.success("Estado actualizado exitosamente");
      loadOrder(); // Recargar la orden
    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      toast.error(error?.message || "Error al actualizar el estado");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completado":
        return "default";
      case "En Proceso":
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-gray-600">Cargando orden...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-700 mb-2">Orden no encontrada</p>
          <p className="text-sm text-gray-500 mb-4">
            La orden con ID {id} no existe.
          </p>
          <Button variant="outline" onClick={() => navigate("/laboratorio/ordenes")}>
            Volver a Órdenes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/laboratorio/ordenes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orden de Exámenes #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Creada el {new Date(order.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">
            {order.status}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(order.priority)} className="text-sm px-3 py-1">
            {order.priority}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información General y Paciente */}
        <div className="lg:col-span-1 space-y-6">
          {/* Información de la Orden */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Fecha de Orden:</span>
                <p className="font-medium">{new Date(order.order_date).toLocaleDateString('es-ES')}</p>
              </div>
              {order.physician_name && (
                <div>
                  <span className="text-sm text-gray-500">Médico Solicitante:</span>
                  <p className="font-medium">{order.physician_name}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Prioridad:</span>
                <div className="mt-1">
                  <Badge variant={getPriorityBadgeVariant(order.priority)}>
                    {order.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Estado:</span>
                <div className="mt-2">
                  <Select
                    value={order.status}
                    onValueChange={(value: LabExamOrder['status']) => handleStatusUpdate(value)}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {order.observations && (
                <div>
                  <span className="text-sm text-gray-500">Observaciones:</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {order.observations}
                  </p>
                </div>
              )}
              {/* Resultado PDF */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Resultado PDF:</span>
                  <UploadResultPdf
                    orderId={order.id}
                    orderNumber={order.id.slice(0, 8)}
                    currentPdfUrl={order.result_pdf_url}
                    currentResultDate={order.result_date}
                    currentResultNotes={order.result_notes}
                    onResultUpdated={loadOrder}
                  />
                </div>
                {order.result_pdf_url && (
                  <div className="text-xs text-gray-500 mt-2">
                    {order.result_date && (
                      <p>Fecha del resultado: {new Date(order.result_date).toLocaleDateString('es-ES')}</p>
                    )}
                    {order.result_notes && (
                      <p className="mt-1">Notas: {order.result_notes}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    S/ {order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Paciente */}
          {patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Nombre:</span>
                  <p className="font-medium">{patient.name}</p>
                </div>
                {patient.email && (
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="text-sm">{patient.email}</p>
                  </div>
                )}
                {patient.phone && (
                  <div>
                    <span className="text-sm text-gray-500">Teléfono:</span>
                    <p className="text-sm">{patient.phone}</p>
                  </div>
                )}
                {patient.address && (
                  <div>
                    <span className="text-sm text-gray-500">Dirección:</span>
                    <p className="text-sm">{patient.address}</p>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/pacientes/${patient.id}`)}
                  >
                    Ver Perfil Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Exámenes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Exámenes de la Orden ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Examen</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.exam_id}>
                        <TableCell className="font-mono text-sm">
                          {item.exam_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.exam_name}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">S/ {item.price.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Resumen */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-end">
                  <div className="space-y-2 w-full max-w-md">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({order.items.length} exámenes):</span>
                      <span className="font-medium">
                        S/ {order.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">S/ {order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
