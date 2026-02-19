import { useState, useEffect } from "react";
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
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos del período</p>
                  <p className="text-2xl font-bold text-green-600">S/ {totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Turnos realizados</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rango</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDateOnly(startDate, "es-PE")} – {formatDateOnly(endDate, "es-PE")}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio por turno</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {promedio.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
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
