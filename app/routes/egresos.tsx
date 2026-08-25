import type { Route } from "./+types/egresos";
import EgresosDashboard from "~/dashboard/egresos/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Egresos | Health At Home ERP" },
    { name: "description", content: "Registro de egresos de la empresa" },
  ];
}

export default function EgresosRoute() {
  return <EgresosDashboard />;
}
