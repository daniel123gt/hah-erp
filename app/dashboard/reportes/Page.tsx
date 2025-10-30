import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ExportReportsModal } from "~/components/ui/export-reports-modal";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Award,
  Clock
} from "lucide-react";

interface ReportData {
  period: string;
  patients: number;
  appointments: number;
  revenue: number;
  services: number;
}

const mockReportData: ReportData[] = [
  { period: "Enero 2025", patients: 45, appointments: 120, revenue: 8500, services: 180 },
  { period: "Diciembre 2024", patients: 38, appointments: 95, revenue: 7200, services: 150 },
  { period: "Noviembre 2024", patients: 42, appointments: 110, revenue: 7800, services: 165 },
  { period: "Octubre 2024", patients: 35, appointments: 88, revenue: 6500, services: 140 },
  { period: "Septiembre 2024", patients: 40, appointments: 102, revenue: 7500, services: 155 },
  { period: "Agosto 2024", patients: 33, appointments: 85, revenue: 6200, services: 135 }
];

const topServices = [
  { name: "Consulta Médica General", count: 45, revenue: 3600 },
  { name: "Hemograma Completo", count: 38, revenue: 1710 },
  { name: "Radiografía de Tórax", count: 32, revenue: 3040 },
  { name: "Electrocardiograma", count: 28, revenue: 3360 },
  { name: "Vacuna contra la Influenza", count: 25, revenue: 875 }
];

const patientDemographics = [
  { ageGroup: "18-25", count: 15, percentage: 20 },
  { ageGroup: "26-35", count: 25, percentage: 33 },
  { ageGroup: "36-45", count: 18, percentage: 24 },
  { ageGroup: "46-55", count: 12, percentage: 16 },
  { ageGroup: "55+", count: 5, percentage: 7 }
];

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6");

  const currentPeriod = mockReportData[0];
  const previousPeriod = mockReportData[1];
  
  const patientGrowth = ((currentPeriod.patients - previousPeriod.patients) / previousPeriod.patients * 100).toFixed(1);
  const appointmentGrowth = ((currentPeriod.appointments - previousPeriod.appointments) / previousPeriod.appointments * 100).toFixed(1);
  const revenueGrowth = ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue * 100).toFixed(1);
  const serviceGrowth = ((currentPeriod.services - previousPeriod.services) / previousPeriod.services * 100).toFixed(1);

  const totalRevenue = mockReportData.reduce((acc, period) => acc + period.revenue, 0);
  const totalPatients = mockReportData.reduce((acc, period) => acc + period.patients, 0);
  const totalAppointments = mockReportData.reduce((acc, period) => acc + period.appointments, 0);
  const totalServices = mockReportData.reduce((acc, period) => acc + period.services, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-2">Estadísticas y métricas del sistema médico</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Último año</option>
          </select>
          <ExportReportsModal 
            reportData={mockReportData}
            topServices={topServices}
            patientDemographics={patientDemographics}
            totalRevenue={totalRevenue}
            totalPatients={totalPatients}
            totalAppointments={totalAppointments}
            totalServices={totalServices}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
                <p className={`text-sm ${parseFloat(patientGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(patientGrowth) >= 0 ? '+' : ''}{patientGrowth}% vs mes anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
                <p className={`text-sm ${parseFloat(appointmentGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(appointmentGrowth) >= 0 ? '+' : ''}{appointmentGrowth}% vs mes anterior
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
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">S/ {totalRevenue.toFixed(2)}</p>
                <p className={`text-sm ${parseFloat(revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}% vs mes anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
                <p className={`text-sm ${parseFloat(serviceGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(serviceGrowth) >= 0 ? '+' : ''}{serviceGrowth}% vs mes anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-blue" />
              Tendencia de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReportData.slice(0, 6).map((period, index) => (
                <div key={period.period} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{period.period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-blue h-2 rounded-full" 
                        style={{ width: `${(period.revenue / 9000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">S/ {period.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-blue" />
              Servicios Más Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-primary-blue text-white">{index + 1}</Badge>
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.count} realizados</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    S/ {service.revenue.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-blue" />
            Demografía de Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {patientDemographics.map((demo) => (
              <div key={demo.ageGroup} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary-blue/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-blue">{demo.percentage}%</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{demo.ageGroup}</p>
                <p className="text-xs text-gray-500">{demo.count} pacientes</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800">Tasa de Satisfacción</h3>
            <p className="text-3xl font-bold text-green-900">94.2%</p>
            <p className="text-sm text-green-600 mt-2">Basado en 156 evaluaciones</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-800">Tiempo Promedio</h3>
            <p className="text-3xl font-bold text-blue-900">18 min</p>
            <p className="text-sm text-blue-600 mt-2">Tiempo de espera promedio</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-purple-800">Crecimiento Mensual</h3>
            <p className="text-3xl font-bold text-purple-900">+12.5%</p>
            <p className="text-sm text-purple-600 mt-2">En número de pacientes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
