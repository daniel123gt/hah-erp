import type { Route } from "./+types/registro-citas-medicas";
import RegistroCitasMedicasDashboard from "~/dashboard/registro-citas-medicas/Dashboard";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Registro Citas Médicas | Health At Home ERP" },
    { name: "description", content: "Registro de citas médicas completadas" },
  ];
}

export default function RegistroCitasMedicasRoute() {
  return <RegistroCitasMedicasDashboard />;
}
