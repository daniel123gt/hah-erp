import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Calendar, Stethoscope, HeartPulse, ArrowLeft, Loader2 } from "lucide-react";
import { getTodayLocal } from "~/lib/dateUtils";
import { appointmentsService } from "~/services/appointmentsService";

interface TodayCitaRow {
  id: string;
  hora: string;
  paciente: string;
  profesional: string;
  tipo: string;
  estado: string;
  variant: "medicina" | "procedimientos";
}

export default function CitasHome() {
  const navigate = useNavigate();
  const [todayCitas, setTodayCitas] = useState<TodayCitaRow[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCitas(true);
    Promise.all([
      appointmentsService.list("medicina"),
      appointmentsService.list("procedimientos"),
    ])
      .then(([med, proc]) => {
        if (cancelled) return;
        const today = getTodayLocal();
        const fromMed = med
          .filter((c) => c.date === today)
          .map((c) => ({
            id: c.id,
            hora: c.time,
            paciente: c.patientName,
            profesional: c.doctorName,
            tipo: c.type,
            estado: c.status,
            variant: "medicina" as const,
          }));
        const fromProc = proc
          .filter((c) => c.date === today)
          .map((c) => ({
            id: c.id,
            hora: c.time,
            paciente: c.patientName,
            profesional: c.doctorName,
            tipo: c.procedure_name || c.type,
            estado: c.status,
            variant: "procedimientos" as const,
          }));
        const combined = [...fromMed, ...fromProc].sort((a, b) =>
          (a.hora || "").localeCompare(b.hora || "")
        );
        setTodayCitas(combined);
      })
      .catch(() => {
        if (!cancelled) setTodayCitas([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCitas(false);
      });
    return () => { cancelled = true; };
  }, []);

  const cards = [
    {
      title: "Citas Procedimientos",
      description: "Agenda de citas a domicilio con enfermeras (procedimientos de enfermería)",
      icon: <HeartPulse className="w-8 h-8 text-green-600" />,
      action: () => navigate("/citas/procedimientos"),
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Citas Medicina",
      description: "Agenda de citas a domicilio con médicos (consultas y seguimiento)",
      icon: <Stethoscope className="w-8 h-8 text-blue-600" />,
      action: () => navigate("/citas/medicina"),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Citas
          </h1>
          <p className="text-gray-600 mt-2">
            Todos los servicios son a domicilio. Elige el tipo de agenda:
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayCitas.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-blue" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medicina hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayCitas.filter((c) => c.variant === "medicina").length}
              </p>
            </div>
            <Stethoscope className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Procedimientos hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayCitas.filter((c) => c.variant === "procedimientos").length}
              </p>
            </div>
            <HeartPulse className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayCitas.filter(
                  (c) => c.estado === "scheduled" || c.estado === "confirmed"
                ).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`p-8 cursor-pointer transition-colors border-2 ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {card.icon}
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{card.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); card.action(); }}>
                Ir a agenda
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla resumen: Citas de hoy */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-blue" />
            Citas de hoy
          </h2>
          {todayCitas.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => navigate("/citas/procedimientos")}>
              Ver agendas
            </Button>
          )}
        </div>
        {loadingCitas ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando...
          </div>
        ) : todayCitas.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No hay citas programadas para hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Agenda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayCitas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.hora || "—"}</TableCell>
                    <TableCell>{c.paciente}</TableCell>
                    <TableCell>{c.profesional}</TableCell>
                    <TableCell>{c.tipo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(c.variant === "medicina" ? "/citas/medicina" : "/citas/procedimientos")
                        }
                      >
                        {c.variant === "medicina" ? "Medicina" : "Procedimientos"}
                      </Button>
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
