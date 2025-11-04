import supabase from "~/utils/supabase";

export interface EliminationRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  nurse_name: string;
  record_date: string;
  
  // Heces - Mañana
  feces_morning_count?: number;
  feces_morning_color?: string;
  feces_morning_appearance?: string;
  feces_morning_quantity?: string;
  
  // Heces - Tarde
  feces_afternoon_count?: number;
  feces_afternoon_color?: string;
  feces_afternoon_appearance?: string;
  feces_afternoon_quantity?: string;
  
  // Heces - Noche
  feces_night_count?: number;
  feces_night_color?: string;
  feces_night_appearance?: string;
  feces_night_quantity?: string;
  
  // Orina - Mañana
  urine_morning_count?: number;
  urine_morning_color?: string;
  urine_morning_odor?: string;
  urine_morning_quantity?: string;
  
  // Orina - Tarde
  urine_afternoon_count?: number;
  urine_afternoon_color?: string;
  urine_afternoon_odor?: string;
  urine_afternoon_quantity?: string;
  
  // Orina - Noche
  urine_night_count?: number;
  urine_night_color?: string;
  urine_night_odor?: string;
  urine_night_quantity?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateEliminationRecordData {
  patient_id: string;
  patient_name: string;
  age?: number;
  nurse_name: string;
  record_date: string;
  
  // Heces
  feces_morning_count?: number;
  feces_morning_color?: string;
  feces_morning_appearance?: string;
  feces_morning_quantity?: string;
  feces_afternoon_count?: number;
  feces_afternoon_color?: string;
  feces_afternoon_appearance?: string;
  feces_afternoon_quantity?: string;
  feces_night_count?: number;
  feces_night_color?: string;
  feces_night_appearance?: string;
  feces_night_quantity?: string;
  
  // Orina
  urine_morning_count?: number;
  urine_morning_color?: string;
  urine_morning_odor?: string;
  urine_morning_quantity?: string;
  urine_afternoon_count?: number;
  urine_afternoon_color?: string;
  urine_afternoon_odor?: string;
  urine_afternoon_quantity?: string;
  urine_night_count?: number;
  urine_night_color?: string;
  urine_night_odor?: string;
  urine_night_quantity?: string;
}

const eliminationRecordsService = {
  async create(data: CreateEliminationRecordData): Promise<EliminationRecord> {
    try {
      const { data: record, error } = await supabase
        .from('elimination_records')
        .insert([{
          ...data,
          record_date: new Date(data.record_date).toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      return record as EliminationRecord;
    } catch (error: any) {
      console.error('Error al crear registro de eliminación:', error);
      throw new Error(error?.message || 'Error al crear el registro');
    }
  },

  async getById(id: string): Promise<EliminationRecord> {
    try {
      const { data: record, error } = await supabase
        .from('elimination_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return record as EliminationRecord;
    } catch (error: any) {
      console.error('Error al obtener registro:', error);
      throw new Error(error?.message || 'Error al obtener el registro');
    }
  },

  async getByPatient(patientId: string, limit = 30): Promise<EliminationRecord[]> {
    try {
      const { data: records, error } = await supabase
        .from('elimination_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('record_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (records || []) as EliminationRecord[];
    } catch (error: any) {
      console.error('Error al obtener registros:', error);
      throw new Error(error?.message || 'Error al obtener los registros');
    }
  },

  async getByDate(patientId: string, date: string): Promise<EliminationRecord | null> {
    try {
      const dateStr = new Date(date).toISOString().split('T')[0];
      const { data: record, error } = await supabase
        .from('elimination_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('record_date', dateStr)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return record as EliminationRecord | null;
    } catch (error: any) {
      console.error('Error al obtener registro por fecha:', error);
      throw new Error(error?.message || 'Error al obtener el registro');
    }
  },

  async update(id: string, data: Partial<CreateEliminationRecordData>): Promise<EliminationRecord> {
    try {
      const updateData: any = { ...data };
      if (updateData.record_date) {
        updateData.record_date = new Date(updateData.record_date).toISOString().split('T')[0];
      }

      const { data: record, error } = await supabase
        .from('elimination_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return record as EliminationRecord;
    } catch (error: any) {
      console.error('Error al actualizar registro:', error);
      throw new Error(error?.message || 'Error al actualizar el registro');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('elimination_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al eliminar registro:', error);
      throw new Error(error?.message || 'Error al eliminar el registro');
    }
  }
};

export default eliminationRecordsService;

