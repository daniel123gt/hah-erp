import { useState, useEffect } from "react";
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
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingreso total</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {(totals?.total_ingreso ?? 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_costo ?? 0).toFixed(2)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilidad</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_utilidad ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totals?.total_records ?? 0} registros
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
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
