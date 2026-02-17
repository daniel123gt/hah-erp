import type { Route } from "./+types/enfermeria-evolucion";
import EvolucionEnfermeria from "~/dashboard/enfermeria/EvolucionEnfermeria";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Evolución - Enfermería | Health At Home ERP" }];
}

export default function EnfermeriaEvolucionRoute() {
  return <EvolucionEnfermeria />;
}
