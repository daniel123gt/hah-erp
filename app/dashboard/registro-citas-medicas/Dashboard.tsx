import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { List, BarChart3, X, Calendar, Loader2 } from "lucide-react";
import { getTodayLocal } from "~/lib/dateUtils";
import { medicalAppointmentRecordsService, type MedicalAppointmentRecord } from "~/services/medicalAppointmentRecordsService";

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

export default function RegistroCitasMedicasDashboard() {
  const navigate = useNavigate();
  const [todayRecords, setTodayRecords] = useState<MedicalAppointmentRecord[]>([]);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getTodayLocal();
    const { from, to } = getMonthRange();
    setLoading(true);
    Promise.all([
      medicalAppointmentRecordsService.list({ fromDate: today, toDate: today, limit: 100 }),
      medicalAppointmentRecordsService.list({ fromDate: from, toDate: to, limit: 500 }),
    ])
      .then(([todayRes, monthRes]) => {
        setTodayRecords(todayRes.data);
        setMonthCount(monthRes.total ?? 0);
      })
      .catch(() => setTodayRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Listado",
      description: "Ver y editar registros de citas médicas completadas (ingreso, costo, notas)",
      icon: <List className="w-8 h-8 text-green-500" />,
      action: () => navigate("/registro-citas-medicas/listado"),
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Reportes",
      description: "Totales por período: ingreso, costo y utilidad",
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      action: () => navigate("/registro-citas-medicas/reportes"),
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ];

  const todayIngreso = todayRecords.reduce((s, r) => s + Number(r.ingreso ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro Citas Médicas</h1>
          <p className="text-gray-600 mt-1">
            Registro de citas médicas completadas para reportes de entradas y salidas
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <X className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayRecords.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos hoy (S/.)</p>
              <p className="text-2xl font-bold text-gray-900">{todayIngreso.toFixed(2)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-blue" />
            Citas médicas de hoy
          </h2>
          {todayRecords.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate("/registro-citas-medicas/listado")}>
              Ver listado
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando...
          </div>
        ) : todayRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No hay registros de citas médicas para hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Fecha</th>
                  <th className="text-left py-2 font-medium">Paciente</th>
                  <th className="text-left py-2 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Médico</th>
                  <th className="text-right py-2 font-medium">Ingreso (S/.)</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{r.fecha}</td>
                    <td className="py-2">{r.patient_name ?? "—"}</td>
                    <td className="py-2">{r.appointment_type ?? "—"}</td>
                    <td className="py-2">{r.doctor_name ?? "—"}</td>
                    <td className="py-2 text-right">S/ {Number(r.ingreso ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
