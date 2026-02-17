import type { Route } from "./+types/citas-procedimientos";
import CitasProcedimientosPage from "~/dashboard/citas/ProcedimientosPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Citas Procedimientos | Health At Home ERP" },
    { name: "description", content: "Agenda de citas a domicilio con enfermeras" },
  ];
}

export default function CitasProcedimientos() {
  return <CitasProcedimientosPage />;
}
