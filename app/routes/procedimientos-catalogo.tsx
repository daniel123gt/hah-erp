import type { Route } from "./+types/procedimientos-catalogo";
import CatalogoProcedimientos from "~/dashboard/procedimientos/Catalogo";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Catálogo - Procedimientos | Health At Home ERP" },
    { name: "description", content: "Procedimientos con costo y materiales" },
  ];
}

export default function ProcedimientosCatalogoRoute() {
  return <CatalogoProcedimientos />;
}
