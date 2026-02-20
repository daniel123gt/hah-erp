import type { Route } from "./+types/registro-citas-medicas-listado";
import ListadoRegistroCitasMedicas from "~/dashboard/registro-citas-medicas/Listado";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Listado - Registro Citas Médicas | Health At Home ERP" },
    { name: "description", content: "Listado de registros de citas médicas" },
  ];
}

export default function RegistroCitasMedicasListadoRoute() {
  return <ListadoRegistroCitasMedicas />;
}
