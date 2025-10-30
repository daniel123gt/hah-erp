import supabase from "~/utils/supabase";

export interface NursingHistory {
  id: string;
  patient_id: string;
  entry_date: string; // date
  entry_type: string; // e.g., Atención de Enfermería, Control de Signos Vitales, Administración de Medicamentos, Cuidado de Heridas
  title: string;
  notes?: string;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
  };
  attachments?: string[]; // optional: URLs or file ids
  nurse_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNursingHistoryData {
  patient_id: string;
  entry_date: string;
  entry_type: string;
  title: string;
  notes?: string;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
  };
  attachments?: string[];
  nurse_name?: string;
}

export interface UpdateNursingHistoryData extends Partial<CreateNursingHistoryData> {
  id: string;
}

export const nursingHistoryService = {
  async getHistoryByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('nursing_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('entry_date', { ascending: false });
    if (error) throw error;
    return (data || []) as NursingHistory[];
  },

  async createEntry(entry: CreateNursingHistoryData) {
    const { data, error } = await supabase
      .from('nursing_history')
      .insert([entry])
      .select()
      .single();
    if (error) throw error;
    return data as NursingHistory;
  },

  async updateEntry(entry: UpdateNursingHistoryData) {
    const { id, ...update } = entry;
    const { data, error } = await supabase
      .from('nursing_history')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as NursingHistory;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('nursing_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true } as const;
  }
};

export default nursingHistoryService;

