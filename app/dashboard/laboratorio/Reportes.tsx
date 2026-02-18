import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import labOrderService, { type LabExamOrder } from "~/services/labOrderService";
import { formatDateOnly } from "~/lib/utils";
import { getExams } from "~/services/labService";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  ArrowLeft,
  Loader2,
  DollarSign,
  Users,
  FileCheck,
  TrendingUp,
  X
} from "lucide-react";

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  totalExams: number;
  completedOrders: number;
  pendingOrders: number;
}

interface ExamStats {
  exam_id: string;
  exam_name: string;
  exam_code: string;
  count: number;
  total_revenue: number;
}

export default function LaboratorioReportes() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<'orders' | 'exams' | 'revenue' | 'summary'>('summary');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // Primer día del mes
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Hoy
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<LabExamOrder[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalExams: 0,
    completedOrders: 0,
    pendingOrders: 0
  });
  const [examStats, setExamStats] = useState<ExamStats[]>([]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      
      const result = await labOrderService.getAllOrders({
        page: 1,
        limit: 10000, // Para reportes, necesitamos todos los datos
        status: statusFilter !== 'all' ? statusFilter as any : undefined
      });

      // Filtrar por rango de fechas
      const filteredOrders = result.data.filter(order => {
        const orderDateStr = String(order.order_date).trim().slice(0, 10);
        return orderDateStr >= startDate && orderDateStr <= endDate;
      });

      setOrders(filteredOrders);

      // Calcular estadísticas
      const calculatedStats: ReportStats = {
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total_amount, 0),
        totalExams: filteredOrders.reduce((sum, order) => sum + order.items.length, 0),
        completedOrders: filteredOrders.filter(order => order.status === 'Completado').length,
        pendingOrders: filteredOrders.filter(order => 
          order.status === 'Pendiente' || 
          order.status === 'En toma de muestra' || 
          order.status === 'En Proceso'
        ).length
      };
      setStats(calculatedStats);

      // Calcular estadísticas de exámenes
      const examMap = new Map<string, { name: string; code: string; count: number; revenue: number }>();
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          const existing = examMap.get(item.exam_id);
          if (existing) {
            existing.count++;
            existing.revenue += item.price;
          } else {
            examMap.set(item.exam_id, {
              name: item.exam_name,
              code: item.exam_code,
              count: 1,
              revenue: item.price
            });
          }
        });
      });

      const examStatsArray: ExamStats[] = Array.from(examMap.entries()).map(([exam_id, data]) => ({
        exam_id,
        exam_name: data.name,
        exam_code: data.code,
        count: data.count,
        total_revenue: data.revenue
      })).sort((a, b) => b.count - a.count);

      setExamStats(examStatsArray);
    } catch (error) {
      console.error('Error al cargar datos del reporte:', error);
      toast.error('Error al cargar los datos del reporte');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, startDate, endDate, statusFilter]);

  const handleExportCSV = () => {
    let csvContent = '';
    
    if (reportType === 'orders') {
      // Encabezados
      csvContent = 'ID, Fecha, Paciente ID, Médico, Estado, Prioridad, Total (S/), # Exámenes\n';
      // Datos
      orders.forEach(order => {
        csvContent += `${order.id.slice(0, 8)}, ${order.order_date}, ${order.patient_id.slice(0, 8)}, ${order.physician_name || 'N/A'}, ${order.status}, ${order.priority}, ${order.total_amount.toFixed(2)}, ${order.items.length}\n`;
      });
    } else if (reportType === 'exams') {
      csvContent = 'Código, Examen, Cantidad, Ingresos (S/)\n';
      examStats.forEach(stat => {
        csvContent += `${stat.exam_code}, "${stat.exam_name}", ${stat.count}, ${stat.total_revenue.toFixed(2)}\n`;
      });
    } else if (reportType === 'revenue') {
      csvContent = 'Fecha, Órdenes, Ingresos (S/), Exámenes\n';
      const dateGroups = new Map<string, { orders: number; revenue: number; exams: number }>();
      orders.forEach(order => {
        const date = order.order_date;
        const existing = dateGroups.get(date);
        if (existing) {
          existing.orders++;
          existing.revenue += order.total_amount;
          existing.exams += order.items.length;
        } else {
          dateGroups.set(date, {
            orders: 1,
            revenue: order.total_amount,
            exams: order.items.length
          });
        }
      });
      Array.from(dateGroups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, data]) => {
          csvContent += `${date}, ${data.orders}, ${data.revenue.toFixed(2)}, ${data.exams}\n`;
        });
    }

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-laboratorio-${reportType}-${startDate}-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Reporte exportado exitosamente');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" onClick={() => navigate('/laboratorio')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">📊 Reportes de Laboratorio</h1>
          </div>
          <p className="text-gray-600">Genera reportes y análisis de las órdenes de exámenes</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumen General</SelectItem>
                  <SelectItem value="orders">Órdenes Detalladas</SelectItem>
                  <SelectItem value="exams">Exámenes Más Solicitados</SelectItem>
                  <SelectItem value="revenue">Ingresos por Fecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen General */}
      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-600">S/ {stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Exámenes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                </div>
                <FileCheck className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.pendingOrders} pendientes</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón de Exportar */}
      {reportType !== 'summary' && (
        <div className="flex justify-end">
          <Button onClick={handleExportCSV} disabled={isLoading || orders.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      )}

      {/* Contenido del Reporte */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
            <p className="text-gray-600">Generando reporte...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Reporte de Órdenes Detalladas */}
          {reportType === 'orders' && (
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Detalladas ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay órdenes en el rango de fechas seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-left p-2">Médico</th>
                          <th className="text-left p-2">Estado</th>
                          <th className="text-left p-2">Prioridad</th>
                          <th className="text-right p-2">Exámenes</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
                            <td className="p-2">{formatDateOnly(order.order_date)}</td>
                            <td className="p-2">{order.physician_name || '-'}</td>
                            <td className="p-2">
                              <Badge variant={
                                order.status === 'Completado' ? 'default' :
                                order.status === 'Pendiente' ? 'outline' :
                                order.status === 'En toma de muestra' ? 'secondary' :
                                'secondary'
                              }>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant={order.priority === 'urgente' ? 'destructive' : 'secondary'}>
                                {order.priority}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{order.items.length}</td>
                            <td className="p-2 text-right font-semibold">S/ {order.total_amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={6} className="p-2 text-right">Total:</td>
                          <td className="p-2 text-right">S/ {stats.totalRevenue.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reporte de Exámenes Más Solicitados */}
          {reportType === 'exams' && (
            <Card>
              <CardHeader>
                <CardTitle>Exámenes Más Solicitados ({examStats.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {examStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay datos de exámenes en el rango de fechas seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Código</th>
                          <th className="text-left p-2">Examen</th>
                          <th className="text-right p-2">Cantidad</th>
                          <th className="text-right p-2">Ingresos (S/)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examStats.map((stat, index) => (
                          <tr key={stat.exam_id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">{stat.exam_code}</td>
                            <td className="p-2">{stat.exam_name}</td>
                            <td className="p-2 text-right font-semibold">{stat.count}</td>
                            <td className="p-2 text-right font-semibold text-green-600">S/ {stat.total_revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reporte de Ingresos por Fecha */}
          {reportType === 'revenue' && (
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Fecha</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay ingresos en el rango de fechas seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-right p-2">Órdenes</th>
                          <th className="text-right p-2">Exámenes</th>
                          <th className="text-right p-2">Ingresos (S/)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const dateGroups = new Map<string, { orders: number; revenue: number; exams: number }>();
                          orders.forEach(order => {
                            const date = order.order_date;
                            const existing = dateGroups.get(date);
                            if (existing) {
                              existing.orders++;
                              existing.revenue += order.total_amount;
                              existing.exams += order.items.length;
                            } else {
                              dateGroups.set(date, {
                                orders: 1,
                                revenue: order.total_amount,
                                exams: order.items.length
                              });
                            }
                          });
                          return Array.from(dateGroups.entries())
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([date, data]) => (
                              <tr key={date} className="border-b hover:bg-gray-50">
                                <td className="p-2">{formatDateOnly(date)}</td>
                                <td className="p-2 text-right">{data.orders}</td>
                                <td className="p-2 text-right">{data.exams}</td>
                                <td className="p-2 text-right font-semibold text-green-600">S/ {data.revenue.toFixed(2)}</td>
                              </tr>
                            ));
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={3} className="p-2 text-right">Total:</td>
                          <td className="p-2 text-right">S/ {stats.totalRevenue.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

