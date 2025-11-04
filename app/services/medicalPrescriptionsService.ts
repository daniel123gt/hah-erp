import supabase from "~/utils/supabase";

export interface MedicalPrescription {
  id: string;
  patient_id: string;
  date: string;
  physician_name: string;
  reason: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

const medicalPrescriptionsService = {
  async getByPatient(patientId: string): Promise<MedicalPrescription[]> {
    try {
      const { data, error } = await supabase
        .from('medical_prescriptions')
        .select('*')
        .order('date', { ascending: false })
        .eq('patient_id', patientId);

      if (error) throw error;
      return (data || []) as MedicalPrescription[];
    } catch (error: any) {
      console.error('Error al obtener recetas médicas:', error);
      throw new Error(error?.message || 'Error al obtener las recetas médicas');
    }
  }
};

export default medicalPrescriptionsService;

