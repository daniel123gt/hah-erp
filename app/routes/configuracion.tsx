import type { Route } from "./+types/configuracion";
import ConfiguracionPage from "~/dashboard/configuracion/Page";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Configuración | Health At Home ERP" }];
}

export default function ConfiguracionRoute() {
  return <ConfiguracionPage />;
}
