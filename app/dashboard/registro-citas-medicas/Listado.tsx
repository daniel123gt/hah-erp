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
  medicalAppointmentRecordsService,
  type MedicalAppointmentRecord,
} from "~/services/medicalAppointmentRecordsService";
import { formatDateOnly } from "~/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Loader2,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EditMedicalRecordModal } from "~/components/ui/edit-medical-record-modal";
import { AddMedicalRecordModal } from "~/components/ui/add-medical-record-modal";

export default function ListadoRegistroCitasMedicas() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalAppointmentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [editRecord, setEditRecord] = useState<MedicalAppointmentRecord | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await medicalAppointmentRecordsService.list({
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

  const handleUpdated = () => {
    setEditRecord(null);
    loadRecords();
  };

  const handleCreated = () => {
    loadRecords();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listado - Registro Citas Médicas</h1>
          <p className="text-gray-600 mt-1">Registro de citas médicas completadas (ingreso, costo, notas)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/registro-citas-medicas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <AddMedicalRecordModal onCreated={handleCreated} />
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por paciente, médico, tipo..."
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

      <Card className="px-4 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mr-2" />
            <span>Cargando...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay registros. Las citas médicas completadas se registran aquí automáticamente.
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
                  <TableHead className="text-right w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => {
                  const ingreso = Number(r.ingreso ?? 0);
                  const costo = Number(r.costo ?? 0);
                  const utilidad = ingreso - costo;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateOnly(r.fecha)}
                      </TableCell>
                      <TableCell>{r.patient_name ?? "—"}</TableCell>
                      <TableCell>{r.appointment_type ?? "—"}</TableCell>
                      <TableCell>{r.doctor_name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{ingreso.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{costo.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-600">{utilidad.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditRecord(r)}
                          title="Editar ingreso/costo/notas"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
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
        <EditMedicalRecordModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
