import type { Route } from "./+types/enfermeria-valoracion";
import ValoracionInicial from "~/dashboard/enfermeria/ValoracionInicial";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Valoración inicial - Enfermería | Health At Home ERP" }];
}

export default function ValoracionInicialRoute() {
  return <ValoracionInicial />;
}

