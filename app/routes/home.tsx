import type { Route } from "./+types/home";
import HomeDashboard from "~/dashboard/home/Home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Inicio | Health At Home ERP" },
    { name: "description", content: "Dashboard principal" },
  ];
}

export default function Home() {
  return <HomeDashboard />;
}
