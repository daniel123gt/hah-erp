import type { Route } from "./+types/dashboard";
import Layout from "~/dashboard/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Pagce" },
    { name: "description", content: "Welcome to about page" },
  ];
}

export default function Dashboard() {
  return <Layout />;
}
