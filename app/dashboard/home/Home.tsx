import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useAuthStore } from "~/store/authStore";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  UserPlus,
  FileText,
  Stethoscope,
  Heart,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Plus
} from "lucide-react";

// Datos mock para el dashboard
const mockStats = {
  totalPatients: 1247,
  totalAppointments: 89,
  monthlyRevenue: 45680,
  activeServices: 156,
  patientGrowth: 12.5,
  appointmentGrowth: 8.3,
  revenueGrowth: 15.2,
  serviceGrowth: 6.7
};

const todayAppointments = [
  {
    id: 1,
    patient: "María González",
    time: "09:00",
    doctor: "Dr. Carlos Mendoza",
    type: "Consulta General",
    status: "confirmada",
    priority: "normal"
  },
  {
    id: 2,
    patient: "Juan Pérez",
    time: "10:30",
    doctor: "Dra. Ana Silva",
    type: "Control",
    status: "en_progreso",
    priority: "alta"
  },
  {
    id: 3,
    patient: "Luis Rodríguez",
    time: "11:15",
    doctor: "Dr. Miguel Torres",
    type: "Seguimiento",
    status: "pendiente",
    priority: "normal"
  },
  {
    id: 4,
    patient: "Carmen López",
    time: "14:00",
    doctor: "Dra. Ana Silva",
    type: "Consulta Especializada",
    status: "confirmada",
    priority: "normal"
  },
  {
    id: 5,
    patient: "Roberto Martín",
    time: "15:30",
    doctor: "Dr. Carlos Mendoza",
    type: "Revisión",
    status: "pendiente",
    priority: "baja"
  }
];

const recentActivity = [
  {
    id: 1,
    type: "nuevo_paciente",
    description: "Nuevo paciente registrado: Sofia Herrera",
    time: "Hace 15 minutos",
    icon: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    id: 2,
    type: "cita_completada",
    description: "Cita completada: María González - Consulta General",
    time: "Hace 1 hora",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: 3,
    type: "resultado_lab",
    description: "Resultado de laboratorio disponible: Hemograma - Juan Pérez",
    time: "Hace 2 horas",
    icon: Stethoscope,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    id: 4,
    type: "emergencia",
    description: "Nueva emergencia registrada: Caso crítico - Paciente anónimo",
    time: "Hace 3 horas",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    id: 5,
    type: "factura_generada",
    description: "Factura generada: #FAC-2025-001 - S/ 450.00",
    time: "Hace 4 horas",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

const topServices = [
  { name: "Consulta Médica General", count: 45, revenue: 3600, growth: 8.2 },
  { name: "Hemograma Completo", count: 38, revenue: 1710, growth: 12.5 },
  { name: "Radiografía de Tórax", count: 32, revenue: 3040, growth: -2.1 },
  { name: "Electrocardiograma", count: 28, revenue: 3360, growth: 15.3 },
  { name: "Vacuna contra la Influenza", count: 25, revenue: 875, growth: 22.1 }
];

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Stock Bajo",
    message: "5 productos con stock bajo en inventario",
    action: "Revisar Inventario",
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  {
    id: 2,
    type: "info",
    title: "Mantenimiento Programado",
    message: "Sistema de backup programado para mañana a las 2:00 AM",
    action: "Ver Detalles",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    id: 3,
    type: "success",
    title: "Meta Mensual Alcanzada",
    message: "Se ha alcanzado el 105% de la meta de ingresos mensual",
    action: "Ver Reporte",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  }
];

export default function HomeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTempUser = user?.email === "admin@healthathome.com";
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmada: { label: "Confirmada", color: "bg-green-100 text-green-800" },
      en_progreso: { label: "En Progreso", color: "bg-blue-100 text-blue-800" },
      pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      alta: { label: "Alta", color: "bg-red-100 text-red-800" },
      normal: { label: "Normal", color: "bg-blue-100 text-blue-800" },
      baja: { label: "Baja", color: "bg-gray-100 text-gray-800" }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  // Funciones de manejo de eventos
  const handleGenerateReport = () => {
    setIsReportModalOpen(true);
  };

  const handleNewAppointment = () => {
    navigate("/citas");
    toast.success("Redirigiendo a la página de citas para crear una nueva cita");
  };

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleAlertAction = (alertType: string) => {
    switch (alertType) {
      case "warning":
        navigate("/inventario");
        toast.info("Redirigiendo al inventario para revisar stock bajo");
        break;
      case "info":
        toast.info("El mantenimiento está programado para mañana a las 2:00 AM");
        break;
      case "success":
        navigate("/reportes");
        toast.success("Redirigiendo a reportes para ver el análisis completo");
        break;
      default:
        toast.info("Acción no implementada aún");
    }
  };

  const handleExportReport = (format: string) => {
    toast.success(`Generando reporte en formato ${format.toUpperCase()}...`);
    
    // Generar datos del reporte
    const reportData = {
      fecha: new Date().toLocaleDateString('es-ES'),
      hora: new Date().toLocaleTimeString('es-ES'),
      usuario: user?.email || 'Usuario',
      metricas: {
        totalPacientes: mockStats.totalPatients,
        citasHoy: mockStats.totalAppointments,
        ingresosMes: mockStats.monthlyRevenue,
        serviciosActivos: mockStats.activeServices
      },
      citasDelDia: todayAppointments,
      serviciosPopulares: topServices,
      alertas: alerts,
      actividadReciente: recentActivity
    };

    // Simular generación y descarga
    setTimeout(() => {
      try {
        if (format === 'pdf') {
          generatePDFReport(reportData);
        } else if (format === 'excel') {
          generateExcelReport(reportData);
        } else if (format === 'csv') {
          generateCSVReport(reportData);
        } else if (format === 'json') {
          generateJSONReport(reportData);
        }
        
        toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
        setIsReportModalOpen(false);
      } catch (error) {
        toast.error('Error al generar el reporte');
        console.error('Error:', error);
      }
    }, 1500);
  };

  const generatePDFReport = (data: any) => {
    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte Dashboard - ${data.fecha}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte del Dashboard</h1>
          <p>Generado el ${data.fecha} a las ${data.hora}</p>
          <p>Usuario: ${data.usuario}</p>
        </div>
        
        <div class="section">
          <h2>Métricas Principales</h2>
          <div class="metric">Total Pacientes: ${data.metricas.totalPacientes}</div>
          <div class="metric">Citas Hoy: ${data.metricas.citasHoy}</div>
          <div class="metric">Ingresos del Mes: S/ ${data.metricas.ingresosMes.toLocaleString()}</div>
          <div class="metric">Servicios Activos: ${data.metricas.serviciosActivos}</div>
        </div>
        
        <div class="section">
          <h2>Citas del Día</h2>
          <table class="table">
            <tr><th>Hora</th><th>Paciente</th><th>Doctor</th><th>Tipo</th><th>Estado</th></tr>
            ${data.citasDelDia.map((cita: any) => 
              `<tr><td>${cita.time}</td><td>${cita.patient}</td><td>${cita.doctor}</td><td>${cita.type}</td><td>${cita.status}</td></tr>`
            ).join('')}
          </table>
        </div>
        
        <div class="section">
          <h2>Servicios Populares</h2>
          <table class="table">
            <tr><th>Servicio</th><th>Cantidad</th><th>Ingresos</th><th>Crecimiento</th></tr>
            ${data.serviciosPopulares.map((servicio: any) => 
              `<tr><td>${servicio.name}</td><td>${servicio.count}</td><td>S/ ${servicio.revenue}</td><td>${servicio.growth}%</td></tr>`
            ).join('')}
          </table>
        </div>
      </body>
      </html>
    `;

    // Crear y descargar el archivo
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-dashboard-${data.fecha.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExcelReport = (data: any) => {
    // Crear contenido CSV (compatible con Excel)
    const csvContent = `Reporte Dashboard - ${data.fecha}
Usuario,${data.usuario}
Fecha de Generación,${data.fecha} ${data.hora}

MÉTRICAS PRINCIPALES
Métrica,Valor
Total Pacientes,${data.metricas.totalPacientes}
Citas Hoy,${data.metricas.citasHoy}
Ingresos del Mes,S/ ${data.metricas.ingresosMes}
Servicios Activos,${data.metricas.serviciosActivos}

CITAS DEL DÍA
Hora,Paciente,Doctor,Tipo,Estado,Prioridad
${data.citasDelDia.map((cita: any) => 
  `${cita.time},${cita.patient},${cita.doctor},${cita.type},${cita.status},${cita.priority}`
).join('\n')}

SERVICIOS POPULARES
Servicio,Cantidad,Ingresos,Crecimiento
${data.serviciosPopulares.map((servicio: any) => 
  `"${servicio.name}",${servicio.count},S/ ${servicio.revenue},${servicio.growth}%`
).join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-dashboard-${data.fecha.replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = (data: any) => {
    // Similar al Excel pero con formato CSV puro
    const csvContent = `Reporte Dashboard - ${data.fecha}
Usuario,${data.usuario}
Fecha,${data.fecha} ${data.hora}

Métricas
Total Pacientes,${data.metricas.totalPacientes}
Citas Hoy,${data.metricas.citasHoy}
Ingresos Mes,${data.metricas.ingresosMes}
Servicios Activos,${data.metricas.serviciosActivos}

Citas
Hora,Paciente,Doctor,Tipo,Estado
${data.citasDelDia.map((cita: any) => 
  `${cita.time},${cita.patient},${cita.doctor},${cita.type},${cita.status}`
).join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-dashboard-${data.fecha.replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSONReport = (data: any) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-dashboard-${data.fecha.replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Dashboard Principal</h1>
          <p className="text-gray-600 mt-2">Bienvenido de vuelta, {user?.email?.split('@')[0] || 'Usuario'}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
          <Button size="sm" className="bg-primary-blue hover:bg-primary-blue/90" onClick={handleNewAppointment}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Nota de desarrollo para usuario temporal */}
      {isTempUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-yellow-800 text-sm">
              <strong>Modo Desarrollo:</strong> Estás usando credenciales temporales. 
              Los datos mostrados son de ejemplo.
            </p>
          </div>
        </div>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.totalPatients.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(mockStats.patientGrowth)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(mockStats.patientGrowth)}`}>
                    +{mockStats.patientGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.totalAppointments}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(mockStats.appointmentGrowth)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(mockStats.appointmentGrowth)}`}>
                    +{mockStats.appointmentGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-gray-900">S/ {mockStats.monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(mockStats.revenueGrowth)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(mockStats.revenueGrowth)}`}>
                    +{mockStats.revenueGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.activeServices}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(mockStats.serviceGrowth)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(mockStats.serviceGrowth)}`}>
                    +{mockStats.serviceGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Citas del Día */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Citas de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Hora</p>
                        <p className="font-semibold">{appointment.time}</p>
                      </div>
                      <div className="w-px h-12 bg-gray-200"></div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-600">{appointment.doctor}</p>
                        <p className="text-xs text-gray-500">{appointment.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(appointment.status)}
                      {getPriorityBadge(appointment.priority)}
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewAppointment(appointment)}
                          title="Ver detalles de la cita"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                          title="Editar cita"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-blue" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const IconComponent = alert.icon;
                  return (
                    <div key={alert.id} className={`p-3 rounded-lg border ${alert.bgColor} ${alert.borderColor}`}>
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${alert.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs mt-2"
                            onClick={() => handleAlertAction(alert.type)}
                          >
                            {alert.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Servicios Populares */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                Servicios Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-primary-blue text-white">{index + 1}</Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.count} realizados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">S/ {service.revenue.toFixed(0)}</p>
                      <div className="flex items-center">
                        {getGrowthIcon(service.growth)}
                        <span className={`text-xs ml-1 ${getGrowthColor(service.growth)}`}>
                          {service.growth > 0 ? '+' : ''}{service.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-blue" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-full ${activity.bgColor}`}>
                    <IconComponent className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal para Ver Cita */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Paciente</label>
                  <p className="text-lg font-semibold">{selectedAppointment.patient}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hora</label>
                  <p className="text-lg font-semibold">{selectedAppointment.time}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Doctor</label>
                  <p className="text-lg">{selectedAppointment.doctor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Cita</label>
                  <p className="text-lg">{selectedAppointment.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prioridad</label>
                  <div className="mt-1">{getPriorityBadge(selectedAppointment.priority)}</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Notas Adicionales</h4>
                <p className="text-sm text-gray-600">
                  Esta es una cita programada para el día de hoy. 
                  {selectedAppointment.status === "en_progreso" && " La cita está actualmente en progreso."}
                  {selectedAppointment.status === "confirmada" && " La cita está confirmada y lista para proceder."}
                  {selectedAppointment.status === "pendiente" && " La cita está pendiente de confirmación."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Cita */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Para editar completamente la cita, serás redirigido a la página de citas donde podrás modificar todos los detalles.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Paciente</label>
                  <p className="text-lg font-semibold">{selectedAppointment.patient}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hora Actual</label>
                  <p className="text-lg font-semibold">{selectedAppointment.time}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Doctor</label>
                  <p className="text-lg">{selectedAppointment.doctor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Cita</label>
                  <p className="text-lg">{selectedAppointment.type}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-primary-blue hover:bg-primary-blue/90"
                  onClick={() => {
                    navigate("/citas");
                    toast.success("Redirigiendo a la página de citas para editar");
                    setIsEditModalOpen(false);
                  }}
                >
                  Ir a Editar Cita
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Generar Reporte */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Reporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona el formato en el que deseas generar el reporte del dashboard:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleExportReport("pdf")}
                className="flex flex-col items-center p-4 h-auto"
              >
                <FileText className="w-8 h-8 mb-2 text-red-600" />
                <span className="font-medium">PDF</span>
                <span className="text-xs text-gray-500">Documento</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportReport("excel")}
                className="flex flex-col items-center p-4 h-auto"
              >
                <FileText className="w-8 h-8 mb-2 text-green-600" />
                <span className="font-medium">Excel</span>
                <span className="text-xs text-gray-500">Hoja de cálculo</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportReport("csv")}
                className="flex flex-col items-center p-4 h-auto"
              >
                <FileText className="w-8 h-8 mb-2 text-blue-600" />
                <span className="font-medium">CSV</span>
                <span className="text-xs text-gray-500">Datos</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportReport("json")}
                className="flex flex-col items-center p-4 h-auto"
              >
                <FileText className="w-8 h-8 mb-2 text-purple-600" />
                <span className="font-medium">JSON</span>
                <span className="text-xs text-gray-500">API</span>
              </Button>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  navigate("/reportes");
                  toast.info("Redirigiendo a la página de reportes para más opciones");
                  setIsReportModalOpen(false);
                }}
              >
                Ver Más Opciones
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
