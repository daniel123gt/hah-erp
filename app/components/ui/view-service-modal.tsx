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
  Stethoscope, 
  DollarSign, 
  Clock, 
  Package, 
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  status: "active" | "inactive" | "maintenance";
  popularity: number;
  doctorRequired: boolean;
  equipment?: string[];
}

interface ViewServiceModalProps {
  service: Service;
}

export function ViewServiceModal({ service }: ViewServiceModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Consultas":
        return "bg-blue-100 text-blue-800";
      case "Laboratorio":
        return "bg-purple-100 text-purple-800";
      case "Cardiología":
        return "bg-red-100 text-red-800";
      case "Imagenología":
        return "bg-green-100 text-green-800";
      case "Vacunación":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPopularityStars = (popularity: number) => {
    const stars = [];
    const filledStars = Math.floor(popularity / 20);
    const hasHalfStar = popularity % 20 >= 10;
    
    for (let i = 0; i < 5; i++) {
      if (i < filledStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === filledStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "inactive":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case "maintenance":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
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
            Detalles del Servicio
          </DialogTitle>
          <DialogDescription>
            Información completa del servicio médico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-blue/10 rounded-full">
                    <Stethoscope className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-blue">
                      {service.name}
                    </h3>
                    <p className="text-gray-600">ID: {service.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  {getStatusBadge(service.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <p className="text-gray-900">{service.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <Badge className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requiere Doctor
                    </label>
                    <div className="flex items-center space-x-2">
                      {service.doctorRequired ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {service.doctorRequired ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Precio y Duración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary-blue" />
                Precio y Duración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Precio</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {service.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Duración</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {service.duration} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popularidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                Popularidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Nivel de Popularidad</span>
                  <span className="text-lg font-bold text-primary-blue">{service.popularity}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getPopularityStars(service.popularity)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${service.popularity}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipamiento */}
          {service.equipment && service.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary-blue" />
                  Equipamiento Requerido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.equipment.map((equipment, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{equipment}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas del Servicio (Mock) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary-blue" />
                Estadísticas del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Citas Realizadas</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.floor(Math.random() * 100) + 50}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-xl font-bold text-green-600">
                    S/ {(Math.floor(Math.random() * 5000) + 2000).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Satisfacción</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.floor(Math.random() * 20) + 80}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Actividad (Mock) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-primary-blue" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Servicio creado</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString('es-ES')} - Sistema
                    </p>
                  </div>
                </div>
                {service.status === "active" && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Servicio activado</p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleDateString('es-ES')} - Administrador
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Última actualización</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString('es-ES')} - Sistema
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
