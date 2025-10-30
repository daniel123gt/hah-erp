import supabase from "~/utils/supabase";

// Tipos para los datos de pacientes
export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'M' | 'F';
  address?: string;
  district?: string;
  last_visit?: string;
  status?: string;
  blood_type?: string;
  allergies?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_physician?: string;
  current_medications?: string[];
  primary_diagnosis?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'M' | 'F';
  address?: string;
  district?: string;
  last_visit?: string;
  status?: string;
  blood_type?: string;
  allergies?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_physician?: string;
  current_medications?: string[];
  primary_diagnosis?: string;
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
  id: string;
}

// Servicio para operaciones CRUD de pacientes
export const patientsService = {
  // Obtener todos los pacientes con paginación y filtros
  async getPatients(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    gender?: string;
    bloodType?: string;
    district?: string;
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
        bloodType = '',
        district = '',
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = options;
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('patients')
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

      // Aplicar filtro de tipo de sangre
      if (bloodType && bloodType !== 'all') {
        query = query.eq('blood_type', bloodType);
      }

      // Aplicar filtro de distrito
      if (district && district !== 'all') {
        query = query.eq('district', district);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Patient[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page < Math.ceil((count || 0) / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      throw new Error('Error al obtener la lista de pacientes');
    }
  },

  // Obtener un paciente por ID
  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Si el error es que no se encontró el registro, retornar null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data as Patient;
    } catch (error: any) {
      console.error('Error al obtener paciente:', error);
      // Si es un error de "no encontrado", retornar null
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return null;
      }
      throw new Error('Error al obtener los datos del paciente');
    }
  },

  // Crear un nuevo paciente
  async createPatient(patientData: CreatePatientData) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    } catch (error) {
      console.error('Error al crear paciente:', error);
      throw new Error('Error al crear el paciente');
    }
  },

  // Actualizar un paciente existente
  async updatePatient(patientData: UpdatePatientData) {
    try {
      const { id, ...updateData } = patientData;
      
      const { data, error } = await supabase
        .from('patients')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      throw new Error('Error al actualizar el paciente');
    }
  },

  // Eliminar un paciente
  async deletePatient(id: string) {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      throw new Error('Error al eliminar el paciente');
    }
  },

  // Obtener estadísticas de pacientes
  async getPatientStats() {
    try {
      const [
        { count: totalPatients },
        { count: malePatients },
        { count: femalePatients },
        { count: activePatients },
        { count: visitsThisMonth }
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('gender', 'M'),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('gender', 'F'),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
        // Contar pacientes con última visita este mes (no pacientes creados)
        supabase.from('patients').select('*', { count: 'exact', head: true })
          .not('last_visit', 'is', null)
          .gte('last_visit', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ]);

      return {
        total: totalPatients || 0,
        male: malePatients || 0,
        female: femalePatients || 0,
        active: activePatients || 0,
        thisMonth: visitsThisMonth || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de pacientes:', error);
      throw new Error('Error al obtener estadísticas');
    }
  },

         // Buscar pacientes por criterios específicos
         async searchPatients(criteria: {
           name?: string;
           email?: string;
           phone?: string;
           gender?: 'M' | 'F';
           status?: string;
           bloodType?: string;
           district?: string;
           primaryPhysician?: string;
         }) {
    try {
      let query = supabase.from('patients').select('*');

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
      
      if (criteria.bloodType) {
        query = query.eq('blood_type', criteria.bloodType);
      }

      if (criteria.district) {
        query = query.ilike('district', `%${criteria.district}%`);
      }

      if (criteria.primaryPhysician) {
        query = query.ilike('primary_physician', `%${criteria.primaryPhysician}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      throw new Error('Error al buscar pacientes');
    }
  },

  // Obtener distritos disponibles
  async getDistricts() {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('name, zone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener distritos:', error);
      throw new Error('Error al obtener distritos');
    }
  },

  // Exportar pacientes a diferentes formatos
  async exportPatients(format: 'csv' | 'json' = 'json') {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'csv') {
               // Convertir a CSV
               const headers = [
                 'ID', 'Nombre', 'Email', 'Teléfono', 'Edad', 'Género', 
                 'Dirección', 'Distrito', 'Última Visita', 'Estado', 'Tipo de Sangre', 
                 'Alergias', 'Contacto Emergencia', 'Teléfono Emergencia', 
                 'Médico Tratante', 'Medicamentos', 'Diagnóstico Principal', 'Fecha de Creación'
               ];

        const csvRows = [headers.join(',')];
        
        data.forEach(patient => {
               const row = [
                 patient.id,
                 `"${patient.name}"`,
                 `"${patient.email || ''}"`,
                 `"${patient.phone || ''}"`,
                 patient.age,
                 patient.gender,
                 `"${patient.address || ''}"`,
                 `"${patient.district || ''}"`,
                 patient.last_visit || '',
                 patient.status,
                 `"${patient.blood_type || ''}"`,
                 `"${patient.allergies?.join('; ') || ''}"`,
                 `"${patient.emergency_contact_name || ''}"`,
                 `"${patient.emergency_contact_phone || ''}"`,
                 `"${patient.primary_physician || ''}"`,
                 `"${patient.current_medications?.join('; ') || ''}"`,
                 `"${patient.primary_diagnosis || ''}"`,
                 patient.created_at
               ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
      }

      return data;
    } catch (error) {
      console.error('Error al exportar pacientes:', error);
      throw new Error('Error al exportar pacientes');
    }
  }
};

export default patientsService;
