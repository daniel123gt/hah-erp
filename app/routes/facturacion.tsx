import type { Route } from "./+types/facturacion";
import FacturacionPage from "~/dashboard/facturacion/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Facturación | Health At Home ERP" }];
}

export default function FacturacionRoute() {
  return <FacturacionPage />;
}
