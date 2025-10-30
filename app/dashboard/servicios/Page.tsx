import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AddServiceModal } from "~/components/ui/add-service-modal";
import { ViewServiceModal } from "~/components/ui/view-service-modal";
import { EditServiceModal } from "~/components/ui/edit-service-modal";
import { 
  Search, 
  Plus, 
  Filter, 
  Stethoscope, 
  DollarSign, 
  Clock, 
  Package,
  TrendingUp,
  Users,
  Star
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

const mockServices: Service[] = [
  {
    id: "S001",
    name: "Consulta Médica General",
    category: "Consultas",
    description: "Consulta médica general con médico especialista",
    price: 80.00,
    duration: 30,
    status: "active",
    popularity: 95,
    doctorRequired: true
  },
  {
    id: "S002",
    name: "Hemograma Completo",
    category: "Laboratorio",
    description: "Análisis completo de sangre con 18 parámetros",
    price: 45.00,
    duration: 20,
    status: "active",
    popularity: 88,
    doctorRequired: false,
    equipment: ["Analizador Automático", "Centrífuga"]
  },
  {
    id: "S003",
    name: "Electrocardiograma",
    category: "Cardiología",
    description: "Registro de la actividad eléctrica del corazón",
    price: 120.00,
    duration: 45,
    status: "active",
    popularity: 76,
    doctorRequired: true,
    equipment: ["Electrocardiógrafo", "Electrodos"]
  },
  {
    id: "S004",
    name: "Radiografía de Tórax",
    category: "Imagenología",
    description: "Radiografía digital del tórax en dos proyecciones",
    price: 95.00,
    duration: 25,
    status: "active",
    popularity: 82,
    doctorRequired: true,
    equipment: ["Equipo de Rayos X", "Procesador Digital"]
  },
  {
    id: "S005",
    name: "Vacuna contra la Influenza",
    category: "Vacunación",
    description: "Vacuna anual contra la influenza estacional",
    price: 35.00,
    duration: 15,
    status: "active",
    popularity: 92,
    doctorRequired: false
  }
];

export default function ServiciosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [services, setServices] = useState<Service[]>(mockServices);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    const matchesStatus = filterStatus === "all" || service.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleServiceAdded = (newService: Service) => {
    setServices(prev => [newService, ...prev]);
  };

  const handleServiceUpdated = (updatedService: Service) => {
    setServices(prev => 
      prev.map(service => 
        service.id === updatedService.id ? updatedService : service
      )
    );
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Servicios</h1>
          <p className="text-gray-600 mt-2">Administra el catálogo de servicios médicos</p>
        </div>
        <AddServiceModal onServiceAdded={handleServiceAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  S/ {services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Más Popular</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.length > 0 ? Math.max(...services.map(s => s.popularity)) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar servicios por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todas las categorías</option>
              <option value="Consultas">Consultas</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Cardiología">Cardiología</option>
              <option value="Imagenología">Imagenología</option>
              <option value="Vacunación">Vacunación</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Popularidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.description}</p>
                      {service.doctorRequired && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">Requiere Doctor</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">S/ {service.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{service.duration} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getPopularityStars(service.popularity)}
                      <span className="text-sm text-gray-500 ml-2">{service.popularity}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <ViewServiceModal service={service} />
                      <EditServiceModal 
                        service={service} 
                        onServiceUpdated={handleServiceUpdated} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}