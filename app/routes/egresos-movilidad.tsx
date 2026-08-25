import type { Route } from "./+types/egresos-movilidad";
import MovilidadEgresos from "~/dashboard/egresos/Movilidad";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Egresos - Movilidad | Health At Home ERP" },
    { name: "description", content: "Egresos de movilidad: taxis, combustible, mantenimiento" },
  ];
}

export default function EgresosMovilidadRoute() {
  return <MovilidadEgresos />;
}
