import supabase from "~/utils/supabase";

export interface MedicalRest {
  id: string;
  patient_id: string;
  date: string;
  physician_name: string;
  reason: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

const medicalRestsService = {
  async getByPatient(patientId: string): Promise<MedicalRest[]> {
    try {
      const { data, error } = await supabase
        .from('medical_rests')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as MedicalRest[];
    } catch (error: any) {
      console.error('Error al obtener descansos médicos:', error);
      throw new Error(error?.message || 'Error al obtener los descansos médicos');
    }
  }
};

export default medicalRestsService;

