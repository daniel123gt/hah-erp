import type { Route } from "./+types/registro-rx-ecografias-reportes";
import ReportesRegistroRxEcografias from "~/dashboard/registro-rx-ecografias/Reportes";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Reportes - Registro RX / Ecografías | Health At Home ERP" },
    { name: "description", content: "Reportes de ingresos y utilidad de RX/Ecografías" },
  ];
}

export default function RegistroRxEcografiasReportesRoute() {
  return <ReportesRegistroRxEcografias />;
}
