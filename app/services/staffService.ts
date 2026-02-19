import supabase from "~/utils/supabase";

/** Valores equivalentes en BD: oficial + legacy (para que sigan apareciendo empleados ya guardados) */
const DEPARTMENT_EQUIVALENTS: Record<string, string[]> = {
  Medicina: ["Medicina", "Medicina General"],
  Enfermeria: ["Enfermeria", "Enfermería"],
  Administracion: ["Administracion", "Administración"],
};
const POSITION_EQUIVALENTS: Record<string, string[]> = {
  "Enfermera Tecnica": ["Enfermera Tecnica", "Enfermera Técnica"],
  "Enfermera Licenciada": ["Enfermera Licenciada"],
  "Enfermera Jefe": ["Enfermera Jefe"],
  Supervisor: ["Supervisor"],
  Secretaria: ["Secretaria"],
  "Medico General": ["Medico General", "Médico General"],
  Administrador: ["Administrador"],
  Chofer: ["Chofer"],
};

// Tipos para los datos de personal
export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'M' | 'F';
  address?: string;
  position: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  qualifications?: string[];
  certifications?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'M' | 'F';
  address?: string;
  position: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  qualifications?: string[];
  certifications?: string[];
}

export interface UpdateStaffData extends Partial<CreateStaffData> {
  id: string;
}

// Servicio para operaciones CRUD de personal
export const staffService = {
  // Obtener todo el personal con paginación y filtros
  async getStaff(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    gender?: string;
    department?: string;
    position?: string;
    /** Si se usa, filtra position con ilike (ej. "%Técnic%") en lugar de eq */
    positionPattern?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '',
        gender = '',
        department = '',
        position = '',
        positionPattern = '',
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = options;
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('staff')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

             // Aplicar filtro de búsqueda si existe
             if (search) {
               query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
             }

      // Aplicar filtro de estado
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Aplicar filtro de género
      if (gender && gender !== 'all') {
        query = query.eq('gender', gender);
      }

      // Aplicar filtro de departamento (acepta valores oficiales y legacy en BD)
      if (department && department !== 'all') {
        const deptValues = DEPARTMENT_EQUIVALENTS[department] ?? [department];
        if (deptValues.length === 1) {
          query = query.eq('department', deptValues[0]);
        } else {
          query = query.in('department', deptValues);
        }
      }

      // Aplicar filtro de posición (exacto, por patrón, o equivalentes oficial/legacy)
      if (positionPattern) {
        query = query.ilike('position', positionPattern);
      } else if (position && position !== 'all') {
        const posValues = POSITION_EQUIVALENTS[position] ?? [position];
        if (posValues.length === 1) {
          query = query.eq('position', posValues[0]);
        } else {
          query = query.in('position', posValues);
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Staff[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page < Math.ceil((count || 0) / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error al obtener personal:', error);
      throw new Error('Error al obtener la lista de personal');
    }
  },

  // Obtener un miembro del personal por ID
  async getStaffById(id: string) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Staff;
    } catch (error) {
      console.error('Error al obtener miembro del personal:', error);
      throw new Error('Error al obtener los datos del miembro del personal');
    }
  },

  // Crear un nuevo miembro del personal
  async createStaff(staffData: CreateStaffData) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([staffData])
        .select()
        .single();

      if (error) throw error;
      return data as Staff;
    } catch (error) {
      console.error('Error al crear miembro del personal:', error);
      throw new Error('Error al crear el miembro del personal');
    }
  },

  // Actualizar un miembro del personal existente
  async updateStaff(staffData: UpdateStaffData) {
    try {
      const { id, ...updateData } = staffData;
      
      const { data, error } = await supabase
        .from('staff')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Staff;
    } catch (error) {
      console.error('Error al actualizar miembro del personal:', error);
      throw new Error('Error al actualizar el miembro del personal');
    }
  },

  // Eliminar un miembro del personal
  async deleteStaff(id: string) {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar miembro del personal:', error);
      throw new Error('Error al eliminar el miembro del personal');
    }
  },

  // Obtener estadísticas de personal
  async getStaffStats() {
    try {
      const now = new Date();
      const yearStart = `${now.getFullYear()}-01-01`;
      const [
        { count: totalStaff },
        { count: maleStaff },
        { count: femaleStaff },
        { count: activeStaff },
        { count: staffThisMonth },
        { count: staffThisYear }
      ] = await Promise.all([
        supabase.from('staff').select('*', { count: 'exact', head: true }),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('gender', 'M'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('gender', 'F'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
        supabase.from('staff').select('*', { count: 'exact', head: true })
          .gte('hire_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('staff').select('*', { count: 'exact', head: true })
          .gte('hire_date', yearStart)
      ]);

      return {
        total: totalStaff || 0,
        male: maleStaff || 0,
        female: femaleStaff || 0,
        active: activeStaff || 0,
        thisMonth: staffThisMonth || 0,
        thisYear: staffThisYear || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de personal:', error);
      throw new Error('Error al obtener estadísticas');
    }
  },

  /** Empleados contratados en el mes actual (para tabla resumen en home de personal). */
  async getStaffHiredThisMonth(): Promise<Staff[]> {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .gte('hire_date', start)
        .lte('hire_date', end)
        .order('hire_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Staff[];
    } catch (error) {
      console.error('Error al obtener personal contratado este mes:', error);
      return [];
    }
  },

  /** Empleados contratados en el año actual (para tabla resumen en home de personal). */
  async getStaffHiredThisYear(): Promise<Staff[]> {
    try {
      const y = new Date().getFullYear();
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .gte('hire_date', start)
        .lte('hire_date', end)
        .order('hire_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Staff[];
    } catch (error) {
      console.error('Error al obtener personal contratado este año:', error);
      return [];
    }
  },

  // Buscar personal por criterios específicos
  async searchStaff(criteria: {
    name?: string;
    email?: string;
    phone?: string;
    gender?: 'M' | 'F';
    status?: string;
    department?: string;
    position?: string;
  }) {
    try {
      let query = supabase.from('staff').select('*');

      if (criteria.name) {
        query = query.ilike('name', `%${criteria.name}%`);
      }
      
      if (criteria.email) {
        query = query.ilike('email', `%${criteria.email}%`);
      }
      
      if (criteria.phone) {
        query = query.ilike('phone', `%${criteria.phone}%`);
      }
      
      if (criteria.gender) {
        query = query.eq('gender', criteria.gender);
      }
      
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      
      if (criteria.department) {
        query = query.eq('department', criteria.department);
      }
      
      if (criteria.position) {
        query = query.eq('position', criteria.position);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Staff[];
    } catch (error) {
      console.error('Error al buscar personal:', error);
      throw new Error('Error al buscar personal');
    }
  },

  // Exportar personal a diferentes formatos
  async exportStaffData(format: 'csv' | 'json' = 'json') {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'csv') {
        // Convertir a CSV
        const headers = [
          'ID', 'Nombre', 'Email', 'Teléfono', 'Edad', 'Género', 
          'Dirección', 'Posición', 'Departamento', 'Salario', 
          'Fecha de Contratación', 'Estado', 'Contacto de Emergencia', 
          'Teléfono de Emergencia', 'Calificaciones', 'Certificaciones', 
          'Fecha de Creación'
        ];

        const csvRows = [headers.join(',')];
        
        data.forEach(staff => {
          const row = [
            staff.id,
            `"${staff.name}"`,
            `"${staff.email || ''}"`,
            `"${staff.phone || ''}"`,
            staff.age,
            staff.gender,
            `"${staff.address || ''}"`,
            `"${staff.position}"`,
            `"${staff.department || ''}"`,
            staff.salary,
            staff.hire_date || '',
            staff.status,
            `"${staff.emergency_contact || ''}"`,
            `"${staff.emergency_phone || ''}"`,
            `"${staff.qualifications?.join('; ') || ''}"`,
            `"${staff.certifications?.join('; ') || ''}"`,
            staff.created_at
          ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
      }

      return data;
    } catch (error) {
      console.error('Error al exportar personal:', error);
      throw new Error('Error al exportar personal');
    }
  }
};

export default staffService;
