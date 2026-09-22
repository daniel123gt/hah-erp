import type { Route } from "./+types/leads";
import LeadsPage from "~/dashboard/leads/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Llamadas y mensajes | Health At Home ERP" }];
}

export default function LeadsRoute() {
  return <LeadsPage />;
}
