import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { getExamStats } from "~/services/labService";
import labOrderService, { type LabExamOrder } from "~/services/labOrderService";
import { toast } from "sonner";
import {
  FileText,
  Calculator,
  Users,
  Plus,
  Search,
  BarChart3,
  Calendar,
  Settings,
  X,
  Loader2
} from "lucide-react";

export default function LaboratorioDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<LabExamOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await getExamStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas del laboratorio');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const result = await labOrderService.getAllOrders({
        page: 1,
        limit: 5,
      });
      setRecentOrders(result.data);
    } catch (error) {
      console.error('Error al cargar órdenes recientes:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  const dashboardCards = [
    {
      title: "Nueva Orden de Exámenes",
      description: "Crear una nueva orden de exámenes para un paciente",
      icon: <Plus className="w-8 h-8 text-blue-500" />,
      action: () => navigate('/laboratorio/seleccionar'),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    {
      title: "Buscar Exámenes",
      description: "Buscar y consultar exámenes disponibles",
      icon: <Search className="w-8 h-8 text-green-500" />,
      action: () => navigate('/laboratorio/buscar'),
      color: "bg-green-50 border-green-200 hover:bg-green-100"
    },
    {
      title: "Órdenes Pendientes",
      description: "Ver órdenes de exámenes pendientes",
      icon: <Calendar className="w-8 h-8 text-orange-500" />,
      action: () => navigate('/laboratorio/ordenes'),
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100"
    },
    {
      title: "Reportes",
      description: "Generar reportes del laboratorio",
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      action: () => navigate('/laboratorio/reportes'),
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧪 Dashboard de Laboratorio</h1>
          <p className="text-gray-600 mt-1">
            Gestión completa del laboratorio y exámenes médicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <X className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exámenes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
            </div>
            <Calculator className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Acciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Card 
            key={index} 
            className={`p-6 cursor-pointer transition-colors ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {card.icon}
              <div>
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actividad Reciente */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Actividad Reciente
          </h2>
          {recentOrders.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate('/laboratorio/ordenes')}>
              Ver Todas
            </Button>
          )}
        </div>
        {loadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-blue" />
            <span className="ml-2 text-gray-600">Cargando...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay actividad reciente</p>
            <p className="text-sm">Las órdenes de exámenes aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/laboratorio/ordenes`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      Orden #{order.id.slice(0, 8)}
                    </span>
                    <Badge variant={order.status === 'Pendiente' ? 'outline' : order.status === 'Completado' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.order_date).toLocaleDateString('es-ES')} • {order.items.length} exámenes • S/ {order.total_amount.toFixed(2)}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
