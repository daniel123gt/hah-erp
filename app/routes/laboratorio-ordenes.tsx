import type { Route } from "./+types/laboratorio-ordenes";
import OrdenesLaboratorio from "~/dashboard/laboratorio/Ordenes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Órdenes - Laboratorio | Health At Home ERP" }];
}

export default function LaboratorioOrdenesRoute() {
  return <OrdenesLaboratorio />;
}

