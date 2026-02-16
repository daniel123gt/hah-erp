/** Categorías y subcategorías de personal para el menú y filtros */
export interface SubcategoryDef {
  slug: string;
  title: string;
}

export interface CategoryDef {
  slug: string;
  title: string;
  subcategories: SubcategoryDef[];
}

export const PERSONAL_CATEGORIES: CategoryDef[] = [
  {
    slug: "enfermeria",
    title: "Enfermería",
    subcategories: [
      { slug: "tecnicas", title: "Técnicas" },
      { slug: "licenciadas", title: "Licenciadas" },
    ],
  },
  {
    slug: "medicina",
    title: "Medicina",
    subcategories: [
      { slug: "general", title: "General" },
    ],
  },
  {
    slug: "administracion",
    title: "Administración",
    subcategories: [
      { slug: "conductores", title: "Conductores" },
      { slug: "asistentes", title: "Asistentes" },
      { slug: "secretarios", title: "Secretarios" },
      { slug: "limpieza", title: "Limpieza" },
    ],
  },
];

/** Mapeo para filtrar en BD: department + position (ilike o exacto) */
export function getFilterForSubcategory(
  categorySlug: string,
  subcategorySlug: string
): { department: string; positionPattern: string } | null {
  const map: Record<string, Record<string, { department: string; positionPattern: string }>> = {
    enfermeria: {
      tecnicas: { department: "Enfermería", positionPattern: "%Técnic%" },
      licenciadas: { department: "Enfermería", positionPattern: "%Licenciad%" },
    },
    medicina: {
      general: { department: "Medicina General", positionPattern: "%" },
    },
    administracion: {
      conductores: { department: "Administración", positionPattern: "%Conductor%" },
      asistentes: { department: "Administración", positionPattern: "%Asistente%" },
      secretarios: { department: "Administración", positionPattern: "%Secretari%" },
      limpieza: { department: "Administración", positionPattern: "%Limpieza%" },
    },
  };
  const cat = map[categorySlug];
  if (!cat) return null;
  const sub = cat[subcategorySlug];
  return sub ?? null;
}

export function getCategoryBySlug(slug: string): CategoryDef | undefined {
  return PERSONAL_CATEGORIES.find((c) => c.slug === slug);
}

/** Departamento en BD para filtrar "toda la categoría" (sin subcategoría) */
export function getDepartmentForCategory(categorySlug: string): string | null {
  const map: Record<string, string> = {
    enfermeria: "Enfermería",
    medicina: "Medicina General",
    administracion: "Administración",
  };
  return map[categorySlug] ?? null;
}

export function getSubcategoryTitle(categorySlug: string, subcategorySlug: string): string {
  const cat = getCategoryBySlug(categorySlug);
  const sub = cat?.subcategories.find((s) => s.slug === subcategorySlug);
  return sub?.title ?? subcategorySlug;
}
