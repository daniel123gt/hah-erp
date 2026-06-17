import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Calendar,
  Stethoscope,
  Syringe,
  Scan,
  FlaskConical,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";
import { getDayAgenda, type AgendaItem, type AgendaKind } from "~/services/dashboardService";
import { getTodayLocal } from "~/lib/dateUtils";
import { cn } from "~/lib/utils";

const KIND_META: Record<AgendaKind, { icon: typeof Calendar; label: string; color: string }> = {
  medicina: { icon: Stethoscope, label: "Cita médica", color: "text-blue-600 bg-blue-100" },
  procedimientos: { icon: Syringe, label: "Procedimiento", color: "text-purple-600 bg-purple-100" },
  rx_ecografias: { icon: Scan, label: "RX / Ecografía", color: "text-cyan-600 bg-cyan-100" },
  laboratorio: { icon: FlaskConical, label: "Laboratorio", color: "text-teal-600 bg-teal-100" },
  turno: { icon: Clock, label: "Cuidado por turno", color: "text-orange-600 bg-orange-100" },
};

export default function HomeAgendaMap() {
  const [date, setDate] = useState(getTodayLocal());
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDayAgenda(date)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setSelectedId(data.find((i) => i.mapQuery)?.id ?? data[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY as string | undefined;
  const mapSrc =
    mapsKey && selected?.mapQuery
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(
          `${selected.mapQuery}, Lima, Perú`
        )}&zoom=15&language=es`
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-blue" />
            Agenda del día y ubicación
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lista (izquierda) */}
          <div className="max-h-[440px] overflow-y-auto pr-1 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                No hay citas, laboratorios ni turnos para esta fecha.
              </div>
            ) : (
              items.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;
                const isActive = item.id === selectedId;
                const place = item.address || item.district || "Sin ubicación";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors flex gap-3",
                      isActive
                        ? "border-primary-blue bg-primary-blue/5 ring-1 ring-primary-blue"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn("h-9 w-9 shrink-0 rounded-full flex items-center justify-center", meta.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate uppercase">
                          {item.patientName}
                        </p>
                        {item.time && (
                          <span className="text-xs text-gray-500 shrink-0">{item.time}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {meta.label} · {item.detail}
                      </p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {place}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Mapa (derecha) */}
          <div className="h-[440px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {!mapsKey ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sm text-gray-500">
                <MapPin className="w-10 h-10 mb-2 text-gray-300" />
                <p>
                  Falta configurar el mapa. Agrega{" "}
                  <code className="px-1 rounded bg-gray-200">VITE_GOOGLE_MAPS_EMBED_KEY</code> en el
                  archivo <code className="px-1 rounded bg-gray-200">.env</code>.
                </p>
              </div>
            ) : !selected ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Selecciona un item de la lista para ver su ubicación.
              </div>
            ) : !selected.mapQuery ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sm text-gray-500">
                <MapPin className="w-10 h-10 mb-2 text-gray-300" />
                Este registro no tiene dirección ni distrito para ubicar en el mapa.
              </div>
            ) : (
              <iframe
                title="Ubicación"
                src={mapSrc!}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
