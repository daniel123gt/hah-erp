import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableSkeleton } from "~/components/ui/table-skeleton";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { PhoneIncoming, Phone, MessageCircle, Download } from "lucide-react";
import {
  leadsService,
  LEAD_TYPE_LABELS,
  LEAD_CATEGORY_LABELS,
  type ContactLead,
  type LeadType,
  type LeadCategory,
} from "~/services/leadsService";
import { getTodayLocal } from "~/lib/dateUtils";

const pad2 = (n: number) => String(n).padStart(2, "0");

function addDaysYMD(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function daysBetween(fromYMD: string, toYMD: string): string[] {
  const [fy, fm, fd] = fromYMD.split("-").map(Number);
  const [ty, tm, td] = toYMD.split("-").map(Number);
  let start = new Date(fy, fm - 1, fd);
  let end = new Date(ty, tm - 1, td);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  if (start > end) [start, end] = [end, start];
  const out: string[] = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    out.push(`${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`);
    if (out.length > 400) break;
  }
  return out;
}

function ymdLocal(iso: string): string {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

const CATEGORY_COLORS: Record<LeadCategory, string> = {
  potencial: "#059669",
  basura: "#6b7280",
  no_apto: "#d97706",
};
const TYPE_COLORS: Record<LeadType, string> = {
  llamada: "#2563eb",
  whatsapp: "#16a34a",
};

function categoryBadge(category: LeadCategory) {
  const cls: Record<LeadCategory, string> = {
    potencial: "bg-emerald-100 text-emerald-800",
    basura: "bg-gray-200 text-gray-700",
    no_apto: "bg-amber-100 text-amber-800",
  };
  return <Badge className={cls[category]}>{LEAD_CATEGORY_LABELS[category]}</Badge>;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const today = getTodayLocal();
  const [from, setFrom] = useState(() => addDaysYMD(today, -29)); // últimos 30 días
  const [to, setTo] = useState(today);
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<LeadType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<LeadCategory | "all">("all");

  const load = useCallback(() => {
    setLoading(true);
    leadsService
      .getLeads(from, to)
      .then(setLeads)
      .catch((err) => {
        console.error("Error al cargar registros:", err);
        toast.error("No se pudieron cargar los registros");
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // KPIs y agregados (sobre TODO el rango, sin filtrar por tipo/categoría).
  const stats = useMemo(() => {
    const byType = { llamada: 0, whatsapp: 0 };
    const byCategory = { potencial: 0, basura: 0, no_apto: 0 };
    leads.forEach((l) => {
      if (l.type in byType) byType[l.type] += 1;
      if (l.category in byCategory) byCategory[l.category] += 1;
    });
    return { total: leads.length, byType, byCategory };
  }, [leads]);

  const perDay = useMemo(() => {
    const dates = daysBetween(from, to);
    const map: Record<string, { potencial: number; basura: number; no_apto: number; llamada: number; whatsapp: number }> = {};
    dates.forEach((d) => (map[d] = { potencial: 0, basura: 0, no_apto: 0, llamada: 0, whatsapp: 0 }));
    leads.forEach((l) => {
      const d = ymdLocal(l.created_at);
      if (map[d]) {
        if (l.category in map[d]) (map[d] as any)[l.category] += 1;
        if (l.type in map[d]) (map[d] as any)[l.type] += 1;
      }
    });
    return dates.map((d) => {
      const [, m, dd] = d.split("-");
      return { date: d, label: `${dd}/${m}`, ...map[d], total: map[d].potencial + map[d].basura + map[d].no_apto };
    });
  }, [leads, from, to]);

  const categoryPie = useMemo(
    () =>
      (["potencial", "basura", "no_apto"] as LeadCategory[])
        .map((c) => ({ name: LEAD_CATEGORY_LABELS[c], value: stats.byCategory[c], key: c }))
        .filter((d) => d.value > 0),
    [stats]
  );
  const typePie = useMemo(
    () =>
      (["llamada", "whatsapp"] as LeadType[])
        .map((t) => ({ name: LEAD_TYPE_LABELS[t], value: stats.byType[t], key: t }))
        .filter((d) => d.value > 0),
    [stats]
  );

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          (typeFilter === "all" || l.type === typeFilter) &&
          (categoryFilter === "all" || l.category === categoryFilter)
      ),
    [leads, typeFilter, categoryFilter]
  );

  const handleDownload = useCallback(() => {
    if (perDay.length === 0) {
      toast.error("No hay datos para descargar");
      return;
    }
    const header = ["Fecha", "Llamadas", "WhatsApp", "Potencial", "Basura", "No apto", "Total"];
    const rows = perDay.map((d) => [d.date, d.llamada, d.whatsapp, d.potencial, d.basura, d.no_apto, d.total]);
    rows.push([]);
    rows.push([
      "TOTAL",
      stats.byType.llamada,
      stats.byType.whatsapp,
      stats.byCategory.potencial,
      stats.byCategory.basura,
      stats.byCategory.no_apto,
      stats.total,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llamadas-mensajes_${from}_a_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Reporte descargado");
  }, [perDay, stats, from, to]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PhoneIncoming className="w-7 h-7 text-primary-blue" />
            Llamadas y mensajes
          </h1>
          <p className="text-gray-600 mt-1">
            Registros de llamadas y mensajes entrantes para analizar y cruzar con otras herramientas (Google Ads, etc.).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Desde</label>
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[9.5rem]" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Hasta</label>
            <Input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="h-9 w-[9.5rem]" />
          </div>
          <Button variant="outline" onClick={handleDownload} disabled={loading || leads.length === 0} className="h-9">
            <Download className="w-4 h-4 mr-2" />
            Descargar reporte
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Total" value={stats.total} className="bg-primary-blue/10 text-primary-blue" />
        <KpiTile label="Llamadas" value={stats.byType.llamada} icon={<Phone className="w-4 h-4" />} className="bg-blue-50 text-blue-700" />
        <KpiTile label="WhatsApp" value={stats.byType.whatsapp} icon={<MessageCircle className="w-4 h-4" />} className="bg-green-50 text-green-700" />
        <KpiTile label="Potencial" value={stats.byCategory.potencial} className="bg-emerald-50 text-emerald-700" />
        <KpiTile label="Basura" value={stats.byCategory.basura} className="bg-gray-100 text-gray-700" />
        <KpiTile label="No apto" value={stats.byCategory.no_apto} className="bg-amber-50 text-amber-700" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Registros por día</CardTitle>
            <p className="text-sm text-gray-600">Apilado por categoría</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Cargando...</div>
            ) : perDay.length === 0 || stats.total === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Sin registros en el rango.</div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      labelFormatter={(label, payload) => {
                        const date = payload?.[0]?.payload?.date;
                        return date
                          ? new Date(date + "T12:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })
                          : label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="potencial" name="Potencial" stackId="c" fill={CATEGORY_COLORS.potencial} />
                    <Bar dataKey="basura" name="Basura" stackId="c" fill={CATEGORY_COLORS.basura} />
                    <Bar dataKey="no_apto" name="No apto" stackId="c" fill={CATEGORY_COLORS.no_apto} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución</CardTitle>
            <p className="text-sm text-gray-600">Por categoría y por canal</p>
          </CardHeader>
          <CardContent>
            {stats.total === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Sin registros.</div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                    <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {categoryPie.map((entry) => (
                        <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key as LeadCategory]} />
                      ))}
                    </Pie>
                    <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={78}>
                      {typePie.map((entry) => (
                        <Cell key={entry.key} fill={TYPE_COLORS[entry.key as LeadType]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Detalle de registros</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as LeadType | "all")}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as LeadCategory | "all")}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="potencial">Cliente potencial</SelectItem>
                  <SelectItem value="basura">Basura</SelectItem>
                  <SelectItem value="no_apto">Cliente no apto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No hay registros para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          {l.type === "llamada" ? (
                            <Phone className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          )}
                          {LEAD_TYPE_LABELS[l.type]}
                        </span>
                      </TableCell>
                      <TableCell>{categoryBadge(l.category)}</TableCell>
                      <TableCell className="max-w-[280px]">
                        <span className="text-sm text-gray-600 break-words">{l.notes || "—"}</span>
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

function KpiTile({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-black/5 px-4 py-3 ${className ?? "bg-gray-50 text-gray-700"}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
