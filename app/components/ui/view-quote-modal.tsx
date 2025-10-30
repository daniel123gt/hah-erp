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
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from "lucide-react";

interface Quote {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  createdAt: string;
  validUntil: string;
  notes?: string;
}

interface ViewQuoteModalProps {
  quote: Quote;
}

export function ViewQuoteModal({ quote }: ViewQuoteModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Aceptada</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expirada</Badge>;
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
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
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

  const isExpired = () => {
    return new Date(quote.validUntil) < new Date();
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
            Cotización #{quote.id}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la cotización médica
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
                      Cotización #{quote.id}
                    </h3>
                    <p className="text-gray-600">
                      Creada el {formatDate(quote.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(quote.status)}
                  {getStatusBadge(quote.status)}
                  {isExpired() && (
                    <Badge className="bg-red-100 text-red-800">Expirada</Badge>
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
                    {quote.patientName}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{quote.patientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{quote.patientPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                Doctor Responsable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {quote.doctorName}
                  </h4>
                  <p className="text-gray-600">Médico Responsable</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios Cotizados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Servicios Cotizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quote.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {service.quantity} | Precio unitario: S/ {service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-primary-blue">
                        S/ {(service.price * service.quantity).toFixed(2)}
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
                <div className="flex justify-between items-center text-lg">
                  <span>Subtotal:</span>
                  <span>S/ {quote.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>IGV (18%):</span>
                  <span>S/ {(quote.totalAmount * 0.18).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-primary-blue">
                      S/ {(quote.totalAmount * 1.18).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-medium">{formatDate(quote.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Válida hasta</p>
                  <p className={`font-medium ${isExpired() ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(quote.validUntil)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-primary-blue" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{quote.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                Historial de Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Cotización creada</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(quote.createdAt)} - Sistema
                    </p>
                  </div>
                </div>
                {quote.status === "sent" && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cotización enviada al paciente</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.createdAt)} - Sistema
                      </p>
                    </div>
                  </div>
                )}
                {quote.status === "accepted" && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cotización aceptada por el paciente</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.createdAt)} - Paciente
                      </p>
                    </div>
                  </div>
                )}
                {quote.status === "rejected" && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cotización rechazada por el paciente</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.createdAt)} - Paciente
                      </p>
                    </div>
                  </div>
                )}
                {isExpired() && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Cotización expirada</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.validUntil)} - Sistema
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
