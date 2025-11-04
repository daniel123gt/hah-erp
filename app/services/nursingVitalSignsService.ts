import supabase from "~/utils/supabase";

export interface NursingVitalSignEntry {
  id: string;
  patient_id: string;
  assessment_datetime: string; // ISO
  nurse_name: string;
  blood_pressure_systolic?: string;
  blood_pressure_diastolic?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  spo2?: number;
  temperature?: number;
  capillary_glucose?: number;
  observation?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNursingVitalSignEntry {
  patient_id: string;
  assessment_datetime: string; // ISO
  nurse_name: string;
  blood_pressure_systolic?: string;
  blood_pressure_diastolic?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  spo2?: number;
  temperature?: number;
  capillary_glucose?: number;
  observation?: string;
}

export interface UpdateNursingVitalSignEntry extends Partial<CreateNursingVitalSignEntry> {
  id: string;
}

const nursingVitalSignsService = {
  async getByPatient(patientId: string, limit = 50): Promise<NursingVitalSignEntry[]> {
    const { data, error } = await supabase
      .from('nursing_vital_signs')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_datetime', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as NursingVitalSignEntry[];
  },

  async getAll(limit = 100): Promise<NursingVitalSignEntry[]> {
    const { data, error } = await supabase
      .from('nursing_vital_signs')
      .select('*')
      .order('assessment_datetime', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as NursingVitalSignEntry[];
  },

  async create(entry: CreateNursingVitalSignEntry): Promise<NursingVitalSignEntry> {
    const { data, error } = await supabase
      .from('nursing_vital_signs')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data as NursingVitalSignEntry;
  },

  async update(entry: UpdateNursingVitalSignEntry): Promise<NursingVitalSignEntry> {
    const { id, ...update } = entry;
    const { data, error } = await supabase
      .from('nursing_vital_signs')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as NursingVitalSignEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('nursing_vital_signs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export default nursingVitalSignsService;
