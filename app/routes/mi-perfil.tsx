import type { Route } from "./+types/mi-perfil";
import MiPerfilPage from "~/dashboard/mi-perfil/MiPerfilPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Datos y configuración" },
    { name: "description", content: "Información y configuración de tu cuenta" },
  ];
}

export default function MiPerfilRoute() {
  return <MiPerfilPage />;
}
