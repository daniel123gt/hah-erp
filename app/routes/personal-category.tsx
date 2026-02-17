import type { Route } from "./+types/personal-category";
import PersonalCategory from "~/dashboard/personal/PersonalCategory";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Personal | Health At Home ERP" },
    { name: "description", content: "Áreas de personal" },
  ];
}

export default function PersonalCategoryRoute() {
  return <PersonalCategory />;
}
