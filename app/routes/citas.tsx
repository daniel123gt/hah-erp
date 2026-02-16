import type { Route } from "./+types/citas";
import CitasHome from "~/dashboard/citas/Home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Citas - Health At Home ERP" },
    { name: "description", content: "Citas a domicilio: procedimientos y medicina" },
  ];
}

export default function Citas() {
  return <CitasHome />;
}
