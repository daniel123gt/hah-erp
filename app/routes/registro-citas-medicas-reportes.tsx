import type { Route } from "./+types/registro-citas-medicas-reportes";
import ReportesRegistroCitasMedicas from "~/dashboard/registro-citas-medicas/Reportes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reportes - Registro Citas Médicas | Health At Home ERP" },
    { name: "description", content: "Reportes de ingresos y utilidad de citas médicas" },
  ];
}

export default function RegistroCitasMedicasReportesRoute() {
  return <ReportesRegistroCitasMedicas />;
}
