import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  procedureService,
  type ProcedureRecordWithDetails,
  type ProcedureCatalogItem,
} from "~/services/procedureService";
import { patientsService } from "~/services/patientsService";
import { AddProcedureModal } from "~/components/ui/add-procedure-modal";
import { EditProcedureModal } from "~/components/ui/edit-procedure-modal";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
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

export default function ListadoProcedimientos() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProcedureRecordWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [editRecord, setEditRecord] = useState<ProcedureRecordWithDetails | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await procedureService.getRecords({
        page,
        limit,
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setRecords(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar el listado");
    } finally {
      setLoading(false);
    }
  }, [page, search, fromDate, toDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleCreated = () => {
    loadRecords();
  };

  const handleUpdated = () => {
    setEditRecord(null);
    loadRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro de procedimiento?")) return;
    try {
      await procedureService.deleteRecord(id);
      toast.success("Registro eliminado");
      loadRecords();
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listado de Procedimientos</h1>
          <p className="text-gray-600 mt-1">Registro de procedimientos realizados, ingresos y ganancias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/procedimientos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <AddProcedureModal onCreated={handleCreated} />
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por paciente, procedimiento, distrito..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
            <span className="ml-2">Cargando...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay registros. Agregue un procedimiento para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead className="text-right">Ingreso (S/.)</TableHead>
                  <TableHead className="text-right">Material</TableHead>
                  <TableHead className="text-right">Combustible</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-right whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
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
                      <TableCell className="text-right">{ing.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(r.gastos_material || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(r.combustible || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">{util.toFixed(2)}</TableCell>
                      <TableCell className="text-right sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/procedimientos/listado/${r.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditRecord(r)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(r.id)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages} ({total} registros)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {editRecord && (
        <EditProcedureModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
