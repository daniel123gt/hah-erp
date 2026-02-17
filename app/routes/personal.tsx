import type { Route } from "./+types/personal";
import PersonalDashboard from "~/dashboard/personal/PersonalDashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Personal | Health At Home ERP" },
    { name: "description", content: "Categorías de personal" },
  ];
}

export default function Personal() {
  return <PersonalDashboard />;
}
