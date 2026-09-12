import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, Eye, Ban, ClipboardList } from "lucide-react";
import labQuoteService, { type LabQuote, type LabQuoteStatus } from "~/services/labQuoteService";
import { ConvertQuoteModal } from "~/components/ui/convert-quote-modal";
import { formatDateOnly } from "~/lib/utils";

function statusBadge(status: LabQuoteStatus) {
  switch (status) {
    case "Pendiente":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
    case "Convertida":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Convertida</Badge>;
    case "Vencida":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Vencida</Badge>;
    case "Anulada":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Anulada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function CotizacionesLaboratorio() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<LabQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabQuoteStatus | "all">("all");

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await labQuoteService.getQuotes();
      setQuotes(data);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      toast.error("Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const filtered = quotes.filter((q) => {
    const matchSearch =
      !searchTerm.trim() ||
      q.quote_number.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      (q.observations || "").toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAnnul = async (quote: LabQuote) => {
    if (!confirm(`¿Anular la cotización ${quote.quote_number}?`)) return;
    try {
      await labQuoteService.annulQuote(quote.id);
      toast.success("Cotización anulada");
      loadQuotes();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo anular la cotización");
    }
  };

  const pendientes = quotes.filter((q) => q.status === "Pendiente").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary-blue" />
            Cotizaciones de Laboratorio
          </h1>
          <p className="text-gray-600 mt-1">
            Guarda cotizaciones sin datos del paciente y conviértelas en orden cuando confirmen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/laboratorio")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button onClick={() => navigate("/laboratorio/seleccionar")}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva cotización
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por número o nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LabQuoteStatus | "all")}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Convertida">Convertida</SelectItem>
                <SelectItem value="Vencida">Vencida</SelectItem>
                <SelectItem value="Anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {pendientes} pendiente{pendientes === 1 ? "" : "s"} · {quotes.length} en total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay cotizaciones para mostrar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Exámenes</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[140px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono font-medium">{q.quote_number}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateOnly(q.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{q.items.length} exámenes</span>
                          {q.observations && (
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">{q.observations}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        S/ {Number(q.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{statusBadge(q.status)}</TableCell>
                      <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex gap-2">
                          {q.status === "Pendiente" && (
                            <>
                              <ConvertQuoteModal quote={q} onConverted={loadQuotes} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleAnnul(q)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {q.status === "Convertida" && q.order_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/laboratorio/ordenes/${q.order_id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver orden
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
