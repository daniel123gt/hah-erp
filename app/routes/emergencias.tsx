import type { Route } from "./+types/emergencias";
import EmergenciasPage from "~/dashboard/emergencias/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Emergencias | Health At Home ERP" }];
}

export default function EmergenciasRoute() {
  return <EmergenciasPage />;
}
