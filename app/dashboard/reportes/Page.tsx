import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import labOrderService from "~/services/labOrderService";
import { procedureService } from "~/services/procedureService";
import shiftCareService from "~/services/shiftCareService";
import { formatDateOnly } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BarChart3,
  DollarSign,
  Loader2,
  FlaskConical,
  ClipboardList,
  Clock,
  ChevronRight,
  Download,
  FileText,
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

export type EstadoFilterValue = "todos" | "pendientes" | "completados";

export type ReportRowOrigin = "Laboratorio" | "Procedimientos" | "Cuidados por turnos";

export interface ReportConsolidatedRow {
  id: string;
  fecha: string;
  origen: ReportRowOrigin;
  detalle: string;
  paciente: string;
  monto: number;
  egresos: number;
  utilidad: number;
}

function firstDayOfMonth(year: number, month: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

function buildConsolidatedRowsFromReports(
  labRows: Array<{ id: string; order_date: string; physician_name: string | null; patient_name: string | null; n_items: number; total_amount: number; cost: number; utility: number }>,
  procRows: Array<{ id: string; fecha: string; patient_name: string; procedure_name: string; ingreso: number; costo: number; utility: number }>,
  shiftRows: Array<{ id: string; fecha: string; patient_name: string; turno: string | null; monto_a_pagar: number }>
): ReportConsolidatedRow[] {
  const rows: ReportConsolidatedRow[] = [];

  labRows.forEach((r) => {
    const fecha = String(r.order_date).trim().slice(0, 10);
    const pacienteLab = (r.patient_name && r.patient_name !== "—") ? r.patient_name : (r.physician_name ?? "—");
    rows.push({
      id: `lab-${r.id}`,
      fecha,
      origen: "Laboratorio",
      detalle: `Orden ${r.id.slice(0, 8)} · ${r.n_items} exám.${r.physician_name ? ` · ${r.physician_name}` : ""}`,
      paciente: pacienteLab,
      monto: Number(r.total_amount ?? 0),
      egresos: Number(r.cost ?? 0),
      utilidad: Number(r.utility ?? 0),
    });
  });

  procRows.forEach((r) => {
    rows.push({
      id: `proc-${r.id}`,
      fecha: String(r.fecha).trim().slice(0, 10),
      origen: "Procedimientos",
      detalle: r.procedure_name ?? "Procedimiento",
      paciente: r.patient_name ?? "—",
      monto: Number(r.ingreso ?? 0),
      egresos: Number(r.costo ?? 0),
      utilidad: Number(r.utility ?? 0),
    });
  });

  shiftRows.forEach((r) => {
    rows.push({
      id: `shift-${r.id}`,
      fecha: String(r.fecha).trim().slice(0, 10),
      origen: "Cuidados por turnos",
      detalle: r.turno ? `Turno ${r.turno}` : "Turno",
      paciente: r.patient_name ?? "—",
      monto: Number(r.monto_a_pagar ?? 0),
      egresos: 0,
      utilidad: Number(r.monto_a_pagar ?? 0),
    });
  });

  rows.sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
    return a.origen.localeCompare(b.origen);
  });
  return rows;
}

const LAB_STATUS_PENDIENTES = ["Pendiente", "En toma de muestra", "En Proceso"];

function filterLabRowsByEstado(
  rows: Array<{ status: string }>,
  estado: EstadoFilterValue
): typeof rows {
  const sinCancelado = rows.filter((r) => r.status !== "Cancelado");
  if (estado === "todos") return sinCancelado;
  if (estado === "pendientes") return sinCancelado.filter((r) => LAB_STATUS_PENDIENTES.includes(r.status));
  if (estado === "completados") return sinCancelado.filter((r) => r.status === "Completado");
  return sinCancelado;
}

function filterProcRowsByEstado(
  rows: Array<{ ingreso: number }>,
  estado: EstadoFilterValue
): typeof rows {
  if (estado === "todos") return rows;
  if (estado === "pendientes") return rows.filter((r) => Number(r.ingreso ?? 0) === 0);
  if (estado === "completados") return rows.filter((r) => Number(r.ingreso ?? 0) > 0);
  return rows;
}

export default function ReportesPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(() => firstDayOfMonth(now.getFullYear(), now.getMonth() + 1));
  const [endDate, setEndDate] = useState(() => now.toISOString().split("T")[0]);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [labReport, setLabReport] = useState<Awaited<ReturnType<typeof labOrderService.getReportLaboratorio>> | null>(null);
  const [procReport, setProcReport] = useState<Awaited<ReturnType<typeof procedureService.getReportProcedimientos>> | null>(null);
  const [shiftReport, setShiftReport] = useState<Awaited<ReturnType<typeof shiftCareService.getReportCuidadosPorTurnos>> | null>(null);
  const [tableRows, setTableRows] = useState<ReportConsolidatedRow[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      labOrderService.getReportLaboratorio(startDate, endDate),
      procedureService.getReportProcedimientos(startDate, endDate),
      shiftCareService.getReportCuidadosPorTurnos(startDate, endDate),
    ])
      .then(([lab, proc, shift]) => {
        setLabReport(lab);
        setProcReport(proc);
        setShiftReport(shift);
        const labRows = filterLabRowsByEstado(lab.rows ?? [], "todos");
        const procRows = filterProcRowsByEstado(proc.rows ?? [], "todos");
        const rows = buildConsolidatedRowsFromReports(labRows, procRows, shift.rows ?? []);
        setTableRows(rows);
      })
      .catch(() => {
        setLabReport(null);
        setProcReport(null);
        setShiftReport(null);
        setTableRows([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const labRowsRaw = labReport?.rows ?? [];
  const procRowsRaw = procReport?.rows ?? [];
  const shiftRowsRaw = shiftReport?.rows ?? [];
  const filteredLabRows = filterLabRowsByEstado(labRowsRaw, estadoFilter);
  const filteredProcRows = filterProcRowsByEstado(procRowsRaw, estadoFilter);
  const displayRows =
    labReport && procReport && shiftReport
      ? buildConsolidatedRowsFromReports(filteredLabRows, filteredProcRows, shiftRowsRaw)
      : tableRows;

  const labRevenue = filteredLabRows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
  const labCost = filteredLabRows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const labUtility = filteredLabRows.reduce((s, r) => s + Number(r.utility ?? 0), 0);
  const procedureRevenue = filteredProcRows.reduce((s, r) => s + Number(r.ingreso ?? 0), 0);
  const procedureCost = filteredProcRows.reduce((s, r) => s + Number(r.costo ?? 0), 0);
  const procedureUtility = filteredProcRows.reduce((s, r) => s + Number(r.utility ?? 0), 0);
  const shiftRevenue = shiftRowsRaw.reduce((s, r) => s + Number(r.monto_a_pagar ?? 0), 0);
  const shiftCost = 0;
  const shiftUtility = shiftRevenue;

  const totalRevenue = labRevenue + procedureRevenue + shiftRevenue;
  const totalEgresos = labCost + procedureCost + shiftCost;
  const totalUtilidad = labUtility + procedureUtility + shiftUtility;
  const periodLabel = `${formatDateOnly(startDate, "es-PE")} – ${formatDateOnly(endDate, "es-PE")}`;

  const tableTotalMonto = displayRows.reduce((s, r) => s + r.monto, 0);
  const tableTotalEgresos = displayRows.reduce((s, r) => s + r.egresos, 0);
  const tableTotalUtilidad = displayRows.reduce((s, r) => s + r.utilidad, 0);

  type ChartTabId = "distribucion" | "evolucion" | "origen" | "registros";
  const [chartTab, setChartTab] = useState<ChartTabId>("distribucion");

  const chartDataByDate = useMemo(() => {
    if (!displayRows.length) return [];
    const map = new Map<string, { ingreso: number; costo: number; utilidad: number; registros: number }>();
    displayRows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      const cur = map.get(d) || { ingreso: 0, costo: 0, utilidad: 0, registros: 0 };
      cur.ingreso += r.monto;
      cur.costo += r.egresos;
      cur.utilidad += r.utilidad;
      cur.registros += 1;
      map.set(d, cur);
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, label: formatDateOnly(date, "es-PE"), ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [displayRows]);

  const chartDataByDateLab = useMemo(() => {
    const labRows = displayRows.filter((r) => r.origen === "Laboratorio");
    if (!labRows.length) return [];
    const map = new Map<string, number>();
    labRows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + r.monto);
    });
    return chartDataByDate.map(({ date, label }) => ({ date, label, monto: map.get(date) ?? 0 }));
  }, [displayRows, chartDataByDate]);

  const chartDataByDateProc = useMemo(() => {
    const procRows = displayRows.filter((r) => r.origen === "Procedimientos");
    if (!procRows.length) return [];
    const map = new Map<string, number>();
    procRows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + r.monto);
    });
    return chartDataByDate.map(({ date, label }) => ({ date, label, monto: map.get(date) ?? 0 }));
  }, [displayRows, chartDataByDate]);

  const chartDataByDateShift = useMemo(() => {
    const shiftRows = displayRows.filter((r) => r.origen === "Cuidados por turnos");
    if (!shiftRows.length) return [];
    const map = new Map<string, number>();
    shiftRows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + r.monto);
    });
    return chartDataByDate.map(({ date, label }) => ({ date, label, monto: map.get(date) ?? 0 }));
  }, [displayRows, chartDataByDate]);

  const chartDataTopRows = useMemo(() => {
    return [...displayRows]
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, 15)
      .map((r, i) => ({
        name: `#${i + 1} ${formatDateOnly(r.fecha, "es-PE")} ${r.origen.slice(0, 8)} ${(r.detalle ?? "").slice(0, 12)}${(r.detalle?.length ?? 0) > 12 ? "…" : ""}`,
        utilidad: r.utilidad,
        monto: r.monto,
      }));
  }, [displayRows]);

  const originStats = useMemo(() => {
    const map = new Map<string, number>();
    displayRows.forEach((r) => {
      map.set(r.origen, (map.get(r.origen) ?? 0) + r.monto);
    });
    return Array.from(map.entries()).map(([origen, total_ingreso]) => ({ origen, total_ingreso }));
  }, [displayRows]);

  const CHART_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#db2777", "#64748b"];

  const handleExportCSV = () => {
    const headers = "Fecha,Origen,Detalle,Paciente,Monto (S/.),Egresos (S/.),Utilidad (S/.)\n";
    const csvRows = displayRows.map((r) =>
      [`"${formatDateOnly(r.fecha, "es-PE")}"`, `"${r.origen}"`, `"${r.detalle}"`, `"${r.paciente}"`, r.monto.toFixed(2), r.egresos.toFixed(2), r.utilidad.toFixed(2)].join(",")
    );
    const blob = new Blob([headers + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-consolidado-${startDate}-${endDate}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const origenBadgeClass = (origen: ReportRowOrigin) => {
    switch (origen) {
      case "Laboratorio":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Procedimientos":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cuidados por turnos":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-blue" />
            Reportes y Análisis
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen de ingresos: Laboratorio, Procedimientos y Cuidados por turnos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as EstadoFilterValue)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendientes">Pendientes</SelectItem>
                  <SelectItem value="completados">Completados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
            <p className="text-gray-600">Generando reporte...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary-blue/5 border-primary-blue/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total consolidado</p>
                    <p className="text-2xl font-bold text-gray-900">S/ {totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Egresos: S/ {totalEgresos.toFixed(2)} · Utilidad: S/ {totalUtilidad.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
                    {chartDataByDate.length > 0 && (
                      <div className="h-9 w-full mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="ingreso" stroke="#2563eb" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <DollarSign className="w-8 h-8 text-primary-blue shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Laboratorio</p>
                    <p className="text-2xl font-bold text-gray-900">S/ {labRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Egresos: S/ {labCost.toFixed(2)} · Utilidad: S/ {labUtility.toFixed(2)}</p>
                    {chartDataByDateLab.length > 0 && (
                      <div className="h-9 w-full mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartDataByDateLab} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="monto" stroke="#2563eb" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <FlaskConical className="w-8 h-8 text-blue-500 shrink-0" />
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between" asChild>
                  <Link to="/laboratorio/reportes">
                    Ver reporte
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Procedimientos</p>
                    <p className="text-2xl font-bold text-gray-900">S/ {procedureRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Egresos: S/ {procedureCost.toFixed(2)} · Utilidad: S/ {procedureUtility.toFixed(2)}</p>
                    {chartDataByDateProc.length > 0 && (
                      <div className="h-9 w-full mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartDataByDateProc} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="monto" stroke="#16a34a" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <ClipboardList className="w-8 h-8 text-green-500 shrink-0" />
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between" asChild>
                  <Link to="/procedimientos/reportes">
                    Ver reporte
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Cuidados por turnos</p>
                    <p className="text-2xl font-bold text-gray-900">S/ {shiftRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Utilidad: S/ {shiftUtility.toFixed(2)}</p>
                    {chartDataByDateShift.length > 0 && (
                      <div className="h-9 w-full mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartDataByDateShift} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="monto" stroke="#ea580c" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between" asChild>
                  <Link to="/cuidados-por-turnos/reportes">
                    Ver reporte
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {displayRows.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar tabla CSV
              </Button>
            </div>
          )}

          <div className="flex border-b border-gray-200 gap-0">
            {(
              [
                { id: "distribucion" as ChartTabId, label: "Distribución (Costo / Utilidad)" },
                { id: "evolucion" as ChartTabId, label: "Evolución en el tiempo" },
                { id: "origen" as ChartTabId, label: "Composición por origen" },
                { id: "registros" as ChartTabId, label: "Top registros por utilidad" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChartTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  chartTab === tab.id
                    ? "border-primary-blue text-primary-blue"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              {chartTab === "distribucion" && (
                <div className="h-[320px]">
                  {chartDataByDate.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByDate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, ""]} labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                        <Legend />
                        <Bar dataKey="costo" name="Egresos" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="utilidad" name="Utilidad" stackId="a" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === "evolucion" && (
                <div className="h-[320px]">
                  {chartDataByDate.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDataByDate} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, ""]} labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                        <Legend />
                        <Area type="monotone" dataKey="ingreso" name="Ingresos" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="costo" name="Egresos" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === "origen" && (
                <div className="h-[320px] flex items-center justify-center">
                  {originStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos por origen en el rango.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={originStats.map((o) => ({ name: o.origen, value: o.total_ingreso }))}
                          cx="50%"
                          cy="50%"
                          innerRadius="40%"
                          outerRadius="70%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {originStats.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, "Ingresos"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === "registros" && (
                <div className="h-[320px]">
                  {chartDataTopRows.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay registros en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataTopRows} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, ""]} />
                        <Legend />
                        <Bar dataKey="utilidad" name="Utilidad (S/.)" fill="#16a34a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-blue" />
                Detalle consolidado ({displayRows.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayRows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay registros en este período para los tres servicios.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <div className="flex items-center justify-end gap-6 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm">
                    <span className="text-gray-600">Total Monto: <strong className="tabular-nums">S/ {tableTotalMonto.toFixed(2)}</strong></span>
                    <span className="text-gray-600">Egresos: <strong className="tabular-nums">S/ {tableTotalEgresos.toFixed(2)}</strong></span>
                    <span className="text-green-600 font-medium">Utilidad: <strong className="tabular-nums">S/ {tableTotalUtilidad.toFixed(2)}</strong></span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead>Paciente / Referente</TableHead>
                        <TableHead className="text-right">Monto (S/.)</TableHead>
                        <TableHead className="text-right">Egresos (S/.)</TableHead>
                        <TableHead className="text-right">Utilidad (S/.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateOnly(row.fecha, "es-PE")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={origenBadgeClass(row.origen)}>
                              {row.origen}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate" title={row.detalle}>
                            {row.detalle}
                          </TableCell>
                          <TableCell>{row.paciente}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {row.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-gray-600">
                            {row.egresos.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-green-600">
                            {row.utilidad.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Los ingresos del reporte general corresponden únicamente a: <strong>Laboratorio</strong>, <strong>Procedimientos</strong> y <strong>Cuidados por turnos</strong>. No incluye Cuidados en casa.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500">Laboratorio: S/ {labRevenue.toFixed(2)}</span>
                <span className="text-gray-400">+</span>
                <span className="text-gray-500">Procedimientos: S/ {procedureRevenue.toFixed(2)}</span>
                <span className="text-gray-400">+</span>
                <span className="text-gray-500">Cuidados por turnos: S/ {shiftRevenue.toFixed(2)}</span>
                <span className="text-gray-400">=</span>
                <span className="font-semibold text-gray-900">Total: S/ {totalRevenue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
