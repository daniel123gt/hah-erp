import supabase from "~/utils/supabase";

export interface NursingInitialAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  nurse_name: string;
  
  // Datos del paciente
  age?: number;
  weight?: number; // KG
  height?: number; // CM (TALLA)
  blood_type?: string; // TIPO DE SANGRE
  medical_diagnosis?: string; // DX MEDICO
  
  // Médico tratante
  attending_physician?: string; // MEDICO TRATANTE
  
  // Antecedentes
  pathological_history?: string; // ANTECEDENTES PATOLÓGICOS IMPORTANTES
  prophylactic_medications?: string; // MEDICAMENTOS PROFILACTICOS HABITUALES
  medication_allergies?: string; // ALERGIA A MEDICAMENTOS
  
  // Signos vitales
  vital_signs?: {
    blood_pressure_systolic?: string; // T.A. parte alta
    blood_pressure_diastolic?: string; // T.A. parte baja
    heart_rate?: number; // FC (X')
    respiratory_rate?: number; // FR (X')
    oxygen_saturation?: number; // SATO2 (%)
    temperature?: number; // TEMP
    capillary_glucose?: number; // GLICEMIA CAPILAR (mg/dl)
    vital_signs_time?: string; // HORA
  };
  
  // Examen físico
  physical_exam?: {
    neurological?: string; // VALORACION NEUROLOGICA
    cardiovascular?: string; // VALORACION CARDIOVASCULAR
    respiratory?: string; // VALORACION RESPIRATORIA
    gastrointestinal?: string; // VALORACION GASTROINTESTINAL
    genitourinary?: string; // VALORACION GENITOURINARIO
    extremities?: string; // MIEMBROS SUPERIORES E INFERIORES
  };
  
  // Acciones de enfermería
  nursing_actions?: string; // ACCIONES DE ENFERMERIA
  pending_actions?: string; // ACCIONES PENDIENTES
  
  created_at: string;
  updated_at: string;
}

export interface CreateNursingInitialAssessmentData {
  patient_id: string;
  assessment_date: string;
  nurse_name: string;
  age?: number;
  weight?: number;
  height?: number;
  blood_type?: string;
  medical_diagnosis?: string;
  attending_physician?: string;
  pathological_history?: string;
  prophylactic_medications?: string;
  medication_allergies?: string;
  vital_signs?: {
    blood_pressure_systolic?: string;
    blood_pressure_diastolic?: string;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    temperature?: number;
    capillary_glucose?: number;
    vital_signs_time?: string;
  };
  physical_exam?: {
    neurological?: string;
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    genitourinary?: string;
    extremities?: string;
  };
  nursing_actions?: string;
  pending_actions?: string;
}

export interface UpdateNursingInitialAssessmentData extends Partial<CreateNursingInitialAssessmentData> {
  id: string;
}

export const nursingInitialAssessmentService = {
  async getByPatient(patientId: string): Promise<NursingInitialAssessment | null> {
    const { data, error } = await supabase
      .from('nursing_initial_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data as NursingInitialAssessment;
  },

  async getAllByPatient(patientId: string): Promise<NursingInitialAssessment[]> {
    const { data, error } = await supabase
      .from('nursing_initial_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as NursingInitialAssessment[];
  },

  async getAll(): Promise<NursingInitialAssessment[]> {
    const { data, error } = await supabase
      .from('nursing_initial_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as NursingInitialAssessment[];
  },

  async create(assessment: CreateNursingInitialAssessmentData): Promise<NursingInitialAssessment> {
    const { data, error } = await supabase
      .from('nursing_initial_assessments')
      .insert([assessment])
      .select()
      .single();
    
    if (error) throw error;
    return data as NursingInitialAssessment;
  },

  async update(assessment: UpdateNursingInitialAssessmentData): Promise<NursingInitialAssessment> {
    const { id, ...update } = assessment;
    const { data, error } = await supabase
      .from('nursing_initial_assessments')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NursingInitialAssessment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('nursing_initial_assessments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export default nursingInitialAssessmentService;
