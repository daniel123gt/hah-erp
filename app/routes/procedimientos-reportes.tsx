import type { Route } from "./+types/procedimientos-reportes";
import ProcedimientosReportes from "~/dashboard/procedimientos/Reportes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reportes - Procedimientos | Health At Home ERP" },
    { name: "description", content: "Cierre mensual de ingresos y egresos" },
  ];
}

export default function ProcedimientosReportesRoute() {
  return <ProcedimientosReportes />;
}
