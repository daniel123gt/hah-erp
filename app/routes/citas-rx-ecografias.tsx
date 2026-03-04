import type { Route } from "./+types/citas-rx-ecografias";
import CitasRxEcografiasPage from "~/dashboard/citas/RxEcografiasPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Citas RX / Ecografías | Health At Home ERP" },
    { name: "description", content: "Agenda de citas a domicilio de RX y ecografías" },
  ];
}

export default function CitasRxEcografias() {
  return <CitasRxEcografiasPage />;
}
