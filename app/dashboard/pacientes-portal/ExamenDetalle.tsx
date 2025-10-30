import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { patientLabService } from "~/services/patientLabService";
import { type LabExamOrder } from "~/services/labOrderService";
import { storageService } from "~/services/storageService";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Download,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

export default function ExamenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<LabExamOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      if (!id) return;

      const orderData = await patientLabService.getMyOrderById(id);
      if (!orderData) {
        toast.error('Orden no encontrada');
        navigate('/pacientes/laboratorio/mis-examenes');
        return;
      }

      setOrder(orderData);

      // Generar URL firmada para el PDF si existe
      if (orderData.result_pdf_url) {
        try {
          const url = await storageService.getDownloadUrl('lab-results', orderData.result_pdf_url);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error al generar URL del PDF:', error);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar orden:', error);
      toast.error(error.message || 'Error al cargar la orden');
      navigate('/pacientes/laboratorio/mis-examenes');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pendiente': { 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Pendiente'
      },
      'En Proceso': { 
        icon: AlertCircle, 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'En Proceso'
      },
      'Completado': { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Completado'
      },
      'Cancelado': { 
        icon: XCircle, 
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Cancelado'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendiente'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const handleDownloadPDF = async () => {
    if (order?.result_pdf_url && pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('PDF no disponible');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#73CBCF]" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/pacientes/laboratorio/mis-examenes')}
            className="mb-4 border-[#73CBCF] text-[#1F3666] hover:bg-[#F2FEFF]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-[#1F3666]">
            Detalle de Orden #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-gray-600 mt-2">
            Información completa de tu orden de exámenes
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Orden */}
          <Card className="border-l-4 border-l-[#73CBCF]">
            <CardHeader>
              <CardTitle className="text-[#1F3666] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Orden</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-[#73CBCF]" />
                    <p className="font-medium text-[#1F3666]">
                      {new Date(order.order_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prioridad</p>
                  <Badge variant={order.priority === 'urgente' ? 'destructive' : 'secondary'} className="mt-1">
                    {order.priority === 'urgente' ? 'Urgente' : order.priority === 'normal' ? 'Normal' : 'Programada'}
                  </Badge>
                </div>
                {order.physician_name && (
                  <div>
                    <p className="text-sm text-gray-600">Médico Tratante</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stethoscope className="w-4 h-4 text-[#73CBCF]" />
                      <p className="font-medium text-[#1F3666]">{order.physician_name}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-[#1F3666] mt-1">
                    S/ {order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
              {order.observations && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Observaciones</p>
                  <p className="text-sm text-gray-700 bg-[#F2FEFF] p-3 rounded">
                    {order.observations}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exámenes Solicitados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1F3666]">
                Exámenes Solicitados ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#F2FEFF] rounded-lg border border-[#73CBCF]/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#1F3666]">{item.exam_name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.exam_code}
                        </Badge>
                        <span className="text-sm text-gray-600">S/ {item.price.toFixed(2)}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral - Resultados */}
        <div className="space-y-6">
          {/* Resultados */}
          {order.status === 'Completado' && (
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resultados Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.result_pdf_url && (
                  <>
                    {order.result_date && (
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Resultado</p>
                        <p className="font-medium text-[#1F3666]">
                          {new Date(order.result_date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {pdfUrl && (
                      <Button
                        onClick={handleDownloadPDF}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Ver/Descargar PDF
                      </Button>
                    )}
                  </>
                )}
                {order.result_notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notas del Resultado</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {order.result_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estado Pendiente */}
          {order.status !== 'Completado' && (
            <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Resultados Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Tus resultados estarán disponibles cuando se completen los exámenes.
                  Te notificaremos cuando estén listos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

