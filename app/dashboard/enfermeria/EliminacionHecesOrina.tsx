import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, Save } from "lucide-react";
import patientsService from "~/services/patientsService";
import eliminationRecordsService, {
  type EliminationRecord,
  type CreateEliminationRecordData
} from "~/services/eliminationRecordsService";

export default function EliminacionHecesOrina() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [currentRecord, setCurrentRecord] = useState<EliminationRecord | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<EliminationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana');

  const [form, setForm] = useState<CreateEliminationRecordData>({
    patient_id: "",
    patient_name: "",
    age: undefined,
    nurse_name: "",
    record_date: new Date().toISOString().split('T')[0],
    // Inicializar todos los campos vacíos
    feces_morning_count: undefined,
    feces_morning_color: "",
    feces_morning_appearance: "",
    feces_morning_quantity: "",
    feces_afternoon_count: undefined,
    feces_afternoon_color: "",
    feces_afternoon_appearance: "",
    feces_afternoon_quantity: "",
    feces_night_count: undefined,
    feces_night_color: "",
    feces_night_appearance: "",
    feces_night_quantity: "",
    urine_morning_count: undefined,
    urine_morning_color: "",
    urine_morning_odor: "",
    urine_morning_quantity: "",
    urine_afternoon_count: undefined,
    urine_afternoon_color: "",
    urine_afternoon_odor: "",
    urine_afternoon_quantity: "",
    urine_night_count: undefined,
    urine_night_color: "",
    urine_night_odor: "",
    urine_night_quantity: "",
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
    
    const fullName = patient.name 
      ? patient.name 
      : `${patient.nombre || ''} ${patient.apellido_paterno || ''} ${patient.apellido_materno || ''}`.trim();
    
    const patientAge = patient.age || patient.edad || undefined;
    
    setForm((f) => ({
      ...f,
      patient_id: patient.id,
      patient_name: fullName,
      age: patientAge,
    }));

    // Cargar registro del día seleccionado
    await loadRecordForDate(form.record_date);
    
    // Cargar historial de registros
    await loadHistory();
  };

  const loadHistory = async () => {
    if (!selectedPatient) return;
    
    try {
      setLoadingHistory(true);
      const records = await eliminationRecordsService.getByPatient(selectedPatient.id, 30);
      setHistoryRecords(records);
    } catch (e) {
      console.warn('Error al cargar historial:', e);
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // useEffect se maneja en handleSelectPatient

  const loadRecordForDate = async (date: string) => {
    if (!selectedPatient) return;
    
    try {
      setIsLoadingRecord(true);
      const record = await eliminationRecordsService.getByDate(selectedPatient.id, date);
      
      if (record) {
        setCurrentRecord(record);
        setForm({
          patient_id: record.patient_id,
          patient_name: record.patient_name,
          age: record.age,
          nurse_name: record.nurse_name,
          record_date: record.record_date,
          feces_morning_count: record.feces_morning_count,
          feces_morning_color: record.feces_morning_color || "",
          feces_morning_appearance: record.feces_morning_appearance || "",
          feces_morning_quantity: record.feces_morning_quantity || "",
          feces_afternoon_count: record.feces_afternoon_count,
          feces_afternoon_color: record.feces_afternoon_color || "",
          feces_afternoon_appearance: record.feces_afternoon_appearance || "",
          feces_afternoon_quantity: record.feces_afternoon_quantity || "",
          feces_night_count: record.feces_night_count,
          feces_night_color: record.feces_night_color || "",
          feces_night_appearance: record.feces_night_appearance || "",
          feces_night_quantity: record.feces_night_quantity || "",
          urine_morning_count: record.urine_morning_count,
          urine_morning_color: record.urine_morning_color || "",
          urine_morning_odor: record.urine_morning_odor || "",
          urine_morning_quantity: record.urine_morning_quantity || "",
          urine_afternoon_count: record.urine_afternoon_count,
          urine_afternoon_color: record.urine_afternoon_color || "",
          urine_afternoon_odor: record.urine_afternoon_odor || "",
          urine_afternoon_quantity: record.urine_afternoon_quantity || "",
          urine_night_count: record.urine_night_count,
          urine_night_color: record.urine_night_color || "",
          urine_night_odor: record.urine_night_odor || "",
          urine_night_quantity: record.urine_night_quantity || "",
        });
      } else {
        setCurrentRecord(null);
        setForm((f) => ({
          ...f,
          record_date: date,
        }));
      }
    } catch (e) {
      console.warn('Error al cargar registro:', e);
      setCurrentRecord(null);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleDateChange = async (date: string) => {
    if (selectedPatient) {
      await loadRecordForDate(date);
    } else {
      setForm((f) => ({ ...f, record_date: date }));
    }
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      toast.error("Selecciona un paciente");
      return;
    }
    if (!form.nurse_name) {
      toast.error("Ingresa el nombre de la enfermera(o)");
      return;
    }

    try {
      setIsSaving(true);
      
      if (currentRecord) {
        // Actualizar registro existente
        await eliminationRecordsService.update(currentRecord.id, form);
        toast.success("Registro actualizado exitosamente");
      } else {
        // Crear nuevo registro
        const created = await eliminationRecordsService.create(form);
        setCurrentRecord(created);
        toast.success("Registro guardado exitosamente");
      }
      
      // Recargar historial
      await loadHistory();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar el registro");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/enfermeria")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Hoja Descriptiva de Eliminación de Heces y Orinas</h1>
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
                setCurrentRecord(null);
                setForm({
                  patient_id: "",
                  patient_name: "",
                  age: undefined,
                  nurse_name: "",
                  record_date: new Date().toISOString().split('T')[0],
                  feces_morning_count: undefined,
                  feces_morning_color: "",
                  feces_morning_appearance: "",
                  feces_morning_quantity: "",
                  feces_afternoon_count: undefined,
                  feces_afternoon_color: "",
                  feces_afternoon_appearance: "",
                  feces_afternoon_quantity: "",
                  feces_night_count: undefined,
                  feces_night_color: "",
                  feces_night_appearance: "",
                  feces_night_quantity: "",
                  urine_morning_count: undefined,
                  urine_morning_color: "",
                  urine_morning_odor: "",
                  urine_morning_quantity: "",
                  urine_afternoon_count: undefined,
                  urine_afternoon_color: "",
                  urine_afternoon_odor: "",
                  urine_afternoon_quantity: "",
                  urine_night_count: undefined,
                  urine_night_color: "",
                  urine_night_odor: "",
                  urine_night_quantity: "",
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Registro de Eliminación</CardTitle>
              <div className="flex items-center gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={form.record_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button onClick={handleSave} disabled={isSaving || isLoadingRecord}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombres y Apellidos</Label>
                <Input value={form.patient_name} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Edad</Label>
                <Input type="number" value={form.age ?? ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Enfermera(o)</Label>
                <Input
                  value={form.nurse_name}
                  onChange={(e) => setForm({ ...form, nurse_name: e.target.value })}
                  placeholder="Nombre de la enfermera(o)"
                  required
                />
              </div>
            </div>

            {/* Tabla de Heces y Orinas - Con selector en la columna HORARIO */}
            <div className="overflow-x-auto">
              <Table className="border-collapse border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border border-gray-300 bg-gray-100 font-semibold">HORARIO</TableHead>
                    <TableHead className="border border-gray-300 bg-gray-100 font-semibold" colSpan={4}>DESCRIPCIÓN HECES</TableHead>
                    <TableHead className="border border-gray-300 bg-gray-100 font-semibold" colSpan={4}>DESCRIPCIÓN ORINA</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="border border-gray-300 bg-gray-100"></TableHead>
                    <TableHead className="border border-gray-300 bg-gray-50">N° DE DEPOSICIÓN</TableHead>
                    <TableHead className="border border-gray-300 bg-gray-50">COLOR</TableHead>
                    <TableHead className="border border-gray-300 bg-gray-50">ASPECTO</TableHead>
                    <TableHead className="border border-gray-300 bg-gray-50">CANTIDAD</TableHead>
                    <TableHead className="border border-gray-300 bg-blue-50">N° DE MICCIONES</TableHead>
                    <TableHead className="border border-gray-300 bg-blue-50">COLOR</TableHead>
                    <TableHead className="border border-gray-300 bg-blue-50">OLOR</TableHead>
                    <TableHead className="border border-gray-300 bg-blue-50">CANTIDAD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Solo mostrar la fila del turno seleccionado */}
                  <TableRow>
                    <TableCell className="border border-gray-300 font-semibold bg-gray-50 p-2">
                      <Select value={selectedShift} onValueChange={(value: 'Mañana' | 'Tarde' | 'Noche') => setSelectedShift(value)}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mañana">Mañana</SelectItem>
                          <SelectItem value="Tarde">Tarde</SelectItem>
                          <SelectItem value="Noche">Noche</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {/* Heces - Campos dinámicos según el turno */}
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        value={
                          selectedShift === 'Mañana' ? (form.feces_morning_count ?? '') :
                          selectedShift === 'Tarde' ? (form.feces_afternoon_count ?? '') :
                          (form.feces_night_count ?? '')
                        }
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : undefined;
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, feces_morning_count: value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, feces_afternoon_count: value });
                          } else {
                            setForm({ ...form, feces_night_count: value });
                          }
                        }}
                        className="w-20 h-8 text-sm"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.feces_morning_color || '') :
                          selectedShift === 'Tarde' ? (form.feces_afternoon_color || '') :
                          (form.feces_night_color || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, feces_morning_color: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, feces_afternoon_color: e.target.value });
                          } else {
                            setForm({ ...form, feces_night_color: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Color"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.feces_morning_appearance || '') :
                          selectedShift === 'Tarde' ? (form.feces_afternoon_appearance || '') :
                          (form.feces_night_appearance || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, feces_morning_appearance: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, feces_afternoon_appearance: e.target.value });
                          } else {
                            setForm({ ...form, feces_night_appearance: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Aspecto"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.feces_morning_quantity || '') :
                          selectedShift === 'Tarde' ? (form.feces_afternoon_quantity || '') :
                          (form.feces_night_quantity || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, feces_morning_quantity: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, feces_afternoon_quantity: e.target.value });
                          } else {
                            setForm({ ...form, feces_night_quantity: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Cantidad"
                      />
                    </TableCell>
                    {/* Orina - Campos dinámicos según el turno */}
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        type="number"
                        value={
                          selectedShift === 'Mañana' ? (form.urine_morning_count ?? '') :
                          selectedShift === 'Tarde' ? (form.urine_afternoon_count ?? '') :
                          (form.urine_night_count ?? '')
                        }
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : undefined;
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, urine_morning_count: value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, urine_afternoon_count: value });
                          } else {
                            setForm({ ...form, urine_night_count: value });
                          }
                        }}
                        className="w-20 h-8 text-sm"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.urine_morning_color || '') :
                          selectedShift === 'Tarde' ? (form.urine_afternoon_color || '') :
                          (form.urine_night_color || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, urine_morning_color: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, urine_afternoon_color: e.target.value });
                          } else {
                            setForm({ ...form, urine_night_color: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Color"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.urine_morning_odor || '') :
                          selectedShift === 'Tarde' ? (form.urine_afternoon_odor || '') :
                          (form.urine_night_odor || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, urine_morning_odor: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, urine_afternoon_odor: e.target.value });
                          } else {
                            setForm({ ...form, urine_night_odor: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Olor"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={
                          selectedShift === 'Mañana' ? (form.urine_morning_quantity || '') :
                          selectedShift === 'Tarde' ? (form.urine_afternoon_quantity || '') :
                          (form.urine_night_quantity || '')
                        }
                        onChange={(e) => {
                          if (selectedShift === 'Mañana') {
                            setForm({ ...form, urine_morning_quantity: e.target.value });
                          } else if (selectedShift === 'Tarde') {
                            setForm({ ...form, urine_afternoon_quantity: e.target.value });
                          } else {
                            setForm({ ...form, urine_night_quantity: e.target.value });
                          }
                        }}
                        className="w-24 h-8 text-sm"
                        placeholder="Cantidad"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
          </Card>

          {/* Historial de Registros */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Registros</CardTitle>
            </CardHeader>
            <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros guardados para este paciente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Enfermera</TableHead>
                      <TableHead>Heces - Mañana</TableHead>
                      <TableHead>Heces - Tarde</TableHead>
                      <TableHead>Heces - Noche</TableHead>
                      <TableHead>Orina - Mañana</TableHead>
                      <TableHead>Orina - Tarde</TableHead>
                      <TableHead>Orina - Noche</TableHead>
                      <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.record_date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>{record.nurse_name}</TableCell>
                        <TableCell>
                          {record.feces_morning_count !== undefined || record.feces_morning_color || record.feces_morning_appearance || record.feces_morning_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.feces_morning_count !== undefined && <div>N°: {record.feces_morning_count}</div>}
                              {record.feces_morning_color && <div>Color: {record.feces_morning_color}</div>}
                              {record.feces_morning_appearance && <div>Aspecto: {record.feces_morning_appearance}</div>}
                              {record.feces_morning_quantity && <div>Cant: {record.feces_morning_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.feces_afternoon_count !== undefined || record.feces_afternoon_color || record.feces_afternoon_appearance || record.feces_afternoon_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.feces_afternoon_count !== undefined && <div>N°: {record.feces_afternoon_count}</div>}
                              {record.feces_afternoon_color && <div>Color: {record.feces_afternoon_color}</div>}
                              {record.feces_afternoon_appearance && <div>Aspecto: {record.feces_afternoon_appearance}</div>}
                              {record.feces_afternoon_quantity && <div>Cant: {record.feces_afternoon_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.feces_night_count !== undefined || record.feces_night_color || record.feces_night_appearance || record.feces_night_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.feces_night_count !== undefined && <div>N°: {record.feces_night_count}</div>}
                              {record.feces_night_color && <div>Color: {record.feces_night_color}</div>}
                              {record.feces_night_appearance && <div>Aspecto: {record.feces_night_appearance}</div>}
                              {record.feces_night_quantity && <div>Cant: {record.feces_night_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.urine_morning_count !== undefined || record.urine_morning_color || record.urine_morning_odor || record.urine_morning_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.urine_morning_count !== undefined && <div>N°: {record.urine_morning_count}</div>}
                              {record.urine_morning_color && <div>Color: {record.urine_morning_color}</div>}
                              {record.urine_morning_odor && <div>Olor: {record.urine_morning_odor}</div>}
                              {record.urine_morning_quantity && <div>Cant: {record.urine_morning_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.urine_afternoon_count !== undefined || record.urine_afternoon_color || record.urine_afternoon_odor || record.urine_afternoon_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.urine_afternoon_count !== undefined && <div>N°: {record.urine_afternoon_count}</div>}
                              {record.urine_afternoon_color && <div>Color: {record.urine_afternoon_color}</div>}
                              {record.urine_afternoon_odor && <div>Olor: {record.urine_afternoon_odor}</div>}
                              {record.urine_afternoon_quantity && <div>Cant: {record.urine_afternoon_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.urine_night_count !== undefined || record.urine_night_color || record.urine_night_odor || record.urine_night_quantity ? (
                            <div className="text-xs space-y-1">
                              {record.urine_night_count !== undefined && <div>N°: {record.urine_night_count}</div>}
                              {record.urine_night_color && <div>Color: {record.urine_night_color}</div>}
                              {record.urine_night_odor && <div>Olor: {record.urine_night_odor}</div>}
                              {record.urine_night_quantity && <div>Cant: {record.urine_night_quantity}</div>}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              // Cambiar la fecha del formulario
                              const dateStr = record.record_date;
                              setForm((f) => ({ ...f, record_date: dateStr }));
                              
                              // Cargar el registro completo
                              await loadRecordForDate(dateStr);
                              
                              // Determinar qué turno tiene datos para seleccionarlo automáticamente
                              if (record.feces_morning_count !== undefined || record.feces_morning_color || 
                                  record.urine_morning_count !== undefined || record.urine_morning_color) {
                                setSelectedShift('Mañana');
                              } else if (record.feces_afternoon_count !== undefined || record.feces_afternoon_color ||
                                        record.urine_afternoon_count !== undefined || record.urine_afternoon_color) {
                                setSelectedShift('Tarde');
                              } else if (record.feces_night_count !== undefined || record.feces_night_color ||
                                        record.urine_night_count !== undefined || record.urine_night_color) {
                                setSelectedShift('Noche');
                              }
                              
                              // Scroll al formulario
                              setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 100);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Ver/Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

