import type { Route } from "./+types/auth";
import AuthPage from "~/auth/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function AuthRoute() {
  return <AuthPage />;
}
