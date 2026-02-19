import type { Route } from "./+types/cuidados-en-casa-reportes";
import CuidadosEnCasaReportes from "~/dashboard/cuidados-en-casa/Reportes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Reportes - Cuidados en casa | Health At Home ERP" }];
}

export default function CuidadosEnCasaReportesRoute() {
  return <CuidadosEnCasaReportes />;
}
