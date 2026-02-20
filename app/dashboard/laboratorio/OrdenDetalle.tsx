import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, User, Calendar, Edit, Plus, X, Search, Trash2, KeyRound, Copy } from "lucide-react";
import { formatDateOnly } from "~/lib/utils";
import labOrderService, {
  type LabExamOrder,
  type LabOrderPaymentMethod,
  type LabOrderPaymentStatus,
} from "~/services/labOrderService";
import patientsService, { type Patient } from "~/services/patientsService";
import {
  getPortalCredentialsByOrder,
  ensurePatientPortalUser,
  generatePortalPassword,
} from "~/services/patientPortalService";
import { UploadResultPdf } from "~/components/ui/upload-result-pdf";
import { AddDocumentCreatePortalUserModal } from "~/components/ui/add-document-create-portal-user-modal";
import { getExams } from "~/services/labService";
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
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingExams, setIsAddingExams] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{ dni: string; password: string } | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [addDocumentPortalOpen, setAddDocumentPortalOpen] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

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
      loadOrder();
    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      toast.error(error?.message || "Error al actualizar el estado");
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentUpdate = async (data: {
    payment_method?: LabOrderPaymentMethod | null;
    payment_status?: LabOrderPaymentStatus | null;
  }) => {
    if (!order) return;
    try {
      setUpdatingPayment(true);
      await labOrderService.updateOrderPayment(order.id, data);
      toast.success("Pago actualizado");
      loadOrder();
    } catch (error: any) {
      console.error("Error al actualizar pago:", error);
      toast.error(error?.message || "Error al actualizar el pago");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleSearchExams = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const result = await getExams({
        page: 1,
        limit: 20,
        search: searchQuery.trim(),
        categoria: ''
      });
      
      // Filtrar exámenes que ya están en la orden
      const existingExamIds = order?.items.map(item => item.exam_id) || [];
      const filtered = result.data.filter(exam => !existingExamIds.includes(exam.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error al buscar exámenes:", error);
      toast.error("Error al buscar exámenes");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddExams = async () => {
    if (!order || selectedExams.length === 0) return;
    
    try {
      setIsAdding(true);
      const updatedOrder = await labOrderService.addExamsToOrder(order.id, selectedExams);
      setOrder(updatedOrder);
      toast.success(`${selectedExams.length} examen(es) agregado(s) exitosamente`);
      setSelectedExams([]);
      setSearchQuery("");
      setSearchResults([]);
      setIsAddingExams(false);
    } catch (error: any) {
      console.error("Error al agregar exámenes:", error);
      toast.error(error?.message || "Error al agregar exámenes");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveExam = async (itemId: string) => {
    if (!order) return;
    
    try {
      setIsRemoving(itemId);
      const updatedOrder = await labOrderService.removeExamFromOrder(order.id, itemId);
      setOrder(updatedOrder);
      toast.success("Examen eliminado exitosamente");
    } catch (error: any) {
      console.error("Error al eliminar examen:", error);
      toast.error(error?.message || "Error al eliminar examen");
    } finally {
      setIsRemoving(null);
    }
  };

  useEffect(() => {
    if (!isAddingExams) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedExams([]);
    }
  }, [isAddingExams]);

  useEffect(() => {
    if (searchQuery.trim() && isAddingExams) {
      const timeout = setTimeout(() => {
        handleSearchExams();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, isAddingExams, order]);

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Completado":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "En Proceso":
      case "En toma de muestra":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Cancelado":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
          <Badge variant="secondary" className={`text-sm px-3 py-1 ${getStatusBadgeClassName(order.status)}`}>
            {order.status}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(order.priority)} className="text-sm px-3 py-1">
            {order.priority}
          </Badge>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Cancelar Edición" : "Editar Orden"}
          </Button>
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
                <p className="font-medium">{formatDateOnly(order.order_date)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fecha de toma de muestra (programación):</span>
                <p className="font-medium">{formatDateOnly(order.sample_date ?? order.order_date)}</p>
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
              <div className="pt-2 border-t space-y-3">
                <span className="text-sm font-medium text-gray-700">Pago</span>
                <div>
                  <Label className="text-sm text-gray-500">Método de pago</Label>
                  <Select
                    value={order.payment_method ?? "__none__"}
                    onValueChange={(value) =>
                      handlePaymentUpdate({
                        payment_method:
                          value === "__none__" ? null : (value as LabOrderPaymentMethod),
                      })
                    }
                    disabled={updatingPayment}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin definir</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                      <SelectItem value="transfer_deposito">Transferencia / Depósito</SelectItem>
                      <SelectItem value="tarjeta_link_pos">Tarjeta / Link / POS</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Estado de pago</Label>
                  <Select
                    value={order.payment_status ?? "Pendiente de pago"}
                    onValueChange={(value: LabOrderPaymentStatus) =>
                      handlePaymentUpdate({ payment_status: value })
                    }
                    disabled={updatingPayment}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente de pago">Pendiente de pago</SelectItem>
                      <SelectItem value="Pagado">Pagado</SelectItem>
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
                {patient.district && (
                  <div>
                    <span className="text-sm text-gray-500">Distrito:</span>
                    <p className="text-sm">{patient.district}</p>
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

          {/* Credenciales de portal del paciente */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Credenciales de portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Para que el paciente vea sus resultados con Nro. documento y contraseña. Si perdió la contraseña, puede generar una nueva.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={credentialsLoading}
                  onClick={async () => {
                    setCredentialsLoading(true);
                    try {
                      const result = await getPortalCredentialsByOrder(order.id);
                      if ("error" in result) {
                        const noAccount =
                          result.error.includes("404") ||
                          result.error.includes("no tiene cuenta") ||
                          result.error.includes("no existe") ||
                          result.error.includes("not found");
                        if (noAccount && order.patient_id && patient) {
                          if (patient.dni?.trim()) {
                            const password = generatePortalPassword();
                            const ensureResult = await ensurePatientPortalUser({
                              patient_id: order.patient_id,
                              dni: patient.dni.trim(),
                              full_name: patient.name || "",
                              email: patient.email?.trim(),
                              phone: patient.phone?.trim(),
                              password,
                            });
                            if (ensureResult.ok) {
                              setCredentialsModal({ dni: patient.dni.trim(), password });
                              toast.success("Se creó la cuenta del portal. Entregue estas credenciales al paciente.");
                            } else {
                              setAddDocumentPortalOpen(true);
                            }
                          } else {
                            setAddDocumentPortalOpen(true);
                          }
                          return;
                        }
                        toast.error(result.error);
                        return;
                      }
                      setCredentialsModal({ dni: result.dni, password: result.password });
                      toast.success("Se generó una nueva contraseña. Entréguela al paciente.");
                    } finally {
                      setCredentialsLoading(false);
                    }
                  }}
                >
                  {credentialsLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Ver credenciales
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Exámenes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Exámenes de la Orden ({order.items.length})
                </CardTitle>
                {isEditing && (
                  <Dialog open={isAddingExams} onOpenChange={setIsAddingExams}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Exámenes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Buscar y Agregar Exámenes</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Buscar por nombre o código..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        {isSearching && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {searchResults.map((exam) => (
                              <div
                                key={exam.id}
                                className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                                  selectedExams.includes(exam.id) ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                  setSelectedExams(prev =>
                                    prev.includes(exam.id)
                                      ? prev.filter(id => id !== exam.id)
                                      : [...prev, exam.id]
                                  );
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{exam.nombre}</p>
                                    <p className="text-sm text-gray-500">Código: {exam.codigo}</p>
                                    <p className="text-sm font-semibold text-green-600">{exam.precio}</p>
                                  </div>
                                  {selectedExams.includes(exam.id) && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <X className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchQuery && !isSearching && searchResults.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No se encontraron exámenes
                          </div>
                        )}
                        {selectedExams.length > 0 && (
                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-sm text-gray-600">
                              {selectedExams.length} examen(es) seleccionado(s)
                            </span>
                            <Button
                              onClick={handleAddExams}
                              disabled={isAdding}
                            >
                              {isAdding ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Agregando...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Agregar
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
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
                      {isEditing && <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
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
                          <Badge variant="secondary" className={getStatusBadgeClassName(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        {isEditing && (
                          <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExam(item.id)}
                              disabled={isRemoving === item.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isRemoving === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        )}
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

      {/* Modal agregar documento y crear usuario de portal */}
      <AddDocumentCreatePortalUserModal
        open={addDocumentPortalOpen}
        onOpenChange={setAddDocumentPortalOpen}
        patient={patient}
        onSuccess={(dni, password) => {
          setPatient((prev) => (prev ? { ...prev, dni } : null));
          setCredentialsModal({ dni, password });
        }}
      />

      {/* Modal Ver credenciales de portal */}
      <Dialog open={!!credentialsModal} onOpenChange={(open) => !open && setCredentialsModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <KeyRound className="w-5 h-5" />
              Credenciales de portal
            </DialogTitle>
          </DialogHeader>
          {credentialsModal && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Se generó una nueva contraseña. Entregue estos datos al paciente (login con Nro. documento y contraseña):
              </p>
              <div className="grid gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-500 text-xs">Usuario (Nro. documento)</Label>
                  <p className="font-mono text-lg font-semibold mt-1 select-all">{credentialsModal.dni}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Contraseña</Label>
                  <p className="font-mono text-lg font-semibold mt-1 select-all">{credentialsModal.password}</p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full bg-primary-blue hover:bg-primary-blue/90"
                onClick={() => {
                  const text = `Nro. documento: ${credentialsModal.dni}\nContraseña: ${credentialsModal.password}`;
                  navigator.clipboard.writeText(text).then(
                    () => toast.success("Copiado al portapapeles"),
                    () => toast.error("No se pudo copiar")
                  );
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar usuario y contraseña
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setCredentialsModal(null)}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
