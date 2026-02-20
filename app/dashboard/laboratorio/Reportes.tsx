import { useState, useEffect, useMemo } from 'react';
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
import { procedureService } from "~/services/procedureService";
import { formatDateOnly } from "~/lib/utils";
import { getExams } from "~/services/labService";
import { toast } from "sonner";

const TOMA_DE_MUESTRA_NAME = "toma de muestra";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  const [reportType, setReportType] = useState<'summary' | 'exams'>('summary');
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
  const [dbReport, setDbReport] = useState<{
    totals: { total_orders: number; total_revenue: number; total_exams: number; total_cost: number; total_utility: number };
    rows: Array<{ id: string; order_date: string; physician_name: string | null; status: string; n_items: number; total_amount: number; cost: number; utility: number }>;
  } | null>(null);
  const [tomaMuestraProcedure, setTomaMuestraProcedure] = useState<{ base_price_soles: number; total_cost_soles: number } | null>(null);
  type ChartTabId = 'distribucion' | 'evolucion' | 'examenes' | 'ordenes';
  const [chartTab, setChartTab] = useState<ChartTabId>('distribucion');

  /** Reporte de BD filtrado por estado (Resumen y Órdenes detalladas usan esto) */
  const filteredReport = useMemo(() => {
    if (!dbReport) return null;
    if (statusFilter === 'all') return dbReport;
    const rows = dbReport.rows.filter((r) => r.status === statusFilter);
    return {
      totals: {
        total_orders: rows.length,
        total_revenue: rows.reduce((s, r) => s + r.total_amount, 0),
        total_exams: rows.reduce((s, r) => s + r.n_items, 0),
        total_cost: rows.reduce((s, r) => s + r.cost, 0),
        total_utility: rows.reduce((s, r) => s + r.utility, 0),
      },
      rows,
    };
  }, [dbReport, statusFilter]);

  /** Datos agregados por fecha (para gráficas y sparklines) */
  const chartDataByDate = useMemo(() => {
    const rows = filteredReport?.rows ?? [];
    if (!rows.length) return [];
    const map = new Map<string, { ingreso: number; costo: number; utilidad: number; orders: number; examenes: number }>();
    rows.forEach((r) => {
      const d = String(r.order_date).trim().slice(0, 10);
      const cur = map.get(d) || { ingreso: 0, costo: 0, utilidad: 0, orders: 0, examenes: 0 };
      cur.ingreso += r.total_amount;
      cur.costo += r.cost;
      cur.utilidad += r.utility;
      cur.orders += 1;
      cur.examenes += r.n_items ?? 0;
      map.set(d, cur);
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, label: formatDateOnly(date), ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredReport?.rows]);

  /** Top órdenes por utilidad (para gráfica de barras horizontales) */
  const chartDataTopOrders = useMemo(() => {
    const rows = filteredReport?.rows ?? [];
    return [...rows]
      .sort((a, b) => b.utility - a.utility)
      .slice(0, 15)
      .map((r, i) => ({
        name: `#${i + 1} ${formatDateOnly(r.order_date)}`,
        utilidad: r.utility,
        total: r.total_amount,
      }));
  }, [filteredReport?.rows]);

  /** Colores para donut (exámenes) */
  const CHART_COLORS = ['#2563eb', '#16a34a', '#0891b2', '#dc2626', '#ea580c', '#7c3aed', '#db2777', '#64748b'];

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Completado":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "En Proceso":
      case "En toma de muestra":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Cancelado":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const loadReportData = async () => {
    try {
      setIsLoading(true);

      const [reportFromDb, procedure] = await Promise.all([
        labOrderService.getReportLaboratorio(startDate, endDate),
        procedureService.getProcedureByName(TOMA_DE_MUESTRA_NAME),
      ]);
      setDbReport(reportFromDb);
      setTomaMuestraProcedure(procedure);

      const result = await labOrderService.getAllOrders({
        page: 1,
        limit: 10000,
        status: statusFilter !== 'all' ? statusFilter as any : undefined
      });

      const filteredOrders = result.data.filter(order => {
        const orderDateStr = String(order.order_date).trim().slice(0, 10);
        return orderDateStr >= startDate && orderDateStr <= endDate;
      });

      setOrders(filteredOrders);

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
    
    if (reportType === 'summary') {
      if (filteredReport?.rows?.length) {
        csvContent = 'ID, Fecha, Médico, Estado, Exámenes, Total (S/.), Costo (S/.), Utilidad (S/.)\n';
        filteredReport.rows.forEach(row => {
          csvContent += `${row.id.slice(0, 8)}, ${row.order_date}, ${row.physician_name || 'N/A'}, ${row.status}, ${row.n_items}, ${row.total_amount.toFixed(2)}, ${row.cost.toFixed(2)}, ${row.utility.toFixed(2)}\n`;
        });
      } else {
        const recargo = tomaMuestraProcedure?.base_price_soles ?? 0;
        const costoToma = tomaMuestraProcedure?.total_cost_soles ?? 0;
        csvContent = 'ID, Fecha, Paciente ID, Médico, Estado, Prioridad, Total (S/.), Costo (S/.), Utilidad (S/.), # Exámenes\n';
        orders.forEach(order => {
          const cost = order.items.length > 0 ? (order.total_amount - recargo) / 1.2 + costoToma : 0;
          const utility = order.total_amount - cost;
          csvContent += `${order.id.slice(0, 8)}, ${order.order_date}, ${order.patient_id.slice(0, 8)}, ${order.physician_name || 'N/A'}, ${order.status}, ${order.priority}, ${order.total_amount.toFixed(2)}, ${cost.toFixed(2)}, ${utility.toFixed(2)}, ${order.items.length}\n`;
        });
      }
    } else if (reportType === 'exams') {
      csvContent = 'Código, Examen, Cantidad, Ingresos (S/)\n';
      examStats.forEach(stat => {
        csvContent += `${stat.exam_code}, "${stat.exam_name}", ${stat.count}, ${stat.total_revenue.toFixed(2)}\n`;
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
                  <SelectItem value="exams">Exámenes Más Solicitados</SelectItem>
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

      {/* Resumen General (datos por BD: órdenes pagadas, con costo y utilidad) */}
      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredReport?.totals?.total_orders ?? stats.totalOrders}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <FileText className="w-8 h-8 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-600">S/ {(filteredReport?.totals?.total_revenue ?? stats.totalRevenue).toFixed(2)}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="ingreso" stroke="#16a34a" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Exámenes</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredReport?.totals?.total_exams ?? stats.totalExams}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="examenes" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <FileCheck className="w-8 h-8 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Costo total</p>
                  <p className="text-2xl font-bold text-gray-900">S/ {(filteredReport?.totals?.total_cost ?? 0).toFixed(2)}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="costo" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <FileText className="w-8 h-8 text-amber-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Utilidad</p>
                  <p className="text-2xl font-bold text-green-600">S/ {(filteredReport?.totals?.total_utility ?? 0).toFixed(2)}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="utilidad" stroke="#16a34a" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón de Exportar */}
      {(reportType === 'summary' || reportType === 'exams') && (
        <div className="flex justify-end">
          <Button
            onClick={handleExportCSV}
            disabled={isLoading || (reportType === 'summary' ? (filteredReport?.rows?.length ?? orders.length) === 0 : examStats.length === 0)}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      )}

      {/* Tabs de gráficas (solo en Resumen General, sin loading) */}
      {reportType === 'summary' && !isLoading && (
        <>
          <div className="flex border-b border-gray-200 gap-0">
            {([
              { id: 'distribucion' as ChartTabId, label: 'Distribución (Costo / Utilidad)' },
              { id: 'evolucion' as ChartTabId, label: 'Evolución en el tiempo' },
              { id: 'examenes' as ChartTabId, label: 'Composición por exámenes' },
              { id: 'ordenes' as ChartTabId, label: 'Top órdenes por utilidad' },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChartTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  chartTab === tab.id
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              {chartTab === 'distribucion' && (
                <div className="h-[320px]">
                  {chartDataByDate.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByDate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, '']} labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                        <Legend />
                        <Bar dataKey="costo" name="Costo" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="utilidad" name="Utilidad" stackId="a" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === 'evolucion' && (
                <div className="h-[320px]">
                  {chartDataByDate.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDataByDate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, '']} labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                        <Legend />
                        <Area type="monotone" dataKey="ingreso" name="Ingresos" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="costo" name="Costo" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === 'examenes' && (
                <div className="h-[320px] flex items-center justify-center">
                  {examStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos de exámenes en el rango.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={examStats.slice(0, 8).map((e) => ({ name: e.exam_name.length > 25 ? e.exam_name.slice(0, 25) + '…' : e.exam_name, value: e.total_revenue }))}
                          cx="50%"
                          cy="50%"
                          innerRadius="40%"
                          outerRadius="70%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {examStats.slice(0, 8).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, 'Ingresos']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === 'ordenes' && (
                <div className="h-[320px]">
                  {chartDataTopOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay órdenes en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataTopOrders} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, '']} />
                        <Legend />
                        <Bar dataKey="utilidad" name="Utilidad (S/.)" fill="#16a34a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
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
          {/* Resumen General: tabla de órdenes (debajo de los cards) */}
          {reportType === 'summary' && (
            <Card>
              <CardHeader>
                <CardTitle>Órdenes ({filteredReport?.rows?.length ?? orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {(filteredReport?.rows?.length ?? 0) === 0 && orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay órdenes en el rango de fechas seleccionado</p>
                  </div>
                ) : (filteredReport?.rows?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-left p-2">Médico</th>
                          <th className="text-left p-2">Estado</th>
                          <th className="text-right p-2">Exámenes</th>
                          <th className="text-right p-2">Total (S/.)</th>
                          <th className="text-right p-2">Costo (S/.)</th>
                          <th className="text-right p-2">Utilidad (S/.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReport.rows.map((row) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">{row.id.slice(0, 8)}</td>
                            <td className="p-2">{formatDateOnly(row.order_date)}</td>
                            <td className="p-2">{row.physician_name || '-'}</td>
                            <td className="p-2">
                              <Badge variant="secondary" className={getStatusBadgeClassName(row.status)}>
                                {row.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{row.n_items}</td>
                            <td className="p-2 text-right">S/ {row.total_amount.toFixed(2)}</td>
                            <td className="p-2 text-right text-gray-600">S/ {row.cost.toFixed(2)}</td>
                            <td className="p-2 text-right font-semibold text-green-600">S/ {row.utility.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={5} className="p-2 text-right">Total:</td>
                          <td className="p-2 text-right">S/ {(filteredReport.totals.total_revenue ?? 0).toFixed(2)}</td>
                          <td className="p-2 text-right">S/ {(filteredReport.totals.total_cost ?? 0).toFixed(2)}</td>
                          <td className="p-2 text-right text-green-600">S/ {(filteredReport.totals.total_utility ?? 0).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (() => {
                  const recargo = tomaMuestraProcedure?.base_price_soles ?? 0;
                  const costoToma = tomaMuestraProcedure?.total_cost_soles ?? 0;
                  const orderCosts = orders.map((order) => {
                    const cost = order.items.length > 0
                      ? (order.total_amount - recargo) / 1.2 + costoToma
                      : 0;
                    return { cost, utility: order.total_amount - cost };
                  });
                  const totalCost = orderCosts.reduce((s, o) => s + o.cost, 0);
                  const totalUtility = orderCosts.reduce((s, o) => s + o.utility, 0);
                  return (
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
                            <th className="text-right p-2">Total (S/.)</th>
                            <th className="text-right p-2">Costo (S/.)</th>
                            <th className="text-right p-2">Utilidad (S/.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, idx) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
                              <td className="p-2">{formatDateOnly(order.order_date)}</td>
                              <td className="p-2">{order.physician_name || '-'}</td>
                              <td className="p-2">
                                <Badge variant="secondary" className={getStatusBadgeClassName(order.status)}>
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
                              <td className="p-2 text-right text-gray-600">S/ {orderCosts[idx].cost.toFixed(2)}</td>
                              <td className="p-2 text-right font-semibold text-green-600">S/ {orderCosts[idx].utility.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold">
                            <td colSpan={6} className="p-2 text-right">Total:</td>
                            <td className="p-2 text-right">S/ {stats.totalRevenue.toFixed(2)}</td>
                            <td className="p-2 text-right">S/ {totalCost.toFixed(2)}</td>
                            <td className="p-2 text-right text-green-600">S/ {totalUtility.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })())}
              </CardContent>
            </Card>
          )}

          {/* Exámenes Más Solicitados */}
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
        </>
      )}
    </div>
  );
}

