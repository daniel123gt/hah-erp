import type { Route } from "./+types/cotizaciones";
import CotizacionesPage from "~/dashboard/cotizaciones/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cotizaciones | Health At Home ERP" },
    { name: "description", content: "Administra presupuestos y cotizaciones médicas" },
  ];
}

export default function Cotizaciones() {
  return <CotizacionesPage />;
}
