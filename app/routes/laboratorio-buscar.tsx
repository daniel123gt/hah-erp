import type { Route } from "./+types/laboratorio-buscar";
import BuscarExamenes from "~/dashboard/laboratorio/BuscarExamenes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catálogo de exámenes - Laboratorio | Health At Home ERP" }];
}

export default function LaboratorioBuscarRoute() {
  return <BuscarExamenes />;
}

