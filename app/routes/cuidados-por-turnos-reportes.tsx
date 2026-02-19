import type { Route } from "./+types/cuidados-por-turnos-reportes";
import CuidadosPorTurnosReportes from "~/dashboard/cuidados-por-turnos/Reportes";

export function meta() {
  return [
    { title: "Reportes - Cuidados por turnos | Health At Home ERP" },
    { name: "description", content: "Turnos realizados e ingresos por período" },
  ];
}

export default function CuidadosPorTurnosReportesRoute() {
  return <CuidadosPorTurnosReportes />;
}
