import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import patientsService from "~/services/patientsService";
import nursingVitalSignsService, { type CreateNursingVitalSignEntry, type NursingVitalSignEntry } from "~/services/nursingVitalSignsService";

export default function SignosVitales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<NursingVitalSignEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [form, setForm] = useState<CreateNursingVitalSignEntry>({
    patient_id: "",
    assessment_datetime: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
    nurse_name: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: undefined,
    respiratory_rate: undefined,
    spo2: undefined,
    temperature: undefined,
    capillary_glucose: undefined,
    observation: ""
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
    setForm((f) => ({ ...f, patient_id: patient.id }));
    await loadRecent(patient.id);
  };

  const loadRecent = async (patientId: string) => {
    try {
      setLoadingEntries(true);
      const entries = await nursingVitalSignsService.getByPatient(patientId, 10);
      setRecentEntries(entries);
    } catch (e) {
      // Silencio si no hay datos
      setRecentEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const payload: CreateNursingVitalSignEntry = {
        ...form,
        assessment_datetime: new Date(form.assessment_datetime).toISOString(),
      };
      await nursingVitalSignsService.create(payload);
      toast.success("Funciones vitales registradas");
      setForm((f) => ({
        ...f,
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: undefined,
        respiratory_rate: undefined,
        spo2: undefined,
        temperature: undefined,
        capillary_glucose: undefined,
        observation: ""
      }));
      await loadRecent(form.patient_id);
    } catch (e: any) {
      toast.error(e?.message || "Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/enfermeria")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Registro de Funciones Vitales</h1>
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
                placeholder="Buscar por nombre, DNI, email..."
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
                <p className="font-medium text-gray-900">
                  {selectedPatient.nombre} {selectedPatient.apellido_paterno || ''} {selectedPatient.apellido_materno || ''}
                </p>
                <p className="text-sm text-gray-600">{selectedPatient.email || selectedPatient.dni}</p>
              </div>
              <Button variant="outline" onClick={() => { setSelectedPatient(null); setPatientResults([]); setForm((f)=>({ ...f, patient_id: '' })); }}>Cambiar</Button>
            </div>
          )}

          {!selectedPatient && patientResults.length > 0 && (
            <div className="mt-3 border rounded divide-y">
              {patientResults.map((p) => (
                <button key={p.id} className="w-full text-left p-3 hover:bg-gray-50" onClick={() => handleSelectPatient(p)}>
                  <div className="font-medium text-gray-900">{p.nombre} {p.apellido_paterno || ''} {p.apellido_materno || ''}</div>
                  <div className="text-sm text-gray-600">{p.email || p.dni}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Funciones Vitales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Fecha y Hora</Label>
              <Input
                type="datetime-local"
                value={form.assessment_datetime}
                onChange={(e) => setForm({ ...form, assessment_datetime: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Enfermera(o)</Label>
              <Input
                value={form.nurse_name}
                onChange={(e) => setForm({ ...form, nurse_name: e.target.value })}
                placeholder="Nombre de la enfermera(o)"
                required
              />
            </div>

            <div>
              <Label>P/A Sistólica (mmHg)</Label>
              <Input value={form.blood_pressure_systolic || ''} onChange={(e)=> setForm({ ...form, blood_pressure_systolic: e.target.value })} />
            </div>
            <div>
              <Label>P/A Diastólica (mmHg)</Label>
              <Input value={form.blood_pressure_diastolic || ''} onChange={(e)=> setForm({ ...form, blood_pressure_diastolic: e.target.value })} />
            </div>
            <div>
              <Label>FC (x')</Label>
              <Input type="number" value={form.heart_rate ?? ''} onChange={(e)=> setForm({ ...form, heart_rate: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>FR (x')</Label>
              <Input type="number" value={form.respiratory_rate ?? ''} onChange={(e)=> setForm({ ...form, respiratory_rate: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>SpO2 (%)</Label>
              <Input type="number" value={form.spo2 ?? ''} onChange={(e)=> setForm({ ...form, spo2: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>Temperatura (°C)</Label>
              <Input type="number" step="0.1" value={form.temperature ?? ''} onChange={(e)=> setForm({ ...form, temperature: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>Glicemia (mg/dL)</Label>
              <Input type="number" step="0.1" value={form.capillary_glucose ?? ''} onChange={(e)=> setForm({ ...form, capillary_glucose: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="md:col-span-4">
              <Label>Observación</Label>
              <Input value={form.observation || ''} onChange={(e)=> setForm({ ...form, observation: e.target.value })} />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting || !selectedPatient}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Registrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Listado reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos registros</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros para este paciente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>P/A</TableHead>
                    <TableHead>FC</TableHead>
                    <TableHead>FR</TableHead>
                    <TableHead>SpO2</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Glicemia</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((r) => {
                    const d = new Date(r.assessment_datetime);
                    const fecha = d.toLocaleDateString('es-ES');
                    const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{fecha}</TableCell>
                        <TableCell>{hora}</TableCell>
                        <TableCell>{r.blood_pressure_systolic || '-'} / {r.blood_pressure_diastolic || '-'}</TableCell>
                        <TableCell>{r.heart_rate ?? '-'}</TableCell>
                        <TableCell>{r.respiratory_rate ?? '-'}</TableCell>
                        <TableCell>{r.spo2 ?? '-'}</TableCell>
                        <TableCell>{r.temperature ?? '-'}</TableCell>
                        <TableCell>{r.capillary_glucose ?? '-'}</TableCell>
                        <TableCell>{r.observation || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
