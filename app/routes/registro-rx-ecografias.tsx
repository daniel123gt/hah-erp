import type { Route } from "./+types/registro-rx-ecografias";
import RegistroRxEcografiasDashboard from "~/dashboard/registro-rx-ecografias/Dashboard";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Registro RX / Ecografías | Health At Home ERP" },
    { name: "description", content: "Registro de citas de RX y ecografías completadas" },
  ];
}

export default function RegistroRxEcografiasRoute() {
  return <RegistroRxEcografiasDashboard />;
}
