import supabase from "~/utils/supabase";

export interface ExamHistory {
  id: string;
  patient_id: string;
  exam_date: string; // date
  exam_type: string; // e.g., Laboratorio, Imagenología, Cardíaco, Neurológico
  exam_name: string;
  exam_code?: string; // código del examen
  results?: string; // resultados del examen
  notes?: string;
  ordered_by?: string; // médico que ordenó el examen
  performed_by?: string; // quien realizó el examen
  status: string; // Pendiente, En Proceso, Completado, Cancelado
  attachments?: string[]; // optional: URLs or file ids (resultados, imágenes, etc.)
  created_at: string;
  updated_at: string;
}

export interface CreateExamHistoryData {
  patient_id: string;
  exam_date: string;
  exam_type: string;
  exam_name: string;
  exam_code?: string;
  results?: string;
  notes?: string;
  ordered_by?: string;
  performed_by?: string;
  status?: string;
  attachments?: string[];
}

export interface UpdateExamHistoryData extends Partial<CreateExamHistoryData> {
  id: string;
}

export const examHistoryService = {
  async getHistoryByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('exam_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('exam_date', { ascending: false });
    if (error) throw error;
    return (data || []) as ExamHistory[];
  },

  async createEntry(entry: CreateExamHistoryData) {
    const { data, error } = await supabase
      .from('exam_history')
      .insert([{ ...entry, status: entry.status || 'Pendiente' }])
      .select()
      .single();
    if (error) throw error;
    return data as ExamHistory;
  },

  async updateEntry(entry: UpdateExamHistoryData) {
    const { id, ...update } = entry;
    const { data, error } = await supabase
      .from('exam_history')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ExamHistory;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('exam_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true } as const;
  }
};

export default examHistoryService;

