import type { Route } from "./+types/laboratorio-cotizaciones";
import CotizacionesLaboratorio from "~/dashboard/laboratorio/Cotizaciones";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cotizaciones - Laboratorio | Health At Home ERP" }];
}

export default function LaboratorioCotizacionesRoute() {
  return <CotizacionesLaboratorio />;
}
