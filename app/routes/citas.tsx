import type { Route } from "./+types/citas";
import CitasPage from "~/dashboard/citas/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gestión de Citas - Health At Home ERP" },
    { name: "description", content: "Programa y administra las citas médicas" },
  ];
}

export default function Citas() {
  return <CitasPage />;
}
