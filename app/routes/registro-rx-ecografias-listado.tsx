import type { Route } from "./+types/registro-rx-ecografias-listado";
import ListadoRegistroRxEcografias from "~/dashboard/registro-rx-ecografias/Listado";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Listado - Registro RX / Ecografías | Health At Home ERP" },
    { name: "description", content: "Listado de registros de RX y ecografías" },
  ];
}

export default function RegistroRxEcografiasListadoRoute() {
  return <ListadoRegistroRxEcografias />;
}
