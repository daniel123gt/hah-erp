import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Search, Eye, Plus, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import nursingInitialAssessmentService, { type NursingInitialAssessment } from "~/services/nursingInitialAssessmentService";
import patientsService, { type Patient } from "~/services/patientsService";

export default function VerValoraciones() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<NursingInitialAssessment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      // Obtener todas las valoraciones
      const allAssessments = await nursingInitialAssessmentService.getAll();
      
      // Obtener información de pacientes únicos
      const uniquePatientIds = [...new Set(allAssessments.map(a => a.patient_id))];
      const patientsData = await Promise.all(
        uniquePatientIds.map(async (id) => {
          try {
            const patient = await patientsService.getPatientById(id);
            return patient ? { id, patient } : null;
          } catch {
            return null;
          }
        })
      );

      const patientsMap: Record<string, Patient> = {};
      patientsData.forEach(item => {
        if (item) patientsMap[item.id] = item.patient;
      });

      setAssessments(allAssessments);
      setPatients(patientsMap);
    } catch (error) {
      console.error("Error al cargar valoraciones:", error);
      toast.error("Error al cargar las valoraciones iniciales");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    if (!searchTerm) return true;
    const patient = patients[assessment.patient_id];
    const search = searchTerm.toLowerCase();
    return (
      patient?.name.toLowerCase().includes(search) ||
      assessment.nurse_name.toLowerCase().includes(search) ||
      assessment.medical_diagnosis?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/enfermeria")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Valoraciones Iniciales</h1>
        </div>
        <Button onClick={() => navigate("/enfermeria/valoracion-inicial")}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Valoración
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por paciente, enfermero/a o diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Search className="w-4 h-4 text-gray-400 mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de valoraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Valoraciones Iniciales</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Cargando valoraciones...</span>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron valoraciones iniciales</p>
              <Button className="mt-4" onClick={() => navigate("/enfermeria/valoracion-inicial")}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Valoración
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Enfermero/a</TableHead>
                    <TableHead>DX Médico</TableHead>
                    <TableHead>Médico Tratante</TableHead>
                    <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
                    const patient = patients[assessment.patient_id];
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          {new Date(assessment.assessment_date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {patient?.name || 'Paciente no encontrado'}
                        </TableCell>
                        <TableCell>{assessment.nurse_name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {assessment.medical_diagnosis || '-'}
                        </TableCell>
                        <TableCell>
                          {assessment.attending_physician || '-'}
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/pacientes/${assessment.patient_id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                          </Button>
                        </TableCell>
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

