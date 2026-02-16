import type { Route } from "./+types/procedimientos-listado";
import ListadoProcedimientos from "~/dashboard/procedimientos/Listado";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Listado de Procedimientos - Health At Home ERP" },
    { name: "description", content: "Registro de procedimientos realizados" },
  ];
}

export default function ProcedimientosListadoRoute() {
  return <ListadoProcedimientos />;
}
