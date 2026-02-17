import type { Route } from "./+types/reportes";
import ReportesPage from "~/dashboard/reportes/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Reportes | Health At Home ERP" }];
}

export default function ReportesRoute() {
  return <ReportesPage />;
}
