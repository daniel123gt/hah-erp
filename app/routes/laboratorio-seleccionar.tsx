import type { Route } from "./+types/laboratorio-seleccionar";
import SeleccionarExamenes from "~/dashboard/laboratorio/SeleccionarExamenes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Nueva orden - Laboratorio | Health At Home ERP" }];
}

export default function SeleccionarExamenesRoute() {
  return <SeleccionarExamenes />;
}
