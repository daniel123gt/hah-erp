import type { Route } from "./+types/citas-medicina";
import CitasMedicinaPage from "~/dashboard/citas/MedicinaPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Citas Medicina - Health At Home ERP" },
    { name: "description", content: "Agenda de citas a domicilio con médicos" },
  ];
}

export default function CitasMedicina() {
  return <CitasMedicinaPage />;
}
