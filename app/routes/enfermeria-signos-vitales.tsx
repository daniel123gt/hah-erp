import type { Route } from "./+types/enfermeria-signos-vitales";
import SignosVitales from "~/dashboard/enfermeria/SignosVitales";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Signos vitales - Enfermería | Health At Home ERP" }];
}

export default function EnfermeriaSignosVitalesRoute() {
  return <SignosVitales />;
}
