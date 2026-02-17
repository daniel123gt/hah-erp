import type { Route } from "./+types/pacientes-laboratorio";
import PacientesPortalLayout from "~/dashboard/pacientes-portal/layout";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Portal Laboratorio | Health At Home ERP" }];
}

export default function PacientesLaboratorioRoute() {
  return <PacientesPortalLayout />;
}

