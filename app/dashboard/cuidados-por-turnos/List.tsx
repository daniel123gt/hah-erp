import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2, Search, Pencil, Trash2, Clock, Calendar, DollarSign } from "lucide-react";
import shiftCareService, { type CareShiftWithPatient, type CareShiftFilters } from "~/services/shiftCareService";
import { CareShiftModal } from "~/components/ui/care-shift-modal";
import { formatDateOnly } from "~/lib/utils";

function getPatientName(shift: CareShiftWithPatient): string {
  const p = shift.patient;
  if (!p) return "—";
  return Array.isArray(p) ? (p[0]?.name ?? "—") : (p?.name ?? "—");
}

export default function CuidadosPorTurnosList() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<CareShiftWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<CareShiftWithPatient | null>(null);
  const [statsToday, setStatsToday] = useState({ count: 0, revenue: 0 });
  const [statsMonth, setStatsMonth] = useState({ count: 0, revenue: 0 });

  const loadShifts = async () => {
    try {
      setLoading(true);
      const filters: CareShiftFilters = {};
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;
      const data = await shiftCareService.getShifts(filters);
      setShifts(data);
    } catch (error) {
      console.error("Error al cargar turnos:", error);
      toast.error("Error al cargar el registro de turnos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthFrom = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const monthTo = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
    Promise.all([
      shiftCareService.getShifts({ fecha_desde: today, fecha_hasta: today }),
      shiftCareService.getShifts({ fecha_desde: monthFrom, fecha_hasta: monthTo }),
    ])
      .then(([todayList, monthList]) => {
        setStatsToday({
          count: todayList.length,
          revenue: todayList.reduce((s, x) => s + (x.monto_a_pagar ?? 0), 0),
        });
        setStatsMonth({
          count: monthList.length,
          revenue: monthList.reduce((s, x) => s + (x.monto_a_pagar ?? 0), 0),
        });
      })
      .catch(() => {});
  }, []);

  const filteredShifts = shifts.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const patient = getPatientName(s).toLowerCase();
    const familiar = (s.familiar_responsable ?? "").toLowerCase();
    const enfermera = (s.enfermera ?? "").toLowerCase();
    const distrito = (s.distrito ?? "").toLowerCase();
    return (
      patient.includes(term) ||
      familiar.includes(term) ||
      enfermera.includes(term) ||
      distrito.includes(term)
    );
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este registro de turno?")) return;
    try {
      await shiftCareService.deleteShift(id);
      toast.success("Turno eliminado");
      loadShifts();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el turno");
    }
  };

  const totalMonto = filteredShifts.reduce((sum, s) => sum + (s.monto_a_pagar ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Cuidados por turnos
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditingShift(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar turno
        </Button>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Turnos hoy</p>
              <p className="text-2xl font-bold text-gray-900">{statsToday.count}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos hoy (S/.)</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsToday.revenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Turnos este mes</p>
              <p className="text-2xl font-bold text-gray-900">{statsMonth.count}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos del mes (S/.)</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsMonth.revenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de turnos eventuales</CardTitle>
          <p className="text-sm text-gray-500">
            Turnos por horas específicas (sin planes mensuales). Filtra por rango de fechas o busca por paciente, familiar, enfermera o distrito.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, familiar, enfermera o distrito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Desde</label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>

          {filteredShifts.length > 0 && (
            <p className="text-sm text-gray-600">
              Total en lista: S/ {totalMonto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Cargando...</span>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>
                {shifts.length === 0
                  ? "No hay turnos registrados. Usa «Registrar turno» para agregar uno."
                  : "No hay resultados para la búsqueda o el rango de fechas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora inicio</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Familiar responsable</TableHead>
                    <TableHead>Distrito</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead className="text-right">Monto (S/.)</TableHead>
                    <TableHead>Forma pago</TableHead>
                    <TableHead>N° operación</TableHead>
                    <TableHead>Enfermera</TableHead>
                    <TableHead className="text-right whitespace-nowrap sticky right-0 bg-muted z-10 min-w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((shift, index) => (
                    <TableRow key={shift.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>{formatDateOnly(shift.fecha)}</TableCell>
                      <TableCell>{shift.hora_inicio ?? "—"}</TableCell>
                      <TableCell className="font-medium">{getPatientName(shift)}</TableCell>
                      <TableCell>{shift.familiar_responsable ?? "—"}</TableCell>
                      <TableCell>{shift.distrito ?? "—"}</TableCell>
                      <TableCell>{shift.turno ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {shift.monto_a_pagar != null
                          ? shift.monto_a_pagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell>{shift.forma_de_pago ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{shift.numero_operacion ?? "—"}</TableCell>
                      <TableCell>{shift.enfermera ?? "—"}</TableCell>
                      <TableCell className="sticky right-0 bg-background z-10">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingShift(shift);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shift.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <CareShiftModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        shift={editingShift}
        onSaved={() => {
          loadShifts();
          setEditingShift(null);
        }}
        createShift={(data) => shiftCareService.createShift(data)}
        updateShift={(id, data) => shiftCareService.updateShift(id, data)}
      />
    </div>
  );
}
