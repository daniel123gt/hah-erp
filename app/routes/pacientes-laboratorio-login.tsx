import type { Route } from "./+types/pacientes-laboratorio-login";
import PacientesLogin from "~/dashboard/pacientes-portal/Login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Acceso resultados | Health At Home ERP" }];
}

export default function PacientesLaboratorioLoginRoute() {
  return <PacientesLogin />;
}

