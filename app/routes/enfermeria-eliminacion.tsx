import type { Route } from "./+types/enfermeria-eliminacion";
import EliminacionHecesOrina from "~/dashboard/enfermeria/EliminacionHecesOrina";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Eliminación - Enfermería | Health At Home ERP" }];
}

export default function EnfermeriaEliminacionRoute() {
  return <EliminacionHecesOrina />;
}

