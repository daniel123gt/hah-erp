import type { Route } from "./+types/enfermeria-valoraciones";
import VerValoraciones from "~/dashboard/enfermeria/VerValoraciones";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Valoraciones - Enfermería | Health At Home ERP" }];
}

export default function ValoracionesRoute() {
  return <VerValoraciones />;
}

