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
  expensesService,
  MOVILIDAD_TYPES,
  EXPENSE_PAYMENT_METHODS,
  movilidadTypeLabel,
  type Expense,
} from "~/services/expensesService";
import { formatDateOnly } from "~/lib/utils";
import { AddMovilidadExpenseModal } from "~/components/ui/add-movilidad-expense-modal";
import { EditMovilidadExpenseModal } from "~/components/ui/edit-movilidad-expense-modal";
import { useInfiniteScroll, InfiniteScrollFooter } from "~/components/ui/infinite-scroll";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, Pencil, Trash2, Car } from "lucide-react";

function paymentLabel(v: string | null | undefined): string {
  const found = EXPENSE_PAYMENT_METHODS.find((m) => m.value === v);
  return found ? found.label : v || "—";
}

export default function MovilidadEgresos() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPage = useCallback(async (targetPage: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const res = await expensesService.list({
        category: "movilidad",
        page: targetPage,
        limit,
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        type: typeFilter || undefined,
      });
      setRecords((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      if (!append) toast.error("Error al cargar los egresos");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [limit, search, fromDate, toDate, typeFilter]);

  // Carga inicial y reinicio (vuelve al inicio) cuando cambian filtros o búsqueda.
  useEffect(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  // Total de egresos del filtro actual.
  useEffect(() => {
    expensesService
      .getTotal({ category: "movilidad", fromDate: fromDate || undefined, toDate: toDate || undefined })
      .then(setTotalAmount)
      .catch(() => setTotalAmount(0));
  }, [fromDate, toDate, total]);

  const hasMore = records.length < total;
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadPage(next, true);
  }, [loading, loadingMore, hasMore, page, loadPage]);
  const sentinelRef = useInfiniteScroll(loadMore, {
    hasMore,
    loading: loading || loadingMore,
    deps: [records.length],
  });

  const refresh = useCallback(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  const handleCreated = () => refresh();
  const handleUpdated = () => {
    setEditExpense(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este egreso?")) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      await expensesService.remove(id);
      toast.success("Egreso eliminado");
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-7 h-7 text-primary-blue" />
            Egresos — Movilidad
          </h1>
          <p className="text-gray-600 mt-1">Taxis, combustible, mantenimiento del vehículo y otros gastos de movilidad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/egresos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <AddMovilidadExpenseModal onCreated={handleCreated} />
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">Total de egresos (según fechas del filtro)</p>
          <p className="text-2xl font-bold text-red-600">S/ {totalAmount.toFixed(2)}</p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por descripción, comprobante, notas..."
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md min-w-[160px]"
          >
            <option value="">Tipo: Todos</option>
            {MOVILIDAD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="px-4 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
            <span className="ml-2">Cargando...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay egresos registrados. Agregue uno para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>N° operación</TableHead>
                  <TableHead className="text-right">Monto (S/.)</TableHead>
                  <TableHead className="text-right whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDateOnly(r.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">
                        {movilidadTypeLabel(r.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.description || "—"}</TableCell>
                    <TableCell className="text-sm">{paymentLabel(r.payment_method)}</TableCell>
                    <TableCell className="text-sm">{r.numero_operacion || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-red-600">
                      {Number(r.amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditExpense(r)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && (
          <InfiniteScrollFooter
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            shown={records.length}
            total={total}
            itemLabel="egresos"
          />
        )}
      </Card>

      {editExpense && (
        <EditMovilidadExpenseModal
          expense={editExpense}
          onClose={() => setEditExpense(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
