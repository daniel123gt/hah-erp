import type { Route } from "./+types/enfermeria";
import EnfermeriaPage from "~/dashboard/enfermeria/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Enfermería | Health At Home ERP" }];
}

export default function EnfermeriaRoute() {
  return <EnfermeriaPage />;
}

