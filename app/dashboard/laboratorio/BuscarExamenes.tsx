import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { getExams } from "~/services/labService";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  Info,
  ArrowLeft
} from "lucide-react";

interface LaboratoryExam {
  id: string;
  codigo: string;
  nombre: string;
  precio: string;
  categoria?: string;
  descripcion?: string;
  tiempo_resultado?: string;
  preparacion?: string;
  created_at: string;
  updated_at: string;
}

export default function BuscarExamenes() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<LaboratoryExam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 20; // Limitar a 20 exámenes por página para mejor rendimiento

  // Cargar exámenes desde Supabase con paginación
  const loadExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getExams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        categoria: '' // Sin filtro de categoría
      });
      
      setExams(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      toast.error('Error al cargar los exámenes');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage]);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Cargar exámenes cuando cambien los filtros
  useEffect(() => {
    loadExams();
  }, [loadExams]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" onClick={() => navigate('/laboratorio')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">🔍 Buscar Exámenes</h1>
            </div>
            <p className="text-gray-600">Consulta información detallada de los exámenes disponibles</p>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Mostrando {exams.length} de {total} examen{total !== 1 ? 'es' : ''} 
              {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
            </div>
          </CardContent>
        </Card>

        {/* Lista de exámenes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mr-3" />
            <span className="text-gray-600">Cargando exámenes...</span>
          </div>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No se encontraron exámenes
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Intenta cambiar el término de búsqueda"
                  : "No hay exámenes disponibles"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{exam.nombre}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {exam.codigo}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {exam.precio}
                      </div>
                    </div>
                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descripción */}
                  {exam.descripcion && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Descripción</span>
                      </div>
                      <p className="text-sm text-gray-600 pl-6">{exam.descripcion}</p>
                    </div>
                  )}

                  {/* Tiempo de resultado */}
                  {exam.tiempo_resultado && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Tiempo de Resultado</span>
                      </div>
                      <p className="text-sm text-gray-600 pl-6">{exam.tiempo_resultado}</p>
                    </div>
                  )}

                  {/* Preparación */}
                  {exam.preparacion && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-700">Preparación Requerida</span>
                      </div>
                      <div className="text-sm text-gray-600 pl-6 whitespace-pre-wrap bg-orange-50 p-3 rounded border border-orange-100">
                        {exam.preparacion}
                      </div>
                    </div>
                  )}

                  {!exam.descripcion && !exam.tiempo_resultado && !exam.preparacion && (
                    <p className="text-sm text-gray-500 italic">
                      No hay información adicional disponible para este examen
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
