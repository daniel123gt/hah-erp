import type { Route } from "./+types/personal";
import PersonalPage from "~/dashboard/personal/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gestión de Personal - Health At Home ERP" },
    { name: "description", content: "Administra el personal médico y administrativo" },
  ];
}

export default function Personal() {
  return <PersonalPage />;
}
