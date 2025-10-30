import type { Route } from "./+types/pacientes";
import PacientesPage from "~/dashboard/pacientes/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gestión de Pacientes - Health At Home ERP" },
    { name: "description", content: "Administra la información de todos los pacientes" },
  ];
}

export default function Pacientes() {
  return <PacientesPage />;
}
