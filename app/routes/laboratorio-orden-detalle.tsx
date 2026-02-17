import type { Route } from "./+types/laboratorio-orden-detalle";
import OrdenDetalle from "~/dashboard/laboratorio/OrdenDetalle";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Orden - Laboratorio | Health At Home ERP" }];
}

export default function LaboratorioOrdenDetalleRoute() {
  return <OrdenDetalle />;
}

