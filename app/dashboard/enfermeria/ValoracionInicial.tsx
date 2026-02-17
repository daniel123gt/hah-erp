import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Search, UserPlus } from "lucide-react";
import { Combobox } from "~/components/ui/combobox";
import patientsService, { type Patient } from "~/services/patientsService";
import nursingInitialAssessmentService from "~/services/nursingInitialAssessmentService";
import { staffService } from "~/services/staffService";
import { getDepartmentForCategory } from "~/dashboard/personal/categories";

export default function ValoracionInicial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");

  const [nurses, setNurses] = useState<{ name: string }[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Datos del formulario de valoración (según documento)
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    nurse_name: "",
    // Datos del paciente
    age: "",
    weight: "",
    height: "",
    blood_type: "",
    medical_diagnosis: "",
    // Médico tratante
    attending_physician: "",
    // Antecedentes
    pathological_history: "",
    prophylactic_medications: "",
    medication_allergies: "",
    // Signos vitales
    vital_signs: {
      blood_pressure_systolic: "",
      blood_pressure_diastolic: "",
      heart_rate: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      temperature: "",
      capillary_glucose: "",
      vital_signs_time: "",
    },
    // Examen físico (solo los campos del documento)
    physical_exam: {
      neurological: "",
      cardiovascular: "",
      respiratory: "",
      gastrointestinal: "",
      genitourinary: "",
      extremities: "",
    },
    // Acciones de enfermería
    nursing_actions: "",
    pending_actions: "",
  });

  // Datos para nuevo paciente
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const department = getDepartmentForCategory("enfermeria");
    if (department) {
      staffService.getStaff({ limit: 200, department, status: "Activo" }).then((res) =>
        setNurses(res.data.map((s) => ({ name: s.name })))
      ).catch(() => setNurses([]));
    }
  }, []);

  useEffect(() => {
    if (patientIdFromUrl) {
      loadPatient(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

  const loadPatient = async (id: string) => {
    try {
      setIsLoading(true);
      const patientData = await patientsService.getPatientById(id);
      if (patientData) {
        setPatient(patientData);
      } else {
        toast.error("Paciente no encontrado");
      }
    } catch (error) {
      console.error("Error al cargar paciente:", error);
      toast.error("Error al cargar el paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }

    try {
      setIsSearching(true);
      const results = await patientsService.getPatients({
        search: searchTerm,
        limit: 10,
      });
      setSearchResults(results.data);
      
      if (results.data.length === 0) {
        toast.info("No se encontraron pacientes. Puedes crear uno nuevo.");
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      toast.error("Error al buscar pacientes");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (selectedPatient: Patient) => {
    setPatient(selectedPatient);
    setSearchResults([]);
    setSearchTerm("");
    setShowNewPatientForm(false);
  };

  const handleCreateNewPatient = async () => {
    if (!newPatientData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      setIsLoading(true);
      const newPatient = await patientsService.createPatient({
        name: newPatientData.name,
        email: newPatientData.email || undefined,
        phone: newPatientData.phone || undefined,
        address: newPatientData.address || undefined,
      });
      
      setPatient(newPatient);
      setShowNewPatientForm(false);
      setNewPatientData({ name: "", email: "", phone: "", address: "" });
      toast.success("Paciente creado exitosamente");
    } catch (error) {
      console.error("Error al crear paciente:", error);
      toast.error("Error al crear el paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient) {
      toast.error("Debes seleccionar o crear un paciente primero");
      return;
    }

    if (!formData.nurse_name.trim()) {
      toast.error("El nombre del enfermero/a es requerido");
      return;
    }

    try {
      setIsLoading(true);
      
      const assessmentData = {
        patient_id: patient.id,
        assessment_date: formData.assessment_date,
        nurse_name: formData.nurse_name,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        blood_type: formData.blood_type || undefined,
        medical_diagnosis: formData.medical_diagnosis || undefined,
        attending_physician: formData.attending_physician || undefined,
        pathological_history: formData.pathological_history || undefined,
        prophylactic_medications: formData.prophylactic_medications || undefined,
        medication_allergies: formData.medication_allergies || undefined,
        vital_signs: {
          blood_pressure_systolic: formData.vital_signs.blood_pressure_systolic || undefined,
          blood_pressure_diastolic: formData.vital_signs.blood_pressure_diastolic || undefined,
          heart_rate: formData.vital_signs.heart_rate ? parseInt(formData.vital_signs.heart_rate) : undefined,
          respiratory_rate: formData.vital_signs.respiratory_rate ? parseInt(formData.vital_signs.respiratory_rate) : undefined,
          oxygen_saturation: formData.vital_signs.oxygen_saturation ? parseFloat(formData.vital_signs.oxygen_saturation) : undefined,
          temperature: formData.vital_signs.temperature ? parseFloat(formData.vital_signs.temperature) : undefined,
          capillary_glucose: formData.vital_signs.capillary_glucose ? parseFloat(formData.vital_signs.capillary_glucose) : undefined,
          vital_signs_time: formData.vital_signs.vital_signs_time || undefined,
        },
        physical_exam: formData.physical_exam,
        nursing_actions: formData.nursing_actions || undefined,
        pending_actions: formData.pending_actions || undefined,
      };

      await nursingInitialAssessmentService.create(assessmentData);
      toast.success("Valoración inicial guardada exitosamente");
      navigate(`/pacientes/${patient.id}`);
    } catch (error) {
      console.error("Error al guardar valoración:", error);
      toast.error("Error al guardar la valoración inicial");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/enfermeria")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Valoración Inicial de Enfermería</h1>
        </div>
      </div>

      {/* Selección de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!patient ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={() => setShowNewPatientForm(!showNewPatientForm)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Paciente
                </Button>
              </div>

              {/* Formulario de Nuevo Paciente */}
              {showNewPatientForm && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Crear Nuevo Paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newPatientData.email}
                          onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          placeholder="Teléfono"
                        />
                      </div>
                      <div>
                        <Label>Dirección</Label>
                        <Input
                          value={newPatientData.address}
                          onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                          placeholder="Dirección"
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateNewPatient} disabled={isLoading}>
                      Crear Paciente
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Resultados:</h3>
                  {searchResults.map((p) => (
                    <Card
                      key={p.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectPatient(p)}
                    >
                      <CardContent className="p-4">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.email || p.phone || 'Sin contacto'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Paciente seleccionado: {patient.name}</p>
                <p className="text-sm text-gray-600">{patient.email || patient.phone || 'Sin contacto'}</p>
              </div>
              <Button variant="outline" onClick={() => setPatient(null)}>
                Cambiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario de Valoración */}
      {patient && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Valoración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Valoración *</Label>
                  <Input
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Enfermero/a *</Label>
                  <Combobox
                    options={nurses.map((n) => ({ value: n.name, label: n.name }))}
                    value={formData.nurse_name}
                    onValueChange={(value) => setFormData({ ...formData, nurse_name: value })}
                    placeholder="Nombre del enfermero/a"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signos Vitales */}
          <Card>
            <CardHeader>
              <CardTitle>Signos Vitales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>T.A. Sistólica (mmHg)</Label>
                  <Input
                    value={formData.vital_signs.blood_pressure_systolic}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, blood_pressure_systolic: e.target.value }
                    })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label>T.A. Diastólica (mmHg)</Label>
                  <Input
                    value={formData.vital_signs.blood_pressure_diastolic}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, blood_pressure_diastolic: e.target.value }
                    })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label>FC (X')</Label>
                  <Input
                    type="number"
                    value={formData.vital_signs.heart_rate}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, heart_rate: e.target.value }
                    })}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label>FR (X')</Label>
                  <Input
                    type="number"
                    value={formData.vital_signs.respiratory_rate}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, respiratory_rate: e.target.value }
                    })}
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label>SATO2 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vital_signs.oxygen_saturation}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, oxygen_saturation: e.target.value }
                    })}
                    placeholder="98"
                  />
                </div>
                <div>
                  <Label>TEMP</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vital_signs.temperature}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, temperature: e.target.value }
                    })}
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <Label>Glicemia Capilar (mg/dl)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vital_signs.capillary_glucose}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, capillary_glucose: e.target.value }
                    })}
                    placeholder="90"
                  />
                </div>
                <div>
                  <Label>HORA</Label>
                  <Input
                    type="time"
                    value={formData.vital_signs.vital_signs_time}
                    onChange={(e) => setFormData({
                      ...formData,
                      vital_signs: { ...formData.vital_signs, vital_signs_time: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Edad</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Años"
                  />
                </div>
                <div>
                  <Label>Peso (KG)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="kg"
                  />
                </div>
                <div>
                  <Label>Talla (CM)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div>
                  <Label>Tipo de Sangre</Label>
                  <Input
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    placeholder="Ej: O+"
                  />
                </div>
                <div className="col-span-4">
                  <Label>DX Médico</Label>
                  <Textarea
                    value={formData.medical_diagnosis}
                    onChange={(e) => setFormData({ ...formData, medical_diagnosis: e.target.value })}
                    placeholder="Diagnóstico médico"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Médico Tratante */}
          <Card>
            <CardHeader>
              <CardTitle>Médico Tratante</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Médico Tratante</Label>
                <Input
                  value={formData.attending_physician}
                  onChange={(e) => setFormData({ ...formData, attending_physician: e.target.value })}
                  placeholder="Nombre del médico tratante"
                />
              </div>
            </CardContent>
          </Card>

          {/* Antecedentes */}
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Antecedentes Patológicos Importantes</Label>
                <Textarea
                  value={formData.pathological_history}
                  onChange={(e) => setFormData({ ...formData, pathological_history: e.target.value })}
                  placeholder="Antecedentes patológicos importantes"
                  rows={3}
                />
              </div>
              <div>
                <Label>Medicamentos Profilácticos Habituales</Label>
                <Textarea
                  value={formData.prophylactic_medications}
                  onChange={(e) => setFormData({ ...formData, prophylactic_medications: e.target.value })}
                  placeholder="Medicamentos profilácticos habituales"
                  rows={3}
                />
              </div>
              <div>
                <Label>Alergia a Medicamentos</Label>
                <Textarea
                  value={formData.medication_allergies}
                  onChange={(e) => setFormData({ ...formData, medication_allergies: e.target.value })}
                  placeholder="Alergia a medicamentos"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Examen Físico */}
          <Card>
            <CardHeader>
              <CardTitle>Examen Físico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valoración Neurológica</Label>
                <Textarea
                  value={formData.physical_exam.neurological}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, neurological: e.target.value }
                  })}
                  rows={3}
                  placeholder="Valoración neurológica"
                />
              </div>
              <div>
                <Label>Valoración Cardiovascular</Label>
                <Textarea
                  value={formData.physical_exam.cardiovascular}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, cardiovascular: e.target.value }
                  })}
                  rows={3}
                  placeholder="Valoración cardiovascular"
                />
              </div>
              <div>
                <Label>Valoración Respiratoria</Label>
                <Textarea
                  value={formData.physical_exam.respiratory}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, respiratory: e.target.value }
                  })}
                  rows={3}
                  placeholder="Valoración respiratoria"
                />
              </div>
              <div>
                <Label>Valoración Gastrointestinal</Label>
                <Textarea
                  value={formData.physical_exam.gastrointestinal}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, gastrointestinal: e.target.value }
                  })}
                  rows={3}
                  placeholder="Valoración gastrointestinal"
                />
              </div>
              <div>
                <Label>Valoración Genitourinario</Label>
                <Textarea
                  value={formData.physical_exam.genitourinary}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, genitourinary: e.target.value }
                  })}
                  rows={3}
                  placeholder="Valoración genitourinario"
                />
              </div>
              <div>
                <Label>Miembros Superiores e Inferiores</Label>
                <Textarea
                  value={formData.physical_exam.extremities}
                  onChange={(e) => setFormData({
                    ...formData,
                    physical_exam: { ...formData.physical_exam, extremities: e.target.value }
                  })}
                  rows={3}
                  placeholder="Miembros superiores e inferiores"
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Enfermería */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Enfermería</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Acciones de Enfermería</Label>
                <Textarea
                  value={formData.nursing_actions}
                  onChange={(e) => setFormData({ ...formData, nursing_actions: e.target.value })}
                  rows={3}
                  placeholder="Acciones de enfermería realizadas"
                />
              </div>
              <div>
                <Label>Acciones Pendientes</Label>
                <Textarea
                  value={formData.pending_actions}
                  onChange={(e) => setFormData({ ...formData, pending_actions: e.target.value })}
                  rows={3}
                  placeholder="Acciones pendientes"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/enfermeria")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Guardando..." : "Guardar Valoración"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

