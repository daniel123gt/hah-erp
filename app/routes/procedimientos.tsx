import type { Route } from "./+types/procedimientos";
import ProcedimientosDashboard from "~/dashboard/procedimientos/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Procedimientos - Health At Home ERP" },
    { name: "description", content: "Catálogo y listado de procedimientos de enfermería" },
  ];
}

export default function ProcedimientosRoute() {
  return <ProcedimientosDashboard />;
}
