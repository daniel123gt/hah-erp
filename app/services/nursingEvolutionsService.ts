import supabase from "~/utils/supabase";

export interface NursingEvolutionRecord {
  id: string;
  evolution_id: string;
  nanda_diagnosis?: string;
  noc_objective?: string;
  time?: string;
  nic_interventions?: string;
  evaluation?: string;
  observation?: string;
  record_order: number;
  created_at: string;
  updated_at: string;
}

export interface NursingEvolution {
  id: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  evolution_date: string;
  shift?: string;
  nurse_name: string;
  dependency_grade?: string;
  nursing_assessment?: string;
  pain_scale?: number;
  created_at: string;
  updated_at: string;
  records?: NursingEvolutionRecord[];
}

export interface CreateNursingEvolutionData {
  patient_id: string;
  patient_name: string;
  age?: number;
  evolution_date: string;
  shift?: string;
  nurse_name: string;
  dependency_grade?: string;
  nursing_assessment?: string;
  pain_scale?: number;
}

export interface UpdateNursingEvolutionData extends Partial<CreateNursingEvolutionData> {
  id: string;
}

export interface CreateEvolutionRecordData {
  evolution_id: string;
  nanda_diagnosis?: string;
  noc_objective?: string;
  time?: string;
  nic_interventions?: string;
  evaluation?: string;
  observation?: string;
  record_order: number;
}

const nursingEvolutionsService = {
  async create(data: CreateNursingEvolutionData): Promise<NursingEvolution> {
    try {
      const { data: evolution, error } = await supabase
        .from('nursing_evolutions')
        .insert([{
          ...data,
          evolution_date: new Date(data.evolution_date).toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      return evolution as NursingEvolution;
    } catch (error: any) {
      console.error('Error al crear evolución:', error);
      throw new Error(error?.message || 'Error al crear la evolución de enfermería');
    }
  },

  async getById(id: string): Promise<NursingEvolution> {
    try {
      const { data: evolution, error } = await supabase
        .from('nursing_evolutions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Obtener registros
      const { data: records } = await supabase
        .from('nursing_evolution_records')
        .select('*')
        .eq('evolution_id', id)
        .order('record_order', { ascending: true });

      return {
        ...evolution,
        records: records || []
      } as NursingEvolution;
    } catch (error: any) {
      console.error('Error al obtener evolución:', error);
      throw new Error(error?.message || 'Error al obtener la evolución');
    }
  },

  async getByPatient(patientId: string): Promise<NursingEvolution[]> {
    try {
      const { data: evolutions, error } = await supabase
        .from('nursing_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .order('evolution_date', { ascending: false });

      if (error) throw error;

      // Obtener registros para cada evolución
      const evolutionsWithRecords = await Promise.all(
        (evolutions || []).map(async (evolution) => {
          const { data: records } = await supabase
            .from('nursing_evolution_records')
            .select('*')
            .eq('evolution_id', evolution.id)
            .order('record_order', { ascending: true });

          return {
            ...evolution,
            records: records || []
          } as NursingEvolution;
        })
      );

      return evolutionsWithRecords;
    } catch (error: any) {
      console.error('Error al obtener evoluciones:', error);
      throw new Error(error?.message || 'Error al obtener las evoluciones');
    }
  },

  async update(data: UpdateNursingEvolutionData): Promise<NursingEvolution> {
    try {
      const { id, ...updateData } = data;
      const updatePayload: any = { ...updateData };
      
      if (updatePayload.evolution_date) {
        updatePayload.evolution_date = new Date(updatePayload.evolution_date).toISOString().split('T')[0];
      }

      const { data: evolution, error } = await supabase
        .from('nursing_evolutions')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Obtener registros actualizados
      const { data: records } = await supabase
        .from('nursing_evolution_records')
        .select('*')
        .eq('evolution_id', id)
        .order('record_order', { ascending: true });

      return {
        ...evolution,
        records: records || []
      } as NursingEvolution;
    } catch (error: any) {
      console.error('Error al actualizar evolución:', error);
      throw new Error(error?.message || 'Error al actualizar la evolución');
    }
  },

  async addRecord(data: CreateEvolutionRecordData): Promise<NursingEvolutionRecord> {
    try {
      const { data: record, error } = await supabase
        .from('nursing_evolution_records')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return record as NursingEvolutionRecord;
    } catch (error: any) {
      console.error('Error al agregar registro:', error);
      throw new Error(error?.message || 'Error al agregar el registro');
    }
  },

  async updateRecord(recordId: string, data: Partial<CreateEvolutionRecordData>): Promise<NursingEvolutionRecord> {
    try {
      const { data: record, error } = await supabase
        .from('nursing_evolution_records')
        .update(data)
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return record as NursingEvolutionRecord;
    } catch (error: any) {
      console.error('Error al actualizar registro:', error);
      throw new Error(error?.message || 'Error al actualizar el registro');
    }
  },

  async deleteRecord(recordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('nursing_evolution_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al eliminar registro:', error);
      throw new Error(error?.message || 'Error al eliminar el registro');
    }
  }
};

export default nursingEvolutionsService;

