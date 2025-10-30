import supabase from "~/utils/supabase";

// Tipos para los datos de contratos
export interface PatientContract {
  id: string;
  patient_id: string;
  contract_number: string;
  contract_date: string;
  responsible_family_member: string;
  service_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  monthly_amount: number;
  hourly_rate?: number;
  payment_method: string;
  status: 'Activo' | 'Inactivo' | 'Suspendido' | 'Finalizado';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  patient?: {
    id: string;
    name: string;
    district?: string;
    emergency_contact_name?: string;
  };
}

export interface CreateContractData {
  patient_id: string;
  contract_number?: string;
  contract_date: string;
  responsible_family_member: string;
  service_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  monthly_amount: number;
  hourly_rate?: number;
  payment_method: string;
  status?: 'Activo' | 'Inactivo' | 'Suspendido' | 'Finalizado';
  notes?: string;
}

export interface UpdateContractData extends Partial<CreateContractData> {
  id: string;
}

// Servicio para operaciones CRUD de contratos
export const contractsService = {
  // Obtener todos los contratos con paginación y filtros
  async getContracts(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    serviceType?: string;
    patientId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '',
        serviceType = '',
        patientId = '',
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = options;
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('patient_contracts')
        .select(`
          *,
          patients!inner(
            id,
            name,
            district,
            emergency_contact_name
          )
        `, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      // Aplicar filtro de búsqueda
      if (search) {
        query = query.or(`contract_number.ilike.%${search}%,responsible_family_member.ilike.%${search}%,patients.name.ilike.%${search}%`);
      }

      // Aplicar filtro de estado
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Aplicar filtro de tipo de servicio
      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      // Aplicar filtro de paciente
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as PatientContract[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page < Math.ceil((count || 0) / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      throw new Error('Error al obtener la lista de contratos');
    }
  },

  // Obtener contrato por ID
  async getContractById(id: string) {
    try {
      const { data, error } = await supabase
        .from('patient_contracts')
        .select(`
          *,
          patients!inner(
            id,
            name,
            district,
            emergency_contact_name,
            phone,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PatientContract;
    } catch (error) {
      console.error('Error al obtener contrato:', error);
      throw new Error('Error al obtener los datos del contrato');
    }
  },

  // Crear nuevo contrato
  async createContract(contractData: CreateContractData) {
    try {
      // Generar número de contrato si no se proporciona
      if (!contractData.contract_number) {
        const year = new Date().getFullYear();
        const { count } = await supabase
          .from('patient_contracts')
          .select('*', { count: 'exact', head: true })
          .like('contract_number', `CON-${year}-%`);
        
        const contractNumber = `CON-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
        contractData.contract_number = contractNumber;
      }

      const { data, error } = await supabase
        .from('patient_contracts')
        .insert([contractData])
        .select(`
          *,
          patients!inner(
            id,
            name,
            district,
            emergency_contact_name
          )
        `)
        .single();

      if (error) throw error;
      return data as PatientContract;
    } catch (error) {
      console.error('Error al crear contrato:', error);
      throw new Error('Error al crear el contrato');
    }
  },

  // Actualizar contrato
  async updateContract(contractData: UpdateContractData) {
    try {
      const { id, ...updateData } = contractData;
      
      const { data, error } = await supabase
        .from('patient_contracts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          patients!inner(
            id,
            name,
            district,
            emergency_contact_name
          )
        `)
        .single();

      if (error) throw error;
      return data as PatientContract;
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      throw new Error('Error al actualizar el contrato');
    }
  },

  // Eliminar contrato
  async deleteContract(id: string) {
    try {
      const { error } = await supabase
        .from('patient_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      throw new Error('Error al eliminar el contrato');
    }
  },

  // Obtener estadísticas de contratos
  async getContractStats() {
    try {
      const [
        { count: totalContracts },
        { count: activeContracts },
        { count: inactiveContracts },
        { count: suspendedContracts },
        { count: finishedContracts }
      ] = await Promise.all([
        supabase.from('patient_contracts').select('*', { count: 'exact', head: true }),
        supabase.from('patient_contracts').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
        supabase.from('patient_contracts').select('*', { count: 'exact', head: true }).eq('status', 'Inactivo'),
        supabase.from('patient_contracts').select('*', { count: 'exact', head: true }).eq('status', 'Suspendido'),
        supabase.from('patient_contracts').select('*', { count: 'exact', head: true }).eq('status', 'Finalizado')
      ]);

      return {
        total: totalContracts || 0,
        active: activeContracts || 0,
        inactive: inactiveContracts || 0,
        suspended: suspendedContracts || 0,
        finished: finishedContracts || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de contratos:', error);
      throw new Error('Error al obtener estadísticas');
    }
  },

  // Buscar contratos por criterios específicos
  async searchContracts(criteria: {
    contractNumber?: string;
    patientName?: string;
    familyMember?: string;
    serviceType?: string;
    status?: string;
    district?: string;
  }) {
    try {
      let query = supabase
        .from('patient_contracts')
        .select(`
          *,
          patients!inner(
            id,
            name,
            district,
            emergency_contact_name
          )
        `);

      if (criteria.contractNumber) {
        query = query.ilike('contract_number', `%${criteria.contractNumber}%`);
      }
      
      if (criteria.patientName) {
        query = query.ilike('patients.name', `%${criteria.patientName}%`);
      }
      
      if (criteria.familyMember) {
        query = query.ilike('responsible_family_member', `%${criteria.familyMember}%`);
      }
      
      if (criteria.serviceType) {
        query = query.eq('service_type', criteria.serviceType);
      }
      
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      
      if (criteria.district) {
        query = query.ilike('patients.district', `%${criteria.district}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientContract[];
    } catch (error) {
      console.error('Error al buscar contratos:', error);
      throw new Error('Error al buscar contratos');
    }
  },

  // Obtener contratos por paciente
  async getContractsByPatient(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patient_contracts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientContract[];
    } catch (error) {
      console.error('Error al obtener contratos del paciente:', error);
      throw new Error('Error al obtener contratos del paciente');
    }
  },

  // Exportar datos de contratos
  async exportContractsData(format: 'csv' | 'json' = 'json') {
    try {
      const { data, error } = await supabase
        .from('patient_contracts')
        .select(`
          *,
          patients!inner(
            name,
            district,
            emergency_contact_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'csv') {
        const headers = [
          'ID', 'Número de Contrato', 'Paciente', 'Distrito', 'Familiar Responsable',
          'Tipo de Servicio', 'Fecha de Contrato', 'Fecha de Inicio', 'Fecha de Fin',
          'Monto Mensual', 'Método de Pago', 'Estado', 'Notas', 'Fecha de Creación'
        ];

        const csvRows = [headers.join(',')];
        
        data.forEach(contract => {
          const row = [
            contract.id,
            `"${contract.contract_number}"`,
            `"${contract.patients.name}"`,
            `"${contract.patients.district || ''}"`,
            `"${contract.responsible_family_member}"`,
            `"${contract.service_type}"`,
            contract.contract_date,
            contract.start_date,
            contract.end_date || '',
            contract.monthly_amount,
            `"${contract.payment_method}"`,
            `"${contract.status}"`,
            `"${contract.notes || ''}"`,
            contract.created_at
          ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
      }

      return data;
    } catch (error) {
      console.error('Error al exportar contratos:', error);
      throw new Error('Error al exportar contratos');
    }
  }
};

export default contractsService;
