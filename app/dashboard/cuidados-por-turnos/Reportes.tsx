import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import shiftCareService, { type CareShiftWithPatient } from "~/services/shiftCareService";
import { formatDateOnly } from "~/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  Clock,
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

function getPatientName(shift: CareShiftWithPatient): string {
  const p = shift.patient;
  if (!p) return "—";
  return Array.isArray(p) ? (p[0]?.name ?? "—") : (p?.name ?? "—");
}

export default function CuidadosPorTurnosReportes() {
  const navigate = useNavigate();
  const now = new Date();
  const [startDate, setStartDate] = useState(() => firstDayOfMonth(now.getFullYear(), now.getMonth() + 1));
  const [endDate, setEndDate] = useState(() => now.toISOString().split("T")[0]);
  const [dbReport, setDbReport] = useState<{
    totals: { total_revenue: number; total_shifts: number; promedio: number };
    rows: Array<{
      id: string;
      fecha: string;
      hora_inicio: string | null;
      patient_name: string;
      distrito: string | null;
      turno: string | null;
      monto_a_pagar: number;
      enfermera: string | null;
      forma_de_pago: string | null;
    }>;
  } | null>(null);
  const [shifts, setShifts] = useState<CareShiftWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      shiftCareService.getReportCuidadosPorTurnos(startDate, endDate),
      shiftCareService.getShifts({ fecha_desde: startDate, fecha_hasta: endDate }),
    ])
      .then(([report, list]) => {
        setDbReport(report);
        setShifts(list);
      })
      .catch(() => {
        setDbReport(null);
        setShifts([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totals = dbReport?.totals ?? null;
  const totalRevenue = totals ? totals.total_revenue : shifts.reduce((s, x) => s + (x.monto_a_pagar ?? 0), 0);
  const totalShifts = totals ? totals.total_shifts : shifts.length;
  const promedio = totals ? totals.promedio : (totalShifts ? totalRevenue / totalShifts : 0);

  const reportRows = dbReport?.rows ?? [];

  type ChartTabId = "distribucion" | "evolucion" | "pacientes" | "turnos";
  const [chartTab, setChartTab] = useState<ChartTabId>("distribucion");

  const chartDataByDate = useMemo(() => {
    if (!reportRows.length) return [];
    const map = new Map<string, { ingreso: number; turnos: number }>();
    reportRows.forEach((r) => {
      const d = String(r.fecha).trim().slice(0, 10);
      const cur = map.get(d) || { ingreso: 0, turnos: 0 };
      cur.ingreso += Number(r.monto_a_pagar ?? 0);
      cur.turnos += 1;
      map.set(d, cur);
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, label: formatDateOnly(date, "es-PE"), ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [reportRows]);

  const chartDataTopTurnos = useMemo(() => {
    return [...reportRows]
      .sort((a, b) => Number(b.monto_a_pagar ?? 0) - Number(a.monto_a_pagar ?? 0))
      .slice(0, 15)
      .map((r, i) => ({
        name: `#${i + 1} ${formatDateOnly(r.fecha, "es-PE")} ${(r.patient_name ?? "").slice(0, 15)}${(r.patient_name?.length ?? 0) > 15 ? "…" : ""}`,
        monto: Number(r.monto_a_pagar ?? 0),
      }));
  }, [reportRows]);

  const patientStats = useMemo(() => {
    const map = new Map<string, number>();
    reportRows.forEach((r) => {
      const name = r.patient_name ?? "Sin nombre";
      map.set(name, (map.get(name) ?? 0) + Number(r.monto_a_pagar ?? 0));
    });
    return Array.from(map.entries())
      .map(([patient_name, total_ingreso]) => ({ patient_name, total_ingreso }))
      .sort((a, b) => b.total_ingreso - a.total_ingreso);
  }, [reportRows]);

  const CHART_COLORS = ["#2563eb", "#16a34a", "#0891b2", "#dc2626", "#ea580c", "#7c3aed", "#db2777", "#64748b"];

  const handleExportCSV = () => {
    const headers = "Fecha,Hora,Paciente,Distrito,Turno,Monto (S/.),Enfermera,Forma de pago\n";
    let rows: string[];
    if (dbReport?.rows?.length) {
      rows = dbReport.rows.map((r) => {
        const fecha = formatDateOnly(r.fecha, "es-PE");
        return `"${fecha}","${r.hora_inicio ?? ""}","${r.patient_name ?? ""}","${r.distrito ?? ""}","${r.turno ?? ""}",${Number(r.monto_a_pagar ?? 0).toFixed(2)},"${r.enfermera ?? ""}","${r.forma_de_pago ?? ""}"`;
      });
    } else {
      rows = shifts.map((s) => {
        const patient = getPatientName(s);
        const fecha = formatDateOnly(s.fecha, "es-PE");
        return `"${fecha}","${s.hora_inicio ?? ""}","${patient}","${s.distrito ?? ""}","${s.turno ?? ""}",${Number(s.monto_a_pagar ?? 0).toFixed(2)},"${s.enfermera ?? ""}","${s.forma_de_pago ?? ""}"`;
      });
    }
    const csvContent = headers + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-cuidados-por-turnos-${startDate}-${endDate}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("Reporte exportado exitosamente");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" onClick={() => navigate("/cuidados-por-turnos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Cuidados por turnos</h1>
          </div>
          <p className="text-gray-600">Turnos realizados e ingresos por rango de fechas</p>
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
          </div>
        </CardContent>
      </Card>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Ingresos del período</p>
                  <p className="text-2xl font-bold text-green-600">S/ {totalRevenue.toFixed(2)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Turnos realizados</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
                  {chartDataByDate.length > 0 && (
                    <div className="h-9 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataByDate} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="turnos" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <Clock className="w-8 h-8 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Rango</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDateOnly(startDate, "es-PE")} – {formatDateOnly(endDate, "es-PE")}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-amber-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Promedio por turno</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {promedio.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && (dbReport?.rows?.length ?? shifts.length) > 0 && (
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
                { id: "distribucion" as ChartTabId, label: "Distribución por fecha" },
                { id: "evolucion" as ChartTabId, label: "Evolución en el tiempo" },
                { id: "pacientes" as ChartTabId, label: "Composición por paciente" },
                { id: "turnos" as ChartTabId, label: "Top turnos por monto" },
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
                        <Bar dataKey="ingreso" name="Ingresos (S/.)" fill="#16a34a" />
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
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/ ${v}`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number, name: string) => [name === "turnos" ? v : `S/ ${Number(v).toFixed(2)}`, name === "turnos" ? "Turnos" : "Ingresos"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="ingreso" name="Ingresos" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                        <Area yAxisId="right" type="monotone" dataKey="turnos" name="Turnos" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
              {chartTab === "pacientes" && (
                <div className="h-[320px] flex items-center justify-center">
                  {patientStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay datos por paciente en el rango.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={patientStats.slice(0, 8).map((p) => ({
                            name: p.patient_name.length > 25 ? p.patient_name.slice(0, 25) + "…" : p.patient_name,
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
                          {patientStats.slice(0, 8).map((_, i) => (
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
              {chartTab === "turnos" && (
                <div className="h-[320px]">
                  {chartDataTopTurnos.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No hay turnos en el rango seleccionado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataTopTurnos} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, "Monto"]} />
                        <Legend />
                        <Bar dataKey="monto" name="Monto (S/.)" fill="#16a34a" radius={[0, 4, 4, 0]} />
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
            <CardTitle>Turnos del período ({(dbReport?.rows?.length ?? shifts.length)})</CardTitle>
          </CardHeader>
          <CardContent>
            {(dbReport?.rows?.length ?? shifts.length) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay turnos registrados en este período.</p>
              </div>
            ) : dbReport?.rows?.length ? (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Distrito</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Monto (S/.)</TableHead>
                      <TableHead>Enfermera</TableHead>
                      <TableHead>Forma de pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbReport.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateOnly(r.fecha, "es-PE")}
                        </TableCell>
                        <TableCell>{r.hora_inicio ?? "—"}</TableCell>
                        <TableCell>{r.patient_name || "—"}</TableCell>
                        <TableCell>{r.distrito ?? "—"}</TableCell>
                        <TableCell>{r.turno ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(r.monto_a_pagar ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{r.enfermera ?? "—"}</TableCell>
                        <TableCell>{r.forma_de_pago ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-t-2 font-bold bg-gray-50">
                      <TableCell colSpan={5} className="text-right">Total:</TableCell>
                      <TableCell className="text-right tabular-nums">
                        S/ {(dbReport.totals.total_revenue ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Distrito</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Monto (S/.)</TableHead>
                      <TableHead>Enfermera</TableHead>
                      <TableHead>Forma de pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateOnly(s.fecha, "es-PE")}
                        </TableCell>
                        <TableCell>{s.hora_inicio ?? "—"}</TableCell>
                        <TableCell>{getPatientName(s)}</TableCell>
                        <TableCell>{s.distrito ?? "—"}</TableCell>
                        <TableCell>{s.turno ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(s.monto_a_pagar ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{s.enfermera ?? "—"}</TableCell>
                        <TableCell>{s.forma_de_pago ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-t-2 font-bold bg-gray-50">
                      <TableCell colSpan={5} className="text-right">Total:</TableCell>
                      <TableCell className="text-right tabular-nums">S/ {totalRevenue.toFixed(2)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
