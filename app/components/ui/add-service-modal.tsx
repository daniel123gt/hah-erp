import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
  Plus, 
  Stethoscope, 
  DollarSign, 
  Clock, 
  Package, 
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
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

interface AddServiceModalProps {
  onServiceAdded: (service: Service) => void;
}

const categories = [
  "Consultas",
  "Laboratorio", 
  "Cardiología",
  "Imagenología",
  "Vacunación",
  "Fisioterapia",
  "Psicología",
  "Nutrición",
  "Odontología",
  "Dermatología"
];

const equipmentOptions = [
  "Analizador Automático",
  "Centrífuga",
  "Electrocardiógrafo",
  "Electrodos",
  "Equipo de Rayos X",
  "Procesador Digital",
  "Ecógrafo",
  "Tensiometro",
  "Otoscopio",
  "Estetoscopio",
  "Termómetro Digital",
  "Oxímetro de Pulso"
];

export function AddServiceModal({ onServiceAdded }: AddServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: 0,
    duration: 30,
    status: "active" as const,
    popularity: 50,
    doctorRequired: false,
    equipment: [] as string[]
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      equipment: checked 
        ? [...prev.equipment, equipment]
        : prev.equipment.filter(e => e !== equipment)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newService: Service = {
      id: `S${Date.now()}`,
      ...formData
    };

    onServiceAdded(newService);
    setIsOpen(false);
    setFormData({
      name: "",
      category: "",
      description: "",
      price: 0,
      duration: 30,
      status: "active",
      popularity: 50,
      doctorRequired: false,
      equipment: []
    });
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Agregar Nuevo Servicio
          </DialogTitle>
          <DialogDescription>
            Complete la información para agregar un nuevo servicio médico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Consulta Médica General"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Descripción detallada del servicio..."
                  required
                />
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (S/) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 30)}
                    className="pl-10"
                    min="5"
                    max="480"
                    step="5"
                    placeholder="30"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración Avanzada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary-blue" />
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popularidad (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.popularity}
                    onChange={(e) => handleInputChange("popularity", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{formData.popularity}%</span>
                    <div className="flex space-x-1">
                      {getPopularityStars(formData.popularity)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.doctorRequired}
                    onChange={(e) => handleInputChange("doctorRequired", e.target.checked)}
                    className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Requiere doctor especializado
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Equipamiento Requerido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary-blue" />
                Equipamiento Requerido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {equipmentOptions.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment)}
                      onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                      className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen del Servicio */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre:</p>
                  <p className="font-medium">{formData.name || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categoría:</p>
                  <div className="flex items-center space-x-2">
                    {formData.category && (
                      <Badge className={getCategoryColor(formData.category)}>
                        {formData.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio y Duración:</p>
                  <p className="font-medium">
                    S/ {formData.price.toFixed(2)} - {formData.duration} min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado y Popularidad:</p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(formData.status)}
                    <div className="flex space-x-1">
                      {getPopularityStars(formData.popularity)}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Equipamiento:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.equipment.length > 0 ? (
                      formData.equipment.map((equipment) => (
                        <Badge key={equipment} className="bg-gray-100 text-gray-800">
                          {equipment}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Ninguno seleccionado</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              Agregar Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
