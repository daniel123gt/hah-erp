import supabase from "~/utils/supabase";

// Tipos para los datos de exámenes de laboratorio
export interface LaboratoryExam {
  id: string;
  codigo: string;
  nombre: string;
  precio: string;
  categoria?: string;
  descripcion?: string;
  tiempo_resultado?: string;
  preparacion?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamQuote {
  examenes: LaboratoryExam[];
  precioOriginal: number;
  precioCliente: number;
  recargoTotal: number;
  recargoUnitario: number;
  costoDomicilio: number;
  totalFinal: number;
}

// Función para obtener exámenes
export async function getExams(options: {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      categoria = '',
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = options;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('laboratory_exams')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    // Aplicar filtro de búsqueda si existe
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
    }

    // Aplicar filtro de categoría
    if (categoria && categoria !== 'all') {
      query = query.eq('categoria', categoria);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data as LaboratoryExam[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error al obtener exámenes:', error);
    throw new Error('Error al obtener la lista de exámenes');
  }
}

// Función para obtener estadísticas
export async function getExamStats() {
  try {
    const [
      { count: totalExams },
      { data: categoriesData }
    ] = await Promise.all([
      supabase.from('laboratory_exams').select('*', { count: 'exact', head: true }),
      supabase.from('laboratory_exams').select('categoria')
    ]);

    const categories = [...new Set(categoriesData.map(item => item.categoria))].filter(Boolean);

    return {
      total: totalExams || 0,
      categories: categories.length
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de exámenes:', error);
    throw new Error('Error al obtener estadísticas');
  }
}

// Función para calcular cotización
export function calculateQuote(exams: LaboratoryExam[]): ExamQuote {
  const RECARGO_TOTAL = 120; // Recargo fijo total
  const COSTO_DOMICILIO = 0; // Costo de domicilio
  
  // Función para parsear precio (igual que tu MVP)
  const parsePrice = (precio: string) =>
    parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

  const precioOriginal = exams.reduce(
    (acc, exam) => acc + parsePrice(exam.precio),
    0
  );

  const recargoUnitario = exams.length > 0 ? RECARGO_TOTAL / exams.length : 0;
  
  const precioCliente = exams.reduce(
    (acc, exam) => acc + parsePrice(exam.precio) * 1.2 + recargoUnitario,
    0
  );

  const totalFinal = precioCliente + COSTO_DOMICILIO;

  return {
    examenes: exams,
    precioOriginal,
    precioCliente,
    recargoTotal: RECARGO_TOTAL,
    recargoUnitario,
    costoDomicilio: COSTO_DOMICILIO,
    totalFinal
  };
}

// Objeto de servicio para compatibilidad
export const laboratoryService = {
  getExams,
  getExamStats,
  calculateQuote
};

export default laboratoryService;
