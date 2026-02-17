import type { Route } from "./+types/inventario";
import InventarioPage from "~/dashboard/inventario/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Inventario | Health At Home ERP" }];
}

export default function InventarioRoute() {
  return <InventarioPage />;
}
