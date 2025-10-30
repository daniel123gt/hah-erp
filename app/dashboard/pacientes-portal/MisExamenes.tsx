import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { patientLabService } from "~/services/patientLabService";
import { type LabExamOrder } from "~/services/labOrderService";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  Loader2,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { storageService } from "~/services/storageService";

export default function MisExamenes() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LabExamOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const myOrders = await patientLabService.getMyOrders();
      setOrders(myOrders);
    } catch (error: any) {
      console.error('Error al cargar órdenes:', error);
      toast.error(error.message || 'Error al cargar tus exámenes');
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

  const handleViewOrder = (orderId: string) => {
    navigate(`/pacientes/laboratorio/examen/${orderId}`);
  };

  const handleViewPDF = async (pdfUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const url = await storageService.getDownloadUrl('lab-results', pdfUrl);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Error al abrir el PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F3666]">Mis Exámenes de Laboratorio</h1>
        <p className="text-gray-600 mt-2">
          Consulta el estado y resultados de tus exámenes
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F2FEFF] to-white border-[#73CBCF]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Órdenes</p>
                <p className="text-2xl font-bold text-[#1F3666]">{orders.length}</p>
              </div>
              <FileText className="w-8 h-8 text-[#73CBCF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'Completado').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'En Proceso').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'Pendiente').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de órdenes */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#73CBCF] mx-auto mb-4" />
            <p className="text-gray-600">Cargando tus exámenes...</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">No tienes exámenes registrados</p>
            <p className="text-sm text-gray-500">
              Cuando se genere una orden de exámenes, aparecerá aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-[#73CBCF]"
              onClick={() => handleViewOrder(order.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg text-[#1F3666]">
                        Orden #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.order_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div>
                        <span className="font-medium">{order.items.length}</span> examen{order.items.length !== 1 ? 'es' : ''}
                      </div>
                      <div className="text-[#1F3666] font-semibold">
                        S/ {order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order.id)}
                      className="border-[#73CBCF] text-[#1F3666] hover:bg-[#F2FEFF]"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalle
                    </Button>
                    {order.status === 'Completado' && order.result_pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleViewPDF(order.result_pdf_url!, e)}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Ver PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-[#F2FEFF] rounded">
                      <span className="text-gray-700">{item.exam_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.exam_code}
                      </Badge>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{order.items.length - 3} examen{order.items.length - 3 !== 1 ? 'es' : ''} más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

