import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { BookOpen, List, X, BarChart3, Calendar, Loader2 } from "lucide-react";
import { getTodayLocal } from "~/lib/dateUtils";
import { procedureService, type ProcedureRecordWithDetails } from "~/services/procedureService";

function totalIngreso(r: ProcedureRecordWithDetails): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

export default function ProcedimientosDashboard() {
  const navigate = useNavigate();
  const [todayRecords, setTodayRecords] = useState<ProcedureRecordWithDetails[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [catalogCount, setCatalogCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);

  useEffect(() => {
    const today = getTodayLocal();
    const { from, to } = getMonthRange();
    setLoadingRecords(true);
    Promise.all([
      procedureService.getRecords({ fromDate: today, toDate: today, limit: 100 }),
      procedureService.getCatalog(true),
      procedureService.getRecords({ fromDate: from, toDate: to, limit: 500 }),
    ])
      .then(([todayRes, catalog, monthRes]) => {
        setTodayRecords(todayRes.data);
        setCatalogCount(catalog.length);
        setMonthCount(monthRes.data.length);
      })
      .catch(() => setTodayRecords([]))
      .finally(() => setLoadingRecords(false));
  }, []);

  const cards = [
    {
      title: "Catálogo de Procedimientos",
      description: "Ver procedimientos con costo y materiales utilizados",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      action: () => navigate("/procedimientos/catalogo"),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      title: "Listado de Procedimientos",
      description: "Registrar, editar y ver procedimientos realizados (entrada/salida y ganancias)",
      icon: <List className="w-8 h-8 text-green-500" />,
      action: () => navigate("/procedimientos/listado"),
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Reportes",
      description: "Cierre mensual: ingreso total, egresos (diezmo, materiales, movilidad, laboratorio) y saldo final",
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      action: () => navigate("/procedimientos/reportes"),
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procedimientos de Enfermería</h1>
          <p className="text-gray-600 mt-1">
            Catálogo de procedimientos y registro de atenciones
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <X className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Procedimientos hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayRecords.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos hoy (S/.)</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayRecords.reduce((s, r) => s + totalIngreso(r), 0).toFixed(2)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En catálogo</p>
              <p className="text-2xl font-bold text-gray-900">{catalogCount}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registros este mes</p>
              <p className="text-2xl font-bold text-gray-900">{monthCount}</p>
            </div>
            <List className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`p-6 cursor-pointer transition-colors ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {card.icon}
              <div>
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla resumen: Procedimientos de hoy */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-blue" />
            Procedimientos de hoy
          </h2>
          {todayRecords.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate("/procedimientos/listado")}>
              Ver listado
            </Button>
          )}
        </div>
        {loadingRecords ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando...
          </div>
        ) : todayRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No hay procedimientos registrados para hoy.</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayRecords.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate("/procedimientos/listado")}
                  >
                    <TableCell>{r.fecha}</TableCell>
                    <TableCell>{r.patient_name ?? r.patient?.name ?? "—"}</TableCell>
                    <TableCell>{r.procedure_name ?? "—"}</TableCell>
                    <TableCell>{r.district ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      S/ {totalIngreso(r).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
