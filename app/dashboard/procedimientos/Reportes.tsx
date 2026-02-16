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
import { procedureService, type ProcedureRecordWithDetails, type ProcedureCatalogItem } from "~/services/procedureService";
import { ArrowLeft, Loader2 } from "lucide-react";

function totalIngreso(r: ProcedureRecordWithDetails): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [totals, setTotals] = useState<{
    ingresoTotal: number;
    materiales: number;
    movilidad: number;
  } | null>(null);
  const [records, setRecords] = useState<ProcedureRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = firstDayOfMonth(year, month);
    const to = lastDayOfMonth(year, month);
    setLoading(true);
    Promise.all([
      procedureService.getReportTotals(from, to),
      procedureService.getRecords({ fromDate: from, toDate: to, limit: 500 }),
    ])
      .then(([totalsData, recordsRes]) => {
        setTotals(totalsData);
        setRecords(recordsRes.data);
      })
      .catch(() => {
        setTotals({ ingresoTotal: 0, materiales: 0, movilidad: 0 });
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const totalEgresos = (totals?.materiales ?? 0) + (totals?.movilidad ?? 0);
  const saldoFinal = (totals?.ingresoTotal ?? 0) - totalEgresos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Procedimientos</h1>
          <p className="text-gray-600 mt-1">Cierre mensual: ingresos, egresos y saldo</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/procedimientos")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mes</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 min-w-[140px]"
                >
                  {MESES.map((nombre, i) => (
                    <option key={i} value={i + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Año</label>
                <Input
                  type="number"
                  min={2020}
                  max={2030}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || year)}
                  className="w-24"
                />
              </div>
            </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
          <span className="ml-2">Cargando...</span>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="bg-[#e91e8c]/10 border-b border-[#e91e8c]/20 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">
              CIERRE {MESES[month - 1]?.toUpperCase()}, {year}
            </h2>
          </div>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-gray-700 font-medium">INGRESO TOTAL: S/. {(totals?.ingresoTotal ?? 0).toFixed(2)}</p>
            </div>

            <div>
              <p className="text-gray-700 font-medium mb-3">EGRESOS:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex justify-between items-center max-w-md">
                  <span className="text-gray-600">MATERIALES: S/.</span>
                  <span className="font-medium tabular-nums">{(totals?.materiales ?? 0).toFixed(2)}</span>
                </li>
                <li className="flex justify-between items-center max-w-md">
                  <span className="text-gray-600">MOVILIDAD: S/.</span>
                  <span className="font-medium tabular-nums">{(totals?.movilidad ?? 0).toFixed(2)}</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t-2 border-gray-200">
              <p className="text-gray-700 font-medium">
                TOTAL EGRESOS: S/. {totalEgresos.toFixed(2)}
              </p>
            </div>

            <div className="pt-2 border-t-2 border-gray-300">
              <p className="text-lg font-bold text-gray-900">
                SALDO FINAL: S/. {saldoFinal.toFixed(2)}
              </p>
            </div>

            {/* Listado de procedimientos del mes */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Procedimientos del mes</h3>
              {records.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay registros en este período.</p>
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
                        <TableHead className="text-right">Utilidad (S/.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => {
                        const ing = totalIngreso(r);
                        const util = r.utilidad ?? ing - Number(r.gastos_material || 0) - Number(r.combustible || 0);
                        const displayName = (r.patient as { name?: string } | null)?.name ?? r.patient_name ?? "-";
                        const procName = (r.procedure_catalog as ProcedureCatalogItem | null)?.name ?? r.procedure_name ?? "-";
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(r.fecha).toLocaleDateString("es-PE")}
                            </TableCell>
                            <TableCell>{displayName}</TableCell>
                            <TableCell>{procName}</TableCell>
                            <TableCell>{r.district ?? "-"}</TableCell>
                            <TableCell className="text-right tabular-nums">{ing.toFixed(2)}</TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">{util.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
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
