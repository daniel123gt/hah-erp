import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { procedureService, type ProcedureRecordWithDetails, type ProcedureCatalogItem } from "~/services/procedureService";
import { formatDateOnly } from "~/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  Package,
  Fuel,
} from "lucide-react";

function totalIngreso(r: ProcedureRecordWithDetails): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

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

export default function ProcedimientosReportes() {
  const navigate = useNavigate();
  const now = new Date();
  const [startDate, setStartDate] = useState(() => firstDayOfMonth(now.getFullYear(), now.getMonth() + 1));
  const [endDate, setEndDate] = useState(() => {
    const t = new Date();
    return t.toISOString().split("T")[0];
  });
  const [dbReport, setDbReport] = useState<{
    totals: {
      total_records: number;
      total_ingreso: number;
      total_materiales: number;
      total_movilidad: number;
      total_costo: number;
      total_utilidad: number;
    };
    rows: Array<{
      id: string;
      fecha: string;
      patient_name: string;
      procedure_name: string;
      district: string | null;
      ingreso: number;
      costo: number;
      utility: number;
    }>;
  } | null>(null);
  const [records, setRecords] = useState<ProcedureRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      procedureService.getReportProcedimientos(startDate, endDate),
      procedureService.getRecords({ fromDate: startDate, toDate: endDate, limit: 5000 }),
    ])
      .then(([reportFromDb, recordsRes]) => {
        setDbReport(reportFromDb);
        setRecords(recordsRes.data);
      })
      .catch(() => {
        setDbReport(null);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totals = dbReport?.totals ?? null;
  const fallbackIngreso = records.reduce((s, r) => s + totalIngreso(r), 0);
  const fallbackMateriales = records.reduce((s, r) => s + Number(r.gastos_material ?? 0), 0);
  const fallbackMovilidad = records.reduce((s, r) => s + Number(r.combustible ?? 0), 0);
  const fallbackUtilidad = records.reduce((s, r) => {
    const ing = totalIngreso(r);
    const proc = r.procedure_catalog as ProcedureCatalogItem | null;
    const costo = proc ? Number(proc.total_cost_soles ?? 0) : 0;
    return s + (ing - costo - Number(r.gastos_material ?? 0) - Number(r.combustible ?? 0));
  }, 0);
  const fallbackCosto = records.reduce((s, r) => {
    const proc = r.procedure_catalog as ProcedureCatalogItem | null;
    const costoCat = proc ? Number(proc.total_cost_soles ?? 0) : 0;
    return s + costoCat + Number(r.gastos_material ?? 0) + Number(r.combustible ?? 0) + Number(r.costo_adicional_servicio ?? 0);
  }, 0);
  const totalEgresos = totals ? (totals.total_materiales + totals.total_movilidad) : (fallbackMateriales + fallbackMovilidad);
  const saldoFinal = totals ? Number(totals.total_utilidad ?? 0) : fallbackUtilidad;
  const displayRecordsCount = totals?.total_records ?? records.length;

  const handleExportCSV = () => {
    const headers = "Fecha,Paciente,Procedimiento,Distrito,Ingreso (S/.),Costo (S/.),Utilidad (S/.)\n";
    let rows: string[];
    if (dbReport?.rows?.length) {
      rows = dbReport.rows.map((r) => {
        const fecha = formatDateOnly(r.fecha, "es-PE");
        return `"${fecha}","${r.patient_name ?? ""}","${r.procedure_name ?? ""}","${r.district ?? ""}",${r.ingreso.toFixed(2)},${r.costo.toFixed(2)},${r.utility.toFixed(2)}`;
      });
    } else {
      rows = records.map((r) => {
        const ing = totalIngreso(r);
        const proc = r.procedure_catalog as ProcedureCatalogItem | null;
        const costo = proc ? Number(proc.total_cost_soles ?? 0) : 0;
        const materialExtra = Number(r.gastos_material ?? 0);
        const combustible = Number(r.combustible ?? 0);
        const util = ing - costo - materialExtra - combustible;
        const displayName = (r.patient as { name?: string } | null)?.name ?? r.patient_name ?? "-";
        const procName = proc?.name ?? r.procedure_name ?? "-";
        const fecha = formatDateOnly(r.fecha, "es-PE");
        return `"${fecha}","${displayName}","${procName}","${r.district ?? ""}",${ing.toFixed(2)},${costo.toFixed(2)},${util.toFixed(2)}`;
      });
    }
    const csvContent = headers + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-procedimientos-${startDate}-${endDate}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("Reporte exportado exitosamente");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header (mismo estilo que laboratorio) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" onClick={() => navigate("/procedimientos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Procedimientos</h1>
          </div>
          <p className="text-gray-600">Ingresos, egresos y saldo por rango de fechas</p>
        </div>
      </div>

      {/* Filtros del Reporte (mismo estilo que laboratorio) */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Resumen general: 5 cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingreso Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {(totals?.total_ingreso ?? fallbackIngreso).toFixed(2)}
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
                  <p className="text-sm font-medium text-gray-600">Gastos material y honorarios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_costo ?? fallbackCosto).toFixed(2)}
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
                  <p className="text-sm font-medium text-gray-600">Materiales extras</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_materiales ?? fallbackMateriales).toFixed(2)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Combustible</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {(totals?.total_movilidad ?? fallbackMovilidad).toFixed(2)}
                  </p>
                </div>
                <Fuel className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo Final</p>
                  <p className="text-2xl font-bold text-gray-900">
                    S/ {saldoFinal.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {displayRecordsCount} registros en el período
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón Exportar CSV */}
      {!loading && (dbReport?.rows?.length ?? records.length) > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      )}

      {/* Contenido del reporte */}
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-600">Ingreso total</span>
                <span className="font-semibold tabular-nums">S/ {(totals?.total_ingreso ?? fallbackIngreso).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-600">Total egresos</span>
                <span className="font-semibold tabular-nums">S/ {totalEgresos.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
              <span className="text-gray-700 font-medium">Saldo final</span>
              <span className="text-lg font-bold tabular-nums">S/ {saldoFinal.toFixed(2)}</span>
            </div>

            {/* Listado de procedimientos del período */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Procedimientos del período ({dbReport?.rows?.length ?? records.length})</h3>
              {(dbReport?.rows?.length ?? records.length) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay registros en este período.</p>
                </div>
              ) : dbReport?.rows?.length ? (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Procedimiento</TableHead>
                        <TableHead>Distrito</TableHead>
                        <TableHead className="text-right">Ingreso (S/.)</TableHead>
                        <TableHead className="text-right">Costo (S/.)</TableHead>
                        <TableHead className="text-right">Utilidad (S/.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbReport.rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateOnly(r.fecha, "es-PE")}
                          </TableCell>
                          <TableCell>{r.patient_name || "-"}</TableCell>
                          <TableCell>{r.procedure_name || "-"}</TableCell>
                          <TableCell>{r.district ?? "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.ingreso.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.costo.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums text-green-600">{r.utility.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <TableRow className="border-t-2 font-bold bg-gray-50">
                        <TableCell colSpan={4} className="text-right">
                          Total:
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          S/ {(dbReport.totals.total_ingreso ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          S/ {(dbReport.totals.total_costo ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-green-600">
                          S/ {(dbReport.totals.total_utilidad ?? 0).toFixed(2)}
                        </TableCell>
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
                        <TableHead>Paciente</TableHead>
                        <TableHead>Procedimiento</TableHead>
                        <TableHead>Distrito</TableHead>
                        <TableHead className="text-right">Ingreso (S/.)</TableHead>
                        <TableHead className="text-right">Costo (S/.)</TableHead>
                        <TableHead className="text-right">Utilidad (S/.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => {
                        const ing = totalIngreso(r);
                        const proc = r.procedure_catalog as ProcedureCatalogItem | null;
                        const costo = proc ? Number(proc.total_cost_soles ?? 0) : 0;
                        const materialExtra = Number(r.gastos_material ?? 0);
                        const combustible = Number(r.combustible ?? 0);
                        const util = ing - costo - materialExtra - combustible;
                        const displayName = (r.patient as { name?: string } | null)?.name ?? r.patient_name ?? "-";
                        const procName = proc?.name ?? r.procedure_name ?? "-";
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDateOnly(r.fecha, "es-PE")}
                            </TableCell>
                            <TableCell>{displayName}</TableCell>
                            <TableCell>{procName}</TableCell>
                            <TableCell>{r.district ?? "-"}</TableCell>
                            <TableCell className="text-right tabular-nums">{ing.toFixed(2)}</TableCell>
                            <TableCell className="text-right tabular-nums">{costo.toFixed(2)}</TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">{util.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <tfoot>
                      <TableRow className="border-t-2 font-bold bg-gray-50">
                        <TableCell colSpan={4} className="text-right">
                          Total:
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          S/ {records.reduce((s, r) => s + totalIngreso(r), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          S/ {records.reduce((s, r) => {
                            const proc = r.procedure_catalog as ProcedureCatalogItem | null;
                            const costo = proc ? Number(proc.total_cost_soles ?? 0) : 0;
                            return s + costo;
                          }, 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-green-600">
                          S/ {fallbackUtilidad.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
