import type { Route } from "./+types/laboratorio";
import LaboratorioPage from "~/dashboard/laboratorio/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Laboratorio | Health At Home ERP" },
    { name: "description", content: "Laboratorio y exámenes" },
  ];
}

export default function LaboratorioRoute() {
  return <LaboratorioPage />;
}