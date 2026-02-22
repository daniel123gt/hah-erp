import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Label } from "~/components/ui/label";
import { medicalAppointmentRecordsService, type ReportResult } from "~/services/medicalAppointmentRecordsService";
import { formatDateOnly } from "~/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
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

function firstDayOfMonth(year: number, month: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0);
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-${day}`;
}

export default function ReportesRegistroCitasMedicas() {
  const navigate = useNavigate();
  const now = new Date();
  const [startDate, setStartDate] = useState(() =>
    firstDayOfMonth(now.getFullYear(), now.getMonth() + 1)
  );
  const [endDate, setEndDate] = useState(() => {
    const t = new Date();
    return t.toISOString().split("T")[0];
  });
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    medicalAppointmentRecordsService
      .getReport(startDate, endDate)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totals = report?.totals ?? null;
  const rows = report?.rows ?? [];

  type ChartTabId = "distribucion" | "evolucion" | "tipo_cita" | "registros";
  const [chartTab, setChartTab] = useState<ChartTabId>("distribucion");

  const chartDataByDate = useMemo(() => {
    if (!rows.length) return [];
    const map = new Map<string, { ingreso: number; costo: number; utilidad: number; registros: number }>();
    rows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      const cur = map.get(d) || { ingreso: 0, costo: 0, utilidad: 0, registros: 0 };
      cur.ingreso += r.ingreso;
      cur.costo += r.costo;
      cur.utilidad += r.utility;
      cur.registros += 1;
      map.set(d, cur);
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, label: formatDateOnly(date, "es-PE"), ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const chartDataTopRecords = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.utility - a.utility)
      .slice(0, 15)
      .map((r, i) => ({
        name: `#${i + 1} ${formatDateOnly(r.fecha, "es-PE")} ${(r.appointment_type ?? "").slice(0, 18)}${(r.appointment_type?.length ?? 0) > 18 ? "…" : ""}`,
        utilidad: r.utility,
        total: r.ingreso,
      }));
  }, [rows]);

  const tipoCitaStats = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const name = r.appointment_type ?? "Sin tipo";
      map.set(name, (map.get(name) ?? 0) + r.ingreso);
    });
    return Array.from(map.entries())
      .map(([appointment_type, total_ingreso]) => ({ appointment_type, total_ingreso }))
      .sort((a, b) => b.total_ingreso - a.total_ingreso);
  }, [rows]);

  const CHART_COLORS = ["#2563eb", "#16a34a", "#0891b2", "#dc2626", "#ea580c", "#7c3aed", "#db2777", "#64748b"];

  const handleExportCSV = () => {
    const headers = "Fecha,Paciente,Tipo cita,Médico,Ingreso (S/.),Costo (S/.),Utilidad (S/.)\n";
    const csvRows = rows.map((r) =>
      [
        formatDateOnly(r.fecha, "es-PE"),
        `"${(r.patient_name ?? "").replace(/"/g, '""')}"`,
        `"${(r.appointment_type ?? "").replace(/"/g, '""')}"`,
        `"${(r.doctor_name ?? "").replace(/"/g, '""')}"`,
        r.ingreso.toFixed(2),
        r.costo.toFixed(2),
        r.utility.toFixed(2),
      ].join(",")
    );
    const csvContent = headers + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-citas-medicas-${startDate}-${endDate}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("Reporte exportado");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" onClick={() => navigate("/registro-citas-medicas")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reportes - Registro Citas Médicas</h1>
          </div>
          <p className="text-gray-600">Ingreso, costo y utilidad por rango de fechas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros del reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Ingreso total</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {(totals?.total_ingreso ?? 0).toFixed(2)}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Costo total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_costo ?? 0).toFixed(2)}
                  </p>
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
                <FileText className="w-8 h-8 text-slate-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Utilidad</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_utilidad ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totals?.total_records ?? 0} registros
                  </p>
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
                <TrendingUp className="w-8 h-8 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      )}

      {!loading && (
        <>
          <div className="flex border-b border-gray-200 gap-0">
            {(
              [
                { id: "distribucion" as ChartTabId, label: "Distribución (Costo / Utilidad)" },
                { id: "evolucion" as ChartTabId, label: "Evolución en el tiempo" },
                { id: "tipo_cita" as ChartTabId, label: "Composición por tipo de cita" },
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
                        <Bar dataKey="costo" name="Costo" stackId="a" fill="#f59e0b" />
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
                        <Area type="monotone" dataKey="costo" name="Costo" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === "tipo_cita" && (
                <div className="h-[320px] flex items-center justify-center">
                  {tipoCitaStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos por tipo de cita en el rango.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tipoCitaStats.slice(0, 8).map((p) => ({
                            name: p.appointment_type.length > 25 ? p.appointment_type.slice(0, 25) + "…" : p.appointment_type,
                            value: p.total_ingreso,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius="40%"
                          outerRadius="70%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {tipoCitaStats.slice(0, 8).map((_, i) => (
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
                  {chartDataTopRecords.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay registros en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataTopRecords} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
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
        </>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
            <p className="text-gray-600">Generando reporte...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Detalle del período</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros en el rango seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo cita</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead className="text-right">Ingreso (S/.)</TableHead>
                      <TableHead className="text-right">Costo (S/.)</TableHead>
                      <TableHead className="text-right">Utilidad (S/.)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateOnly(r.fecha, "es-PE")}
                        </TableCell>
                        <TableCell>{r.patient_name}</TableCell>
                        <TableCell>{r.appointment_type}</TableCell>
                        <TableCell>{r.doctor_name ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.ingreso.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.costo.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-green-600">
                          {r.utility.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
