import type { Route } from "./+types/procedimientos-detalle";
import ProcedimientoDetalle from "~/dashboard/procedimientos/ProcedimientoDetalle";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Detalle del Procedimiento - Health At Home ERP" },
  ];
}

export default function ProcedimientosDetalleRoute() {
  return <ProcedimientoDetalle />;
}
