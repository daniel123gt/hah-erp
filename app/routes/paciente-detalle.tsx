import type { Route } from "./+types/paciente-detalle";
import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { FileText } from "lucide-react";
import patientsService, { type Patient } from "~/services/patientsService";
import { patientHistoryService, type PatientHistory } from "~/services/patientHistoryService";
import { nursingHistoryService, type NursingHistory } from "~/services/nursingHistoryService";
import { examHistoryService, type ExamHistory } from "~/services/examHistoryService";
import { nursingInitialAssessmentService, type NursingInitialAssessment } from "~/services/nursingInitialAssessmentService";
import medicalRestsService, { type MedicalRest } from "~/services/medicalRestsService";
import medicalPrescriptionsService, { type MedicalPrescription } from "~/services/medicalPrescriptionsService";
import storageService from "~/services/storageService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Paciente | Health At Home ERP" },
  ];
}

export default function PacienteDetalleRoute() {
  const { id } = useParams("/pacientes/:id");
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicalHistory, setClinicalHistory] = useState<PatientHistory[]>([]);
  const [nursingHistory, setNursingHistory] = useState<NursingHistory[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
  const [initialAssessment, setInitialAssessment] = useState<NursingInitialAssessment | null>(null);
  const [medicalRests, setMedicalRests] = useState<MedicalRest[]>([]);
  const [medicalPrescriptions, setMedicalPrescriptions] = useState<MedicalPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        if (!id) return;
        
        // Cargar paciente primero
        const patientData = await patientsService.getPatientById(id);
        if (!isMounted) return;
        
        if (!patientData) {
          setError('Paciente no encontrado');
          setPatient(null);
          return;
        }
        
        setPatient(patientData);
        setError(null);
        
        // Cargar historias en paralelo, pero manejar errores individualmente
        // para que si alguna tabla no existe, no falle toda la carga
        const historyPromises = [
          patientHistoryService.getHistoryByPatient(id).catch(err => {
            console.warn('Error al cargar historia clínica:', err);
            return [];
          }),
          nursingHistoryService.getHistoryByPatient(id).catch(err => {
            console.warn('Error al cargar historia de enfermería:', err);
            return [];
          }),
          examHistoryService.getHistoryByPatient(id).catch(err => {
            console.warn('Error al cargar historia de exámenes:', err);
            return [];
          }),
          nursingInitialAssessmentService.getByPatient(id).catch(err => {
            console.warn('Error al cargar valoración inicial:', err);
            return null;
          }),
          medicalRestsService.getByPatient(id).catch(err => {
            console.warn('Error al cargar descansos médicos:', err);
            return [];
          }),
          medicalPrescriptionsService.getByPatient(id).catch(err => {
            console.warn('Error al cargar recetas médicas:', err);
            return [];
          }),
        ];
        
        const [ch, nh, eh, ia, mr, mp] = await Promise.all(historyPromises);
        if (!isMounted) return;
        setClinicalHistory(ch);
        setNursingHistory(nh);
        setExamHistory(eh);
        setInitialAssessment(ia);
        setMedicalRests(mr);
        setMedicalPrescriptions(mp);
      } catch (error: any) {
        console.error('Error al cargar datos del paciente:', error);
        setError(error?.message || 'Error al cargar los datos del paciente');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-gray-700 mb-2">{error || 'No se encontró el paciente.'}</p>
        <p className="text-sm text-gray-500 mb-4">
          El paciente con ID {id} no existe en la base de datos.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/pacientes")}>
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
        <div className="flex items-center gap-2">
          {patient.status ? <Badge>{patient.status}</Badge> : null}
          <Button variant="outline" onClick={() => navigate("/pacientes")}>Volver a Pacientes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información General - Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.dni ? <p><span className="text-gray-500">Nro. documento:</span> <span className="font-mono">{patient.dni}</span></p> : null}
            <p><span className="text-gray-500">Email:</span> {patient.email || "-"}</p>
            <p><span className="text-gray-500">Teléfono:</span> {patient.phone || "-"}</p>
            <p><span className="text-gray-500">Dirección:</span> {patient.address || "-"}</p>
            <p><span className="text-gray-500">Última visita:</span> {patient.last_visit || "-"}</p>
            <p><span className="text-gray-500">Fecha de creación:</span> {new Date(patient.created_at).toLocaleDateString('es-ES')}</p>
            <p><span className="text-gray-500">Fecha de actualización:</span> {new Date(patient.updated_at).toLocaleDateString('es-ES')}</p>
          </CardContent>
        </Card>

        {/* Columna derecha - Historia y Valoración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Valoración Inicial */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Valoración Inicial</CardTitle>
                {!initialAssessment && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/enfermeria/valoracion-inicial?patientId=${id}`)}>
                    Crear Valoración
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {initialAssessment ? (
                <div className="space-y-6">
                  {/* Datos básicos */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                    <div>
                      <span className="text-gray-500 font-medium">Fecha de Valoración:</span>
                      <p className="mt-1 font-semibold">{new Date(initialAssessment.assessment_date).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Enfermero/a:</span>
                      <p className="mt-1 font-semibold">{initialAssessment.nurse_name}</p>
                    </div>
                  </div>

                  {/* Datos del paciente */}
                  {(initialAssessment.age || initialAssessment.weight || initialAssessment.height || initialAssessment.blood_type || initialAssessment.medical_diagnosis) && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Datos del Paciente</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {initialAssessment.age && (
                          <div>
                            <span className="text-gray-500">Edad:</span>
                            <p className="font-medium">{initialAssessment.age} años</p>
                          </div>
                        )}
                        {initialAssessment.weight && (
                          <div>
                            <span className="text-gray-500">Peso:</span>
                            <p className="font-medium">{initialAssessment.weight} kg</p>
                          </div>
                        )}
                        {initialAssessment.height && (
                          <div>
                            <span className="text-gray-500">Talla:</span>
                            <p className="font-medium">{initialAssessment.height} cm</p>
                          </div>
                        )}
                        {initialAssessment.blood_type && (
                          <div>
                            <span className="text-gray-500">Tipo de Sangre:</span>
                            <p className="font-medium">{initialAssessment.blood_type}</p>
                          </div>
                        )}
                      </div>
                      {initialAssessment.medical_diagnosis && (
                        <div className="mt-3">
                          <span className="text-gray-500 font-medium">DX Médico:</span>
                          <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.medical_diagnosis}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Médico tratante */}
                  {initialAssessment.attending_physician && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Médico Tratante</h4>
                      <p className="text-sm">{initialAssessment.attending_physician}</p>
                    </div>
                  )}

                  {/* Antecedentes */}
                  {(initialAssessment.pathological_history || initialAssessment.prophylactic_medications || initialAssessment.medication_allergies) && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Antecedentes</h4>
                      <div className="space-y-3 text-sm">
                        {initialAssessment.pathological_history && (
                          <div>
                            <span className="text-gray-500 font-medium">Patológicos Importantes:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.pathological_history}</p>
                          </div>
                        )}
                        {initialAssessment.prophylactic_medications && (
                          <div>
                            <span className="text-gray-500 font-medium">Medicamentos Prophylácticos:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.prophylactic_medications}</p>
                          </div>
                        )}
                        {initialAssessment.medication_allergies && (
                          <div>
                            <span className="text-gray-500 font-medium">Alergia a Medicamentos:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-red-50 p-2 rounded text-red-800">{initialAssessment.medication_allergies}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signos vitales */}
                  {initialAssessment.vital_signs && Object.values(initialAssessment.vital_signs).some(v => v !== null && v !== undefined && v !== '') && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Signos Vitales</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-blue-50 p-4 rounded">
                        {initialAssessment.vital_signs.blood_pressure_systolic && initialAssessment.vital_signs.blood_pressure_diastolic && (
                          <div>
                            <span className="text-gray-500">T.A.:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.blood_pressure_systolic}/{initialAssessment.vital_signs.blood_pressure_diastolic} mmHg</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.heart_rate && (
                          <div>
                            <span className="text-gray-500">FC:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.heart_rate} X'</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.respiratory_rate && (
                          <div>
                            <span className="text-gray-500">FR:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.respiratory_rate} X'</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.oxygen_saturation && (
                          <div>
                            <span className="text-gray-500">SATO2:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.oxygen_saturation}%</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.temperature && (
                          <div>
                            <span className="text-gray-500">TEMP:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.temperature}°C</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.capillary_glucose && (
                          <div>
                            <span className="text-gray-500">Glicemia Capilar:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.capillary_glucose} mg/dl</p>
                          </div>
                        )}
                        {initialAssessment.vital_signs.vital_signs_time && (
                          <div className="col-span-2 md:col-span-4">
                            <span className="text-gray-500">Hora:</span>
                            <p className="font-medium">{initialAssessment.vital_signs.vital_signs_time}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Examen físico */}
                  {initialAssessment.physical_exam && Object.values(initialAssessment.physical_exam).some(v => v && v.trim() !== '') && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Examen Físico</h4>
                      <div className="space-y-3 text-sm">
                        {initialAssessment.physical_exam.neurological && (
                          <div>
                            <span className="text-gray-500 font-medium">Valoración Neurológica:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.neurological}</p>
                          </div>
                        )}
                        {initialAssessment.physical_exam.cardiovascular && (
                          <div>
                            <span className="text-gray-500 font-medium">Valoración Cardiovascular:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.cardiovascular}</p>
                          </div>
                        )}
                        {initialAssessment.physical_exam.respiratory && (
                          <div>
                            <span className="text-gray-500 font-medium">Valoración Respiratoria:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.respiratory}</p>
                          </div>
                        )}
                        {initialAssessment.physical_exam.gastrointestinal && (
                          <div>
                            <span className="text-gray-500 font-medium">Valoración Gastrointestinal:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.gastrointestinal}</p>
                          </div>
                        )}
                        {initialAssessment.physical_exam.genitourinary && (
                          <div>
                            <span className="text-gray-500 font-medium">Valoración Genitourinario:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.genitourinary}</p>
                          </div>
                        )}
                        {initialAssessment.physical_exam.extremities && (
                          <div>
                            <span className="text-gray-500 font-medium">Miembros Superiores e Inferiores:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">{initialAssessment.physical_exam.extremities}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones de enfermería */}
                  {(initialAssessment.nursing_actions || initialAssessment.pending_actions) && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Acciones de Enfermería</h4>
                      <div className="space-y-3 text-sm">
                        {initialAssessment.nursing_actions && (
                          <div>
                            <span className="text-gray-500 font-medium">Acciones Realizadas:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-green-50 p-2 rounded">{initialAssessment.nursing_actions}</p>
                          </div>
                        )}
                        {initialAssessment.pending_actions && (
                          <div>
                            <span className="text-gray-500 font-medium">Acciones Pendientes:</span>
                            <p className="mt-1 whitespace-pre-wrap bg-yellow-50 p-2 rounded">{initialAssessment.pending_actions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">Aún no hay valoración inicial registrada.</p>
                  <Button variant="outline" onClick={() => navigate(`/enfermeria/valoracion-inicial?patientId=${id}`)}>
                    Crear Valoración Inicial
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          {/* Historia Clínica */}
          <Card>
            <CardHeader>
              <CardTitle>Historia Clínica</CardTitle>
            </CardHeader>
            <CardContent>
              {clinicalHistory.length === 0 ? (
                <p className="text-gray-500">Aún no hay registros de historia clínica.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clinicalHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.title}</TableCell>
                          <TableCell>{entry.entry_type}</TableCell>
                          <TableCell className="max-w-xl whitespace-pre-wrap">{entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historia de Enfermería */}
          <Card>
            <CardHeader>
              <CardTitle>Historia de Enfermería</CardTitle>
            </CardHeader>
            <CardContent>
              {nursingHistory.length === 0 ? (
                <p className="text-gray-500">Aún no hay registros de historia de enfermería.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Enfermero/a</TableHead>
                        <TableHead>Signos Vitales</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nursingHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.title}</TableCell>
                          <TableCell>{entry.entry_type}</TableCell>
                          <TableCell>{entry.nurse_name || '-'}</TableCell>
                          <TableCell>
                            {entry.vital_signs ? (
                              <div className="text-xs">
                                {entry.vital_signs.blood_pressure && <div>PA: {entry.vital_signs.blood_pressure}</div>}
                                {entry.vital_signs.heart_rate && <div>FC: {entry.vital_signs.heart_rate}</div>}
                                {entry.vital_signs.temperature && <div>T°: {entry.vital_signs.temperature}°C</div>}
                                {entry.vital_signs.respiratory_rate && <div>FR: {entry.vital_signs.respiratory_rate}</div>}
                                {entry.vital_signs.oxygen_saturation && <div>SpO2: {entry.vital_signs.oxygen_saturation}%</div>}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-xl whitespace-pre-wrap">{entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historia de Exámenes */}
          <Card>
            <CardHeader>
              <CardTitle>Historia de Exámenes</CardTitle>
            </CardHeader>
            <CardContent>
              {examHistory.length === 0 ? (
                <p className="text-gray-500">Aún no hay registros de exámenes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Examen</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Ordenado por</TableHead>
                        <TableHead>Resultados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.exam_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.exam_name}</TableCell>
                          <TableCell>{entry.exam_code || '-'}</TableCell>
                          <TableCell>{entry.exam_type}</TableCell>
                          <TableCell>
                            <Badge variant={entry.status === 'Completado' ? 'default' : entry.status === 'Pendiente' ? 'secondary' : 'outline'}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.ordered_by || '-'}</TableCell>
                          <TableCell className="max-w-xl whitespace-pre-wrap">{entry.results || entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descansos Médicos */}
          <Card>
            <CardHeader>
              <CardTitle>Descansos Médicos</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalRests.length === 0 ? (
                <p className="text-gray-500">Aún no hay registros de descansos médicos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Documento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRests.map((rest) => (
                        <TableRow key={rest.id}>
                          <TableCell>{new Date(rest.date).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{rest.physician_name}</TableCell>
                          <TableCell className="max-w-md">{rest.reason}</TableCell>
                          <TableCell>
                            {rest.document_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Intentar obtener URL firmada si es necesario
                                    if (rest.document_url?.includes('storage')) {
                                      // Extraer bucket y path del URL
                                      const urlParts = rest.document_url.split('/');
                                      const bucketIndex = urlParts.indexOf('object') + 2;
                                      if (bucketIndex > 1) {
                                        const bucket = urlParts[bucketIndex];
                                        const filePath = urlParts.slice(bucketIndex + 1).join('/');
                                        const signedUrl = await storageService.getDownloadUrl(bucket, filePath);
                                        window.open(signedUrl, '_blank');
                                      } else {
                                        window.open(rest.document_url, '_blank');
                                      }
                                    } else {
                                      window.open(rest.document_url, '_blank');
                                    }
                                  } catch (error) {
                                    console.error('Error al abrir documento:', error);
                                    // Si falla, intentar abrir directamente
                                    if (rest.document_url) {
                                      window.open(rest.document_url, '_blank');
                                    }
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Ver PDF
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recetas Médicas */}
          <Card>
            <CardHeader>
              <CardTitle>Recetas Médicas</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalPrescriptions.length === 0 ? (
                <p className="text-gray-500">Aún no hay registros de recetas médicas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Documento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalPrescriptions.map((prescription) => (
                        <TableRow key={prescription.id}>
                          <TableCell>{new Date(prescription.date).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{prescription.physician_name}</TableCell>
                          <TableCell className="max-w-md">{prescription.reason}</TableCell>
                          <TableCell>
                            {prescription.document_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Intentar obtener URL firmada si es necesario
                                    if (prescription.document_url?.includes('storage')) {
                                      // Extraer bucket y path del URL
                                      const urlParts = prescription.document_url.split('/');
                                      const bucketIndex = urlParts.indexOf('object') + 2;
                                      if (bucketIndex > 1) {
                                        const bucket = urlParts[bucketIndex];
                                        const filePath = urlParts.slice(bucketIndex + 1).join('/');
                                        const signedUrl = await storageService.getDownloadUrl(bucket, filePath);
                                        window.open(signedUrl, '_blank');
                                      } else {
                                        window.open(prescription.document_url, '_blank');
                                      }
                                    } else {
                                      window.open(prescription.document_url, '_blank');
                                    }
                                  } catch (error) {
                                    console.error('Error al abrir documento:', error);
                                    // Si falla, intentar abrir directamente
                                    if (prescription.document_url) {
                                      window.open(prescription.document_url, '_blank');
                                    }
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Ver PDF
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


