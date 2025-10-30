import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  ClipboardList,
  FileText,
  Calendar,
  Clock,
  X,
  Users,
  AlertCircle,
  HeartPulse,
  Eye,
  Loader2,
} from "lucide-react";
import nursingInitialAssessmentService, { type NursingInitialAssessment } from "~/services/nursingInitialAssessmentService";
import patientsService, { type Patient } from "~/services/patientsService";

export default function EnfermeriaDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pacientesHoy: 0,
    atencionesPendientes: 0,
    signosVitales: 0,
    documentacionPendiente: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState<(NursingInitialAssessment & { patient?: Patient })[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Cargar estadísticas (por ahora datos simulados)
  const loadStats = async () => {
    try {
      setIsLoading(true);
      // Aquí se cargarán las estadísticas reales
      // Por ahora usamos datos de ejemplo
      setStats({
        pacientesHoy: 0,
        atencionesPendientes: 0,
        signosVitales: 0,
        documentacionPendiente: 0
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de enfermería');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar valoraciones recientes
  const loadRecentAssessments = async () => {
    try {
      setLoadingAssessments(true);
      // Obtener las 5 valoraciones más recientes
      const allAssessments = await nursingInitialAssessmentService.getAll();
      const recent = allAssessments.slice(0, 5);
      
      // Obtener información de pacientes
      const assessmentsWithPatients = await Promise.all(
        recent.map(async (assessment) => {
          try {
            const patient = await patientsService.getPatientById(assessment.patient_id);
            return { ...assessment, patient: patient || undefined };
          } catch {
            return { ...assessment, patient: undefined };
          }
        })
      );

      setRecentAssessments(assessmentsWithPatients);
    } catch (error) {
      console.error('Error al cargar valoraciones recientes:', error);
      // No mostrar error si no hay valoraciones
    } finally {
      setLoadingAssessments(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentAssessments();
  }, []);

  const dashboardCards = [
    {
      title: "Valoración Inicial",
      description: "Realizar valoración inicial de enfermería a un paciente",
      icon: <ClipboardList className="w-8 h-8 text-blue-500" />,
      action: () => navigate('/enfermeria/valoracion-inicial'),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    {
      title: "Ver Valoraciones",
      description: "Ver todas las valoraciones iniciales realizadas",
      icon: <FileText className="w-8 h-8 text-indigo-500" />,
      action: () => navigate('/enfermeria/valoraciones'),
      color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏥 Dashboard de Enfermería</h1>
          <p className="text-gray-600 mt-1">
            Valoración inicial y gestión de valoraciones de enfermería
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <X className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pacientesHoy}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Atenciones Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.atencionesPendientes}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Signos Vitales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.signosVitales}</p>
            </div>
            <HeartPulse className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doc. Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documentacionPendiente}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Acciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboardCards.map((card, index) => (
          <Card 
            key={index} 
            className={`p-6 cursor-pointer transition-colors ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {card.icon}
              <div>
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actividad Reciente */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Actividad Reciente
          </h2>
          {recentAssessments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/enfermeria/valoraciones')}
            >
              Ver Todas
            </Button>
          )}
        </div>
        
        {loadingAssessments ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : recentAssessments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay actividad reciente</p>
            <p className="text-sm">Las valoraciones iniciales aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/pacientes/${assessment.patient_id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-blue-100 p-2 rounded">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">
                        {assessment.patient
                          ? `${assessment.patient.nombre} ${assessment.patient.apellido_paterno || ''} ${assessment.patient.apellido_materno || ''}`.trim()
                          : `Paciente ID: ${assessment.patient_id.slice(0, 8)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(assessment.assessment_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span>Enfermero/a: {assessment.nurse_name}</span>
                      {assessment.medical_diagnosis && (
                        <span className="text-gray-500">
                          Dx: {assessment.medical_diagnosis.length > 30 
                            ? `${assessment.medical_diagnosis.substring(0, 30)}...`
                            : assessment.medical_diagnosis}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/pacientes/${assessment.patient_id}`);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

