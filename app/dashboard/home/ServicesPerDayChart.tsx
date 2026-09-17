import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getServicesPerDay, type ServicesPerDayPoint } from "~/services/dashboardService";
import { getTodayLocal } from "~/lib/dateUtils";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Suma (o resta) días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD (local). */
function addDaysYMD(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

const SERIES = [
  { key: "medicina", name: "Citas medicina", color: "#2563eb" },
  { key: "procedimientos", name: "Procedimientos", color: "#16a34a" },
  { key: "rxEcografias", name: "RX / Ecografías", color: "#0d9488" },
  { key: "laboratorio", name: "Laboratorio", color: "#0891b2" },
] as const;

export function ServicesPerDayChart() {
  const today = getTodayLocal();
  // Por defecto: rango de 7 días (hoy y los 6 días anteriores).
  const [from, setFrom] = useState(() => addDaysYMD(today, -6));
  const [to, setTo] = useState(today);
  const [data, setData] = useState<ServicesPerDayPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getServicesPerDay(from, to)
      .then(setData)
      .catch((err) => {
        console.error("Error al cargar servicios por día:", err);
        toast.error("No se pudieron cargar los servicios por día");
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const { totalServices, dayCount, average } = useMemo(() => {
    const totalServices = data.reduce((acc, d) => acc + d.total, 0);
    const dayCount = data.length || 1;
    return { totalServices, dayCount, average: totalServices / dayCount };
  }, [data]);

  const handleDownload = useCallback(() => {
    if (data.length === 0) {
      toast.error("No hay datos para descargar");
      return;
    }
    const header = ["Fecha", "Citas medicina", "Procedimientos", "RX/Ecografías", "Laboratorio", "Total"];
    const rows = data.map((d) => [
      d.date,
      d.medicina,
      d.procedimientos,
      d.rxEcografias,
      d.laboratorio,
      d.total,
    ]);
    rows.push([]);
    rows.push(["Total en el rango", "", "", "", "", totalServices]);
    rows.push(["Promedio diario", "", "", "", "", average.toFixed(2)]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    // BOM para que Excel respete los acentos.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servicios-diarios_${from}_a_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Reporte descargado");
  }, [data, totalServices, average, from, to]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue" />
              Servicios concretados por día
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Solo servicios realizados (completados): citas medicina, procedimientos, RX/Ecografías y laboratorio.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Desde</label>
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-[9.5rem]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Hasta</label>
              <Input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 w-[9.5rem]"
              />
            </div>
            <Button variant="outline" onClick={handleDownload} disabled={loading || data.length === 0} className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Descargar reporte
            </Button>
          </div>
        </div>

        {/* Promedio de servicios diarios en el rango seleccionado */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs text-gray-600">Promedio diario</p>
            <p className="text-2xl font-bold text-primary-blue">
              {average.toFixed(1)}
              <span className="text-sm font-medium text-gray-500 ml-1">serv./día</span>
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-600">Total en el rango ({dayCount} día{dayCount === 1 ? "" : "s"})</p>
            <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            No hay servicios en el rango seleccionado.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  labelFormatter={(label, payload) => {
                    const date = payload?.[0]?.payload?.date;
                    return date
                      ? new Date(date + "T12:00:00").toLocaleDateString("es-PE", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                      : label;
                  }}
                />
                <Legend />
                <ReferenceLine
                  y={average}
                  stroke="#6b7280"
                  strokeDasharray="4 4"
                  label={{ value: `Prom. ${average.toFixed(1)}`, position: "right", fontSize: 11, fill: "#6b7280" }}
                />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} stackId="servicios" fill={s.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
