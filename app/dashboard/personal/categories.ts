/** Valores oficiales para BD y formularios (personal) */
export const OFFICIAL_DEPARTMENTS = ["Medicina", "Enfermeria", "Administracion"] as const;
export const OFFICIAL_POSITIONS = [
  "Enfermera Tecnica",
  "Enfermera Licenciada",
  "Enfermera Jefe",
  "Supervisor",
  "Secretaria",
  "Medico General",
  "Administrador",
  "Chofer",
] as const;

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
      { slug: "jefe", title: "Jefe" },
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
      { slug: "supervisores", title: "Supervisores" },
      { slug: "secretarios", title: "Secretarios" },
      { slug: "administradores", title: "Administradores" },
      { slug: "conductores", title: "Conductores" },
    ],
  },
];

export interface SubcategoryFilter {
  department: string;
  position?: string;
  positionPattern?: string;
}

/** Mapeo para filtrar en BD: department + position (exacto) o positionPattern */
export function getFilterForSubcategory(
  categorySlug: string,
  subcategorySlug: string
): SubcategoryFilter | null {
  const map: Record<string, Record<string, SubcategoryFilter>> = {
    enfermeria: {
      tecnicas: { department: "Enfermeria", position: "Enfermera Tecnica" },
      licenciadas: { department: "Enfermeria", position: "Enfermera Licenciada" },
      jefe: { department: "Enfermeria", position: "Enfermera Jefe" },
    },
    medicina: {
      general: { department: "Medicina", position: "Medico General" },
    },
    administracion: {
      supervisores: { department: "Administracion", position: "Supervisor" },
      secretarios: { department: "Administracion", position: "Secretaria" },
      administradores: { department: "Administracion", position: "Administrador" },
      conductores: { department: "Administracion", position: "Chofer" },
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
    enfermeria: "Enfermeria",
    medicina: "Medicina",
    administracion: "Administracion",
  };
  return map[categorySlug] ?? null;
}

export function getSubcategoryTitle(categorySlug: string, subcategorySlug: string): string {
  const cat = getCategoryBySlug(categorySlug);
  const sub = cat?.subcategories.find((s) => s.slug === subcategorySlug);
  return sub?.title ?? subcategorySlug;
}
