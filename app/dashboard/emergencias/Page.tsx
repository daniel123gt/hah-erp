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
import { AddEmergencyModal } from "~/components/ui/add-emergency-modal";
import { ViewEmergencyModal } from "~/components/ui/view-emergency-modal";
import { EditEmergencyModal } from "~/components/ui/edit-emergency-modal";
import { 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Heart,
  Activity
} from "lucide-react";

interface Emergency {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  emergencyType: "cardiac" | "respiratory" | "trauma" | "neurological" | "other";
  priority: "critical" | "urgent" | "moderate" | "low";
  status: "active" | "in_progress" | "resolved" | "transferred";
  reportedAt: string;
  assignedTo?: string;
  location: string;
  symptoms: string;
  notes?: string;
  responseTime?: number;
}

const mockEmergencies: Emergency[] = [
  {
    id: "EMG001",
    patientName: "Carlos Mendoza",
    patientPhone: "+51 999 456 789",
    patientAge: 65,
    emergencyType: "cardiac",
    priority: "critical",
    status: "active",
    reportedAt: "2025-01-25T10:30:00",
    location: "Av. Arequipa 123, Lima",
    symptoms: "Dolor en el pecho, dificultad para respirar, sudoración excesiva",
    notes: "Paciente con historial de problemas cardíacos"
  },
  {
    id: "EMG002",
    patientName: "Ana Torres",
    patientPhone: "+51 999 345 678",
    patientAge: 28,
    emergencyType: "respiratory",
    priority: "urgent",
    status: "in_progress",
    reportedAt: "2025-01-25T09:15:00",
    assignedTo: "Dr. Roberto Silva",
    location: "Jr. Tacna 456, Lima",
    symptoms: "Dificultad para respirar, tos seca, fiebre alta",
    responseTime: 8
  },
  {
    id: "EMG003",
    patientName: "Luis Rodríguez",
    patientPhone: "+51 999 234 567",
    patientAge: 42,
    emergencyType: "trauma",
    priority: "moderate",
    status: "resolved",
    reportedAt: "2025-01-25T08:00:00",
    assignedTo: "Dra. Elena Morales",
    location: "Av. Brasil 789, Lima",
    symptoms: "Fractura en brazo derecho, dolor moderado",
    notes: "Accidente de tránsito menor",
    responseTime: 15
  },
  {
    id: "EMG004",
    patientName: "María Silva",
    patientPhone: "+51 999 123 456",
    patientAge: 55,
    emergencyType: "neurological",
    priority: "critical",
    status: "transferred",
    reportedAt: "2025-01-25T07:30:00",
    location: "Jr. Huancavelica 321, Lima",
    symptoms: "Pérdida de consciencia, convulsiones, dolor de cabeza intenso",
    notes: "Transferido a hospital especializado en neurología",
    responseTime: 5
  },
  {
    id: "EMG005",
    patientName: "Roberto González",
    patientPhone: "+51 999 567 890",
    patientAge: 35,
    emergencyType: "other",
    priority: "low",
    status: "resolved",
    reportedAt: "2025-01-25T06:45:00",
    assignedTo: "Lic. Miguel Torres",
    location: "Av. Salaverry 654, Lima",
    symptoms: "Alergia severa, urticaria, hinchazón facial",
    notes: "Reacción alérgica a medicamento",
    responseTime: 20
  }
];

export default function EmergenciasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [emergencies, setEmergencies] = useState<Emergency[]>(mockEmergencies);

  const filteredEmergencies = emergencies.filter(emergency => {
    const matchesSearch = emergency.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emergency.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || emergency.emergencyType === filterType;
    const matchesPriority = filterPriority === "all" || emergency.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || emergency.status === filterStatus;
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const handleEmergencyAdded = (newEmergency: Emergency) => {
    setEmergencies(prev => [newEmergency, ...prev]);
  };

  const handleEmergencyUpdated = (updatedEmergency: Emergency) => {
    setEmergencies(prev => 
      prev.map(emergency => 
        emergency.id === updatedEmergency.id ? updatedEmergency : emergency
      )
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case "urgent":
        return <Badge className="bg-orange-100 text-orange-800">Urgente</Badge>;
      case "moderate":
        return <Badge className="bg-yellow-100 text-yellow-800">Moderado</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Bajo</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-100 text-red-800">Activo</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
      case "transferred":
        return <Badge className="bg-purple-100 text-purple-800">Transferido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cardiac":
        return <Heart className="w-4 h-4 text-red-600" />;
      case "respiratory":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "trauma":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "neurological":
        return <User className="w-4 h-4 text-purple-600" />;
      default:
        return <Phone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cardiac":
        return "bg-red-100 text-red-800";
      case "respiratory":
        return "bg-blue-100 text-blue-800";
      case "trauma":
        return "bg-orange-100 text-orange-800";
      case "neurological":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const activeEmergencies = emergencies.filter(e => e.status === "active").length;
  const criticalEmergencies = emergencies.filter(e => e.priority === "critical").length;
  const resolvedToday = emergencies.filter(e => 
    e.status === "resolved" && 
    new Date(e.reportedAt).toDateString() === new Date().toDateString()
  ).length;
  const avgResponseTime = emergencies
    .filter(e => e.responseTime)
    .reduce((acc, e) => acc + (e.responseTime || 0), 0) / 
    emergencies.filter(e => e.responseTime).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Emergencias</h1>
          <p className="text-gray-600 mt-2">Administra casos urgentes y emergencias médicas</p>
        </div>
        <AddEmergencyModal onEmergencyAdded={handleEmergencyAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Emergencias Activas</p>
                <p className="text-2xl font-bold text-gray-900">{activeEmergencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Casos Críticos</p>
                <p className="text-2xl font-bold text-gray-900">{criticalEmergencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Resueltos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{resolvedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                <p className="text-2xl font-bold text-gray-900">{avgResponseTime.toFixed(1)} min</p>
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
                placeholder="Buscar emergencias por paciente o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los tipos</option>
              <option value="cardiac">Cardíaco</option>
              <option value="respiratory">Respiratorio</option>
              <option value="trauma">Trauma</option>
              <option value="neurological">Neurológico</option>
              <option value="other">Otros</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítico</option>
              <option value="urgent">Urgente</option>
              <option value="moderate">Moderado</option>
              <option value="low">Bajo</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="in_progress">En Proceso</option>
              <option value="resolved">Resuelto</option>
              <option value="transferred">Transferido</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Emergencias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Reportado</TableHead>
                <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmergencies.map((emergency) => (
                <TableRow key={emergency.id}>
                  <TableCell className="font-medium">{emergency.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{emergency.patientName}</p>
                      <p className="text-sm text-gray-500">{emergency.patientAge} años</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{emergency.patientPhone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(emergency.emergencyType)}
                      <Badge className={getTypeColor(emergency.emergencyType)}>
                        {emergency.emergencyType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(emergency.priority)}</TableCell>
                  <TableCell>{getStatusBadge(emergency.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{emergency.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(emergency.reportedAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex space-x-2">
                      <ViewEmergencyModal emergency={emergency} />
                      <EditEmergencyModal 
                        emergency={emergency} 
                        onEmergencyUpdated={handleEmergencyUpdated} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
