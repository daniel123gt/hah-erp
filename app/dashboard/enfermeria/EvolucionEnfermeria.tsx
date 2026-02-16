import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { PainScaleSelector } from "~/components/ui/pain-scale-selector";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, Plus, Trash2, Save } from "lucide-react";
import patientsService from "~/services/patientsService";
import nursingEvolutionsService, {
  type NursingEvolution,
  type NursingEvolutionRecord,
  type CreateNursingEvolutionData,
  type CreateEvolutionRecordData
} from "~/services/nursingEvolutionsService";

export default function EvolucionEnfermeria() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [currentEvolution, setCurrentEvolution] = useState<NursingEvolution | null>(null);
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false);

  // Formulario estático
  const [form, setForm] = useState<CreateNursingEvolutionData>({
    patient_id: "",
    patient_name: "",
    age: undefined,
    evolution_date: new Date().toISOString().split('T')[0],
    shift: "",
    nurse_name: "",
    dependency_grade: "",
    nursing_assessment: "",
    pain_scale: undefined,
  });

  // Tabla de registros
  const [records, setRecords] = useState<Omit<NursingEvolutionRecord, 'id' | 'evolution_id' | 'created_at' | 'updated_at'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Nuevo registro
  const getInitialTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const [newRecord, setNewRecord] = useState<CreateEvolutionRecordData>({
    evolution_id: "",
    nanda_diagnosis: "",
    noc_objective: "",
    time: getInitialTime(),
    nic_interventions: "",
    evaluation: "",
    observation: "",
    record_order: 0,
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setIsSearching(true);
      const { data } = await patientsService.getPatients({ page: 1, limit: 10, search: searchTerm.trim() } as any);
      setPatientResults(data);
    } catch (e) {
      toast.error("Error al buscar pacientes");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    
    // Construir nombre completo
    const fullName = patient.name 
      ? patient.name 
      : `${patient.nombre || ''} ${patient.apellido_paterno || ''} ${patient.apellido_materno || ''}`.trim();
    
    // Obtener edad
    const patientAge = patient.age || patient.edad || undefined;
    
    setForm((f) => ({
      ...f,
      patient_id: patient.id,
      patient_name: fullName,
      age: patientAge,
    }));

    // Buscar evolución existente para este paciente hoy
    try {
      setIsLoadingEvolution(true);
      const evolutions = await nursingEvolutionsService.getByPatient(patient.id);
      const today = new Date().toISOString().split('T')[0];
      const todayEvolution = evolutions.find(e => e.evolution_date === today);
      
      if (todayEvolution) {
        setCurrentEvolution(todayEvolution);
        setForm({
          patient_id: todayEvolution.patient_id,
          patient_name: todayEvolution.patient_name,
          age: todayEvolution.age,
          evolution_date: todayEvolution.evolution_date,
          shift: todayEvolution.shift || "",
          nurse_name: todayEvolution.nurse_name,
          dependency_grade: todayEvolution.dependency_grade || "",
          nursing_assessment: todayEvolution.nursing_assessment || "",
          pain_scale: todayEvolution.pain_scale,
        });
        setRecords(todayEvolution.records?.map(r => ({
          nanda_diagnosis: r.nanda_diagnosis || "",
          noc_objective: r.noc_objective || "",
          time: r.time || "",
          nic_interventions: r.nic_interventions || "",
          evaluation: r.evaluation || "",
          observation: r.observation || "",
          record_order: r.record_order,
        })) || []);
      } else {
        setCurrentEvolution(null);
        setRecords([]);
      }
    } catch (e) {
      console.warn('Error al cargar evolución:', e);
      setCurrentEvolution(null);
      setRecords([]);
    } finally {
      setIsLoadingEvolution(false);
    }
  };

  const handleSaveEvolution = async () => {
    if (!selectedPatient) {
      toast.error("Selecciona un paciente");
      return;
    }
    if (!form.nurse_name) {
      toast.error("Ingresa el nombre de la enfermera(o)");
      return;
    }

    try {
      setIsSubmitting(true);
      let evolutionId: string;

      if (currentEvolution) {
        // Actualizar evolución existente
        const updated = await nursingEvolutionsService.update({
          id: currentEvolution.id,
          ...form,
        });
        evolutionId = updated.id;
        setCurrentEvolution(updated);
      } else {
        // Crear nueva evolución
        const created = await nursingEvolutionsService.create(form);
        evolutionId = created.id;
        setCurrentEvolution(created);
      }

      toast.success("Evolución guardada exitosamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar la evolución");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRecord = async () => {
    if (!currentEvolution) {
      toast.error("Debes guardar la evolución primero");
      return;
    }

    // Validar campos obligatorios
    if (!newRecord.time) {
      toast.error("La fecha y hora son obligatorias");
      return;
    }
    if (!newRecord.nic_interventions || !newRecord.nic_interventions.trim()) {
      toast.error("Las intervenciones de enfermería (NIC) son obligatorias");
      return;
    }
    if (!newRecord.evaluation || !newRecord.evaluation.trim()) {
      toast.error("La evaluación es obligatoria");
      return;
    }

    try {
      setIsSavingRecord(true);
      const recordData: CreateEvolutionRecordData = {
        ...newRecord,
        evolution_id: currentEvolution.id,
        record_order: records.length,
      };

      await nursingEvolutionsService.addRecord(recordData);
      toast.success("Registro agregado exitosamente");

      // Recargar la evolución para obtener los registros actualizados
      const updated = await nursingEvolutionsService.getById(currentEvolution.id);
      setCurrentEvolution(updated);
      setRecords(updated.records?.map(r => ({
        nanda_diagnosis: r.nanda_diagnosis || "",
        noc_objective: r.noc_objective || "",
        time: r.time || "",
        nic_interventions: r.nic_interventions || "",
        evaluation: r.evaluation || "",
        observation: r.observation || "",
        record_order: r.record_order,
      })) || []);

      // Limpiar formulario de nuevo registro
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setNewRecord({
        evolution_id: "",
        nanda_diagnosis: "",
        noc_objective: "",
        time: `${dateStr} ${timeStr}`,
        nic_interventions: "",
        evaluation: "",
        observation: "",
        record_order: records.length + 1,
      });
    } catch (e: any) {
      toast.error(e?.message || "Error al agregar el registro");
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!currentEvolution) return;

    try {
      await nursingEvolutionsService.deleteRecord(recordId);
      toast.success("Registro eliminado exitosamente");

      // Recargar la evolución
      const updated = await nursingEvolutionsService.getById(currentEvolution.id);
      setCurrentEvolution(updated);
      setRecords(updated.records?.map(r => ({
        nanda_diagnosis: r.nanda_diagnosis || "",
        noc_objective: r.noc_objective || "",
        time: r.time || "",
        nic_interventions: r.nic_interventions || "",
        evaluation: r.evaluation || "",
        observation: r.observation || "",
        record_order: r.record_order,
      })) || []);
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar el registro");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/enfermeria")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Evolución de Enfermería</h1>
      </div>

      {/* Buscar / Seleccionar Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedPatient ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Buscar por nombre, nro. documento, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Buscar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div>
                <p className="font-medium text-gray-900">{form.patient_name}</p>
                <p className="text-sm text-gray-600">{selectedPatient.email || selectedPatient.dni}</p>
              </div>
              <Button variant="outline" onClick={() => {
                setSelectedPatient(null);
                setPatientResults([]);
                setCurrentEvolution(null);
                setRecords([]);
                setForm({
                  patient_id: "",
                  patient_name: "",
                  age: undefined,
                  evolution_date: new Date().toISOString().split('T')[0],
                  shift: "",
                  nurse_name: "",
                  dependency_grade: "",
                  nursing_assessment: "",
                  pain_scale: undefined,
                });
              }}>
                Cambiar
              </Button>
            </div>
          )}

          {!selectedPatient && patientResults.length > 0 && (
            <div className="mt-3 border rounded divide-y">
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left p-3 hover:bg-gray-50"
                  onClick={() => handleSelectPatient(p)}
                >
                  <div className="font-medium text-gray-900">
                    {p.nombre} {p.apellido_paterno || ''} {p.apellido_materno || ''}
                  </div>
                  <div className="text-sm text-gray-600">{p.email || p.dni}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          {/* Formulario de Evolución */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Formulario de Evolución</CardTitle>
                <Button onClick={handleSaveEvolution} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Evolución
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Apellidos y Nombres</Label>
                  <Input 
                    value={form.patient_name} 
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })} 
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Edad</Label>
                  <Input 
                    type="number" 
                    value={form.age ?? ''} 
                    onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })} 
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={form.evolution_date} onChange={(e) => setForm({ ...form, evolution_date: e.target.value })} />
                </div>
                <div>
                  <Label>Turno</Label>
                  <Select value={form.shift || ''} onValueChange={(value) => setForm({ ...form, shift: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mañana">Mañana</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noche">Noche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Enfermera(o)</Label>
                  <Input value={form.nurse_name} onChange={(e) => setForm({ ...form, nurse_name: e.target.value })} required />
                </div>
                <div>
                  <Label>G. de Dependencia</Label>
                  <Select value={form.dependency_grade || ''} onValueChange={(value) => setForm({ ...form, dependency_grade: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grado 1">Grado 1</SelectItem>
                      <SelectItem value="Grado 2">Grado 2</SelectItem>
                      <SelectItem value="Grado 3">Grado 3</SelectItem>
                      <SelectItem value="Grado 4">Grado 4</SelectItem>
                      <SelectItem value="Grado 5">Grado 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valoración de Enfermería */}
              <div>
                <Label>Valoración de Enfermería</Label>
                <Textarea
                  value={form.nursing_assessment || ''}
                  onChange={(e) => setForm({ ...form, nursing_assessment: e.target.value })}
                  rows={6}
                  placeholder="Ingrese la valoración de enfermería..."
                  className="mt-2"
                />
              </div>

              {/* Escala de Dolor */}
              <div>
                <Label>Escala del Dolor</Label>
                <div className="mt-2">
                  <PainScaleSelector
                    value={form.pain_scale}
                    onChange={(value) => setForm({ ...form, pain_scale: value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Registros */}
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle>Registros de Evolución</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentEvolution && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Debes guardar la evolución primero para poder agregar registros.
                    </p>
                  </div>
                )}
                {/* Formulario para agregar nuevo registro */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">Agregar Nuevo Registro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>DX. ENF. (NANDA)</Label>
                      <Input
                        value={newRecord.nanda_diagnosis || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, nanda_diagnosis: e.target.value })}
                        placeholder="Diagnóstico de enfermería (opcional)"
                      />
                    </div>
                    <div>
                      <Label>OBJ./NOC</Label>
                      <Input
                        value={newRecord.noc_objective || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, noc_objective: e.target.value })}
                        placeholder="Objetivo/NOC (opcional)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Fecha y Hora <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={newRecord.time ? new Date(newRecord.time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const date = e.target.value;
                            const time = newRecord.time?.split(' ')[1] || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            setNewRecord({ ...newRecord, time: `${date} ${time}` });
                          }}
                          required
                        />
                        <Input
                          type="time"
                          value={newRecord.time?.split(' ')[1] || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          onChange={(e) => {
                            const date = newRecord.time?.split(' ')[0] || new Date().toISOString().split('T')[0];
                            setNewRecord({ ...newRecord, time: `${date} ${e.target.value}` });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>INTERVENCIONES DE ENFERMERIA (NIC) <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={newRecord.nic_interventions || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, nic_interventions: e.target.value })}
                        placeholder="Intervenciones de enfermería (obligatorio)"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>EVALUACION <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={newRecord.evaluation || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, evaluation: e.target.value })}
                        placeholder="Evaluación (obligatorio)"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>OBSERVACION</Label>
                      <Textarea
                        value={newRecord.observation || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, observation: e.target.value })}
                        placeholder="Observación (opcional)"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddRecord} 
                    disabled={isSavingRecord || !newRecord.time || !newRecord.nic_interventions || !newRecord.evaluation} 
                    className="mt-4"
                  >
                    {isSavingRecord ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Agregar Registro
                  </Button>
                </div>

                {/* Tabla de registros existentes */}
                {currentEvolution && currentEvolution.records && currentEvolution.records.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DX. ENF. (NANDA)</TableHead>
                          <TableHead>OBJ./NOC</TableHead>
                          <TableHead>FECHA Y HORA</TableHead>
                          <TableHead>INTERVENCIONES (NIC)</TableHead>
                          <TableHead>EVALUACION</TableHead>
                          <TableHead>OBSERVACION</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEvolution.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.nanda_diagnosis || '-'}</TableCell>
                            <TableCell>{record.noc_objective || '-'}</TableCell>
                            <TableCell>
                              {record.time ? (
                                record.time.includes(' ') ? (
                                  <>
                                    <div>{new Date(record.time.split(' ')[0]).toLocaleDateString('es-ES')}</div>
                                    <div className="text-sm text-gray-500">{record.time.split(' ')[1]}</div>
                                  </>
                                ) : (
                                  record.time
                                )
                              ) : '-'}
                            </TableCell>
                            <TableCell className="max-w-md">{record.nic_interventions || '-'}</TableCell>
                            <TableCell className="max-w-md">{record.evaluation || '-'}</TableCell>
                            <TableCell className="max-w-md">{record.observation || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : currentEvolution ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay registros. Agrega el primer registro usando el formulario arriba.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

