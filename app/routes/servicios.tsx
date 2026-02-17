import type { Route } from "./+types/servicios";
import ServiciosPage from "~/dashboard/servicios/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Servicios | Health At Home ERP" },
    { name: "description", content: "Administra el catálogo de servicios médicos" },
  ];
}

export default function Servicios() {
  return <ServiciosPage />;
}
