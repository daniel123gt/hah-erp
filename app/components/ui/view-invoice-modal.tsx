import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { 
  Eye, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Send
} from "lucide-react";

interface Service {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "card" | "transfer" | "insurance";
  services: Service[];
  notes?: string;
}

interface ViewInvoiceModalProps {
  invoice: Invoice;
}

export function ViewInvoiceModal({ invoice }: ViewInvoiceModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="w-5 h-5 text-gray-600" />;
      case "sent":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case "card":
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "transfer":
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case "insurance":
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "card":
        return "Tarjeta";
      case "transfer":
        return "Transferencia";
      case "insurance":
        return "Seguro";
      default:
        return "No especificado";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = () => {
    return new Date(invoice.dueDate) < new Date() && invoice.status !== "paid" && invoice.status !== "cancelled";
  };

  const getRemainingAmount = () => {
    return invoice.totalAmount - invoice.paidAmount;
  };

  const getPaymentProgress = () => {
    if (invoice.totalAmount === 0) return 0;
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Factura {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la factura médica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-blue/10 rounded-full">
                    <FileText className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-blue">
                      {invoice.invoiceNumber}
                    </h3>
                    <p className="text-gray-600">ID: {invoice.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(invoice.status)}
                  {getStatusBadge(invoice.status)}
                  {isOverdue() && (
                    <Badge className="bg-red-100 text-red-800">Vencida</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary-blue" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {invoice.patientName}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{invoice.patientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{invoice.patientPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas de la Factura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Fechas de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Emisión</p>
                  <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className={`font-medium ${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Servicios y Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {service.quantity} | Precio unitario: S/ {service.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        S/ {service.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen Financiero */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary-blue" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Total de la Factura</p>
                    <p className="text-2xl font-bold text-green-600">
                      S/ {invoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Pagado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      S/ {invoice.paidAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Pendiente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      S/ {getRemainingAmount().toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Barra de Progreso de Pago */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso de Pago</span>
                    <span className="text-sm text-gray-500">{getPaymentProgress().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        getPaymentProgress() === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getPaymentProgress()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Información de Pago */}
                {invoice.paymentMethod && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(invoice.paymentMethod)}
                      <span className="font-medium">Método de Pago: {getPaymentMethodText(invoice.paymentMethod)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary-blue" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{invoice.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary-blue" />
                Historial de Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Factura creada</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(invoice.issueDate)} - Sistema
                    </p>
                  </div>
                </div>
                {invoice.status === "sent" && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Factura enviada al paciente</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.issueDate)} - Sistema
                      </p>
                    </div>
                  </div>
                )}
                {invoice.status === "paid" && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Factura pagada</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.issueDate)} - {getPaymentMethodText(invoice.paymentMethod)}
                      </p>
                    </div>
                  </div>
                )}
                {isOverdue() && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Factura vencida</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.dueDate)} - Sistema
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Acciones Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
                {invoice.status === "draft" && (
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Marcar como Enviada
                  </Button>
                )}
                {invoice.status === "sent" && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Pagada
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
