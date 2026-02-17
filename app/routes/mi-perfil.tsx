import type { Route } from "./+types/mi-perfil";
import MiPerfilPage from "~/dashboard/mi-perfil/MiPerfilPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Mi perfil | Health At Home ERP" },
    { name: "description", content: "Información y configuración de tu cuenta" },
  ];
}

export default function MiPerfilRoute() {
  return <MiPerfilPage />;
}
