import supabase from "~/utils/supabase";

export interface PatientHistory {
  id: string;
  patient_id: string;
  entry_date: string; // date
  entry_type: string; // e.g., Consulta, Diagnóstico, Prescripción, Procedimiento
  title: string;
  notes?: string;
  attachments?: string[]; // optional: URLs or file ids
  created_at: string;
  updated_at: string;
}

export interface CreatePatientHistoryData {
  patient_id: string;
  entry_date: string;
  entry_type: string;
  title: string;
  notes?: string;
  attachments?: string[];
}

export interface UpdatePatientHistoryData extends Partial<CreatePatientHistoryData> {
  id: string;
}

export const patientHistoryService = {
  async getHistoryByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('patient_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('entry_date', { ascending: false });
    if (error) throw error;
    return (data || []) as PatientHistory[];
  },

  async createEntry(entry: CreatePatientHistoryData) {
    const { data, error } = await supabase
      .from('patient_history')
      .insert([entry])
      .select()
      .single();
    if (error) throw error;
    return data as PatientHistory;
  },

  async updateEntry(entry: UpdatePatientHistoryData) {
    const { id, ...update } = entry;
    const { data, error } = await supabase
      .from('patient_history')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PatientHistory;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('patient_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true } as const;
  }
};

export default patientHistoryService;


