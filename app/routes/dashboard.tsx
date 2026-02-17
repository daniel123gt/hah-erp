import type { Route } from "./+types/dashboard";
import Layout from "~/dashboard/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Health At Home ERP" },
    { name: "description", content: "ERP de salud" },
  ];
}

export default function Dashboard() {
  return <Layout />;
}
