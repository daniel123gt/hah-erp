import type { Route } from "./+types/laboratorio-reportes";
import LaboratorioReportes from "~/dashboard/laboratorio/Reportes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Reportes - Laboratorio | Health At Home ERP" }];
}

export default function LaboratorioReportesRoute() {
  return <LaboratorioReportes />;
}

