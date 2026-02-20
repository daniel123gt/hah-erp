import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek as startOfWeekFns, getDay, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { getCalendarEvents, type CalendarEvent } from "~/services/dashboardService";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./HomeCalendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeekFns(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const MESSAGES = {
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  allDay: "Todo el día",
  week: "Semana",
  work_week: "Semana laboral",
  day: "Día",
  month: "Mes",
  previous: "Anterior",
  next: "Siguiente",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  today: "Hoy",
  agenda: "Agenda",
  noEventsInRange: "No hay eventos en este rango.",
  showMore: (total: number) => `+${total} más`,
};

const EVENT_STYLES: Record<string, { background: string; border?: string }> = {
  medicina: { background: "#2563eb", border: "1px solid #1d4ed8" },
  procedimientos: { background: "#16a34a", border: "1px solid #15803d" },
  laboratorio: { background: "#0891b2", border: "1px solid #0e7490" },
};

function getEventStyle(event: CalendarEvent) {
  return EVENT_STYLES[event.resource.type] ?? { background: "#6b7280" };
}

interface HomeCalendarProps {
  onNavigate?: (path: string) => void;
}

export default function HomeCalendar({ onNavigate }: HomeCalendarProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeStart = startOfMonth(date);
  const rangeEnd = endOfMonth(date);
  const fromStr = format(rangeStart, "yyyy-MM-dd");
  const toStr = format(rangeEnd, "yyyy-MM-dd");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    getCalendarEvents(fromStr, toStr)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [fromStr, toStr]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const { type, id } = event.resource;
    if (type === "laboratorio") {
      (onNavigate ?? navigate)(`/laboratorio/ordenes/${id}`);
    } else {
      (onNavigate ?? navigate)("/citas");
    }
  };

  const handleSelectSlot = () => {
    (onNavigate ?? navigate)("/citas");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary-blue" />
          Calendario
        </CardTitle>
        <Button
          size="sm"
          className="bg-primary-blue hover:bg-primary-blue/90"
          onClick={() => (onNavigate ?? navigate)("/citas")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva cita
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
          </div>
        ) : (
          <>
          <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background: EVENT_STYLES.medicina.background }} />
              Citas medicina
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background: EVENT_STYLES.procedimientos.background }} />
              Citas procedimientos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background: EVENT_STYLES.laboratorio.background }} />
              Laboratorio
            </span>
          </div>
          <div className="h-[400px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              view={view}
              date={date}
              onView={setView}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              messages={MESSAGES}
              eventPropGetter={(event) => ({
                style: getEventStyle(event as CalendarEvent),
              })}
              culture="es"
            />
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
