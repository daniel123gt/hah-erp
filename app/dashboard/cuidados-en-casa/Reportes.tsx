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
import homeCareService, { type HomeCarePeriod } from "~/services/homeCareService";
import { formatDateOnly } from "~/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  Building2,
} from "lucide-react";

function firstDayOfMonth(year: number, month: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

type PeriodWithContract = HomeCarePeriod & {
  contract?: { patient_id: string; patient?: { name: string } | null } | null;
  home_care_contracts?: { patient_id: string; patient?: { name: string } | null } | null;
};

function getPatientName(period: PeriodWithContract): string {
  const c = period.contract ?? period.home_care_contracts;
  const p = c?.patient;
  if (!p) return "—";
  return Array.isArray(p) ? (p[0]?.name ?? "—") : (p?.name ?? "—");
}

export default function CuidadosEnCasaReportes() {
  const navigate = useNavigate();
  const now = new Date();
  const [startDate, setStartDate] = useState(() => firstDayOfMonth(now.getFullYear(), now.getMonth() + 1));
  const [endDate, setEndDate] = useState(() => now.toISOString().split("T")[0]);
  const [dbReport, setDbReport] = useState<{
    totals: { total_revenue: number; total_periods: number; promedio: number };
    rows: Array<{
      id: string;
      fecha_pago: string | null;
      patient_name: string;
      turno: string | null;
      f_desde: string;
      f_hasta: string;
      monto_total: number;
      metodo_pago: string | null;
    }>;
  } | null>(null);
  const [periods, setPeriods] = useState<PeriodWithContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      homeCareService.getReportCuidadosEnCasa(startDate, endDate),
      homeCareService.getPeriodsInRange(startDate, endDate),
    ])
      .then(([report, list]) => {
        setDbReport(report);
        setPeriods(list as PeriodWithContract[]);
      })
      .catch(() => {
        setDbReport(null);
        setPeriods([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totals = dbReport?.totals ?? null;
  const revenue = totals?.total_revenue ?? periods.reduce((s, p) => s + Number(p.monto_total ?? 0), 0);
  const totalPeriods = totals?.total_periods ?? periods.length;
  const promedio = totals ? totals.promedio : (totalPeriods ? revenue / totalPeriods : 0);

  const handleExportCSV = () => {
    const headers = "Fecha pago,Paciente,Quincena,F.Desde,F.Hasta,Monto total,Método pago\n";
    let rows: string[];
    if (dbReport?.rows?.length) {
      rows = dbReport.rows.map((r) => {
        const fechaPago = r.fecha_pago ? formatDateOnly(r.fecha_pago, "es-PE") : "";
        return `"${fechaPago}","${r.patient_name ?? ""}","${r.turno ?? ""}","${r.f_desde ?? ""}","${r.f_hasta ?? ""}",${Number(r.monto_total ?? 0).toFixed(2)},"${r.metodo_pago ?? ""}"`;
      });
    } else {
      rows = periods.map((p) => {
        const patient = getPatientName(p);
        const fechaPago = p.fecha_pago ? formatDateOnly(p.fecha_pago, "es-PE") : "";
        return `"${fechaPago}","${patient}","${p.turno ?? ""}","${p.f_desde ?? ""}","${p.f_hasta ?? ""}",${Number(p.monto_total ?? 0).toFixed(2)},"${p.metodo_pago ?? ""}"`;
      });
    }
    const csvContent = headers + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-cuidados-en-casa-${startDate}-${endDate}.csv`;
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
            <Button variant="outline" onClick={() => navigate("/cuidados-en-casa")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Cuidados en casa</h1>
          </div>
          <p className="text-gray-600">Ingresos por pagos quincenales por rango de fechas</p>
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
                  <p className="text-2xl font-bold text-green-600">S/ {revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagos registrados</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPeriods}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
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
                <Building2 className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio por pago</p>
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

      {!loading && (dbReport?.rows?.length ?? periods.length) > 0 && (
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
            <CardTitle>Pagos del período ({(dbReport?.rows?.length ?? periods.length)})</CardTitle>
          </CardHeader>
          <CardContent>
            {(dbReport?.rows?.length ?? periods.length) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay pagos registrados en este período.</p>
              </div>
            ) : dbReport?.rows?.length ? (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha pago</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Turno / Quincena</TableHead>
                      <TableHead>F. Desde</TableHead>
                      <TableHead>F. Hasta</TableHead>
                      <TableHead className="text-right">Monto total (S/.)</TableHead>
                      <TableHead>Método pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbReport.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {r.fecha_pago ? formatDateOnly(r.fecha_pago, "es-PE") : "—"}
                        </TableCell>
                        <TableCell>{r.patient_name || "—"}</TableCell>
                        <TableCell>{r.turno ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.f_desde ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.f_hasta ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(r.monto_total ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{r.metodo_pago ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-t-2 font-bold bg-gray-50">
                      <TableCell colSpan={5} className="text-right">Total:</TableCell>
                      <TableCell className="text-right tabular-nums">
                        S/ {(dbReport.totals.total_revenue ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha pago</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Turno / Quincena</TableHead>
                      <TableHead>F. Desde</TableHead>
                      <TableHead>F. Hasta</TableHead>
                      <TableHead className="text-right">Monto total (S/.)</TableHead>
                      <TableHead>Método pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {p.fecha_pago ? formatDateOnly(p.fecha_pago, "es-PE") : "—"}
                        </TableCell>
                        <TableCell>{getPatientName(p)}</TableCell>
                        <TableCell>{p.turno ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{p.f_desde ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{p.f_hasta ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(p.monto_total ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{p.metodo_pago ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-t-2 font-bold bg-gray-50">
                      <TableCell colSpan={5} className="text-right">Total:</TableCell>
                      <TableCell className="text-right tabular-nums">S/ {revenue.toFixed(2)}</TableCell>
                      <TableCell />
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
