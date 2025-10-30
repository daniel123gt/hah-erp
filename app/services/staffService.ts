import supabase from "~/utils/supabase";

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

      // Aplicar filtro de departamento
      if (department && department !== 'all') {
        query = query.eq('department', department);
      }

      // Aplicar filtro de posición
      if (position && position !== 'all') {
        query = query.eq('position', position);
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
      const [
        { count: totalStaff },
        { count: maleStaff },
        { count: femaleStaff },
        { count: activeStaff },
        { count: staffThisMonth }
      ] = await Promise.all([
        supabase.from('staff').select('*', { count: 'exact', head: true }),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('gender', 'M'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('gender', 'F'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
        // Contar personal contratado este mes
        supabase.from('staff').select('*', { count: 'exact', head: true })
          .gte('hire_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ]);

      return {
        total: totalStaff || 0,
        male: maleStaff || 0,
        female: femaleStaff || 0,
        active: activeStaff || 0,
        thisMonth: staffThisMonth || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de personal:', error);
      throw new Error('Error al obtener estadísticas');
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
