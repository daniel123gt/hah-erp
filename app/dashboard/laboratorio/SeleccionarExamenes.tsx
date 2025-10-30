import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getExams, getExamStats, calculateQuote } from "~/services/labService";

// Definir tipos directamente en la página para evitar problemas de importación
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

interface ExamQuote {
  examenes: LaboratoryExam[];
  precioOriginal: number;
  precioCliente: number;
  recargoTotal: number;
  recargoUnitario: number;
  costoDomicilio: number;
  totalFinal: number;
}
import { toast } from "sonner";
import { CreateOrderModal } from "~/components/ui/create-order-modal";
import {
  Search,
  Plus,
  Check,
  Trash2,
  FileText,
  RotateCcw,
  Calculator,
  X
} from "lucide-react";

export default function LaboratorioPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<LaboratoryExam[]>([]);
  const [selectedExams, setSelectedExams] = useState<LaboratoryExam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [quote, setQuote] = useState<ExamQuote | null>(null);

  // Función para normalizar texto (sin acentos) - igual que en tu MVP
  const normalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Cargar exámenes desde Supabase
  const loadExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getExams({
        page: 1,
        limit: 1000, // Cargar muchos para tener búsqueda rápida
        search: searchQuery
      });
      
      setExams(result.data);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      toast.error('Error al cargar los exámenes');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getExamStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  // Efectos
  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Calcular cotización cuando cambien los exámenes seleccionados
  useEffect(() => {
    if (selectedExams.length > 0) {
      const calculatedQuote = calculateQuote(selectedExams);
      setQuote(calculatedQuote);
    } else {
      setQuote(null);
    }
  }, [selectedExams]);

  // Filtrar exámenes localmente (como en tu MVP)
  const filteredExams = exams.filter((exam) =>
    normalize(exam.nombre).includes(normalize(searchQuery)) ||
    normalize(exam.codigo).includes(normalize(searchQuery))
  );

  // Manejar agregar examen a selección (igual que tu MVP)
  const handleAddToSelected = (exam: LaboratoryExam) => {
    const isAlreadySelected = selectedExams.some(
      (selected) => selected.codigo === exam.codigo
    );
    if (!isAlreadySelected) {
      setSelectedExams((prev) => [...prev, exam]);
      toast.success(`Examen "${exam.nombre}" agregado a la cotización`);
    }
  };

  // Manejar remover examen de selección
  const handleRemoveFromSelected = (codigo: string) => {
    setSelectedExams((prev) =>
      prev.filter((exam) => exam.codigo !== codigo)
    );
    toast.success('Examen removido de la cotización');
  };

  // Limpiar selección
  const handleClearSelection = () => {
    setSelectedExams([]);
    toast.success('Selección limpiada');
  };


  // Función para parsear precio (igual que tu MVP)
  const parsePrice = (precio: string) =>
    parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

  // Formatear fecha (igual que tu MVP)
  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧪 Laboratorio</h1>
          <p className="text-gray-600 mt-1">
            Selección de exámenes y cotizaciones de laboratorio
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exámenes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
            </div>
            <Calculator className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Seleccionados</p>
              <p className="text-2xl font-bold text-gray-900">{selectedExams.length}</p>
            </div>
            <Check className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar examen por nombre o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exámenes Disponibles */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Exámenes Disponibles
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando exámenes...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron exámenes
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredExams.map((exam) => {
                  const isSelected = selectedExams.some(
                    (p) => p.codigo === exam.codigo
                  );

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-lg border p-4 flex justify-between items-center hover:shadow-md transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{exam.nombre}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span>Código: {exam.codigo}</span>
                          <span className="font-semibold text-green-600">{exam.precio}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddToSelected(exam)}
                        disabled={isSelected}
                        size="sm"
                        variant={isSelected ? "outline" : "default"}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Cotización */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 flex-shrink-0">
                <Calculator className="w-5 h-5" /> Cotización
              </h2>
              {selectedExams.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto min-w-0">
                  <CreateOrderModal 
                    selectedExams={selectedExams}
                    onOrderCreated={() => {
                      handleClearSelection();
                      toast.success("Orden creada exitosamente");
                    }}
                  />
                  <Button
                    onClick={handleClearSelection}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Limpiar</span>
                  </Button>
                </div>
              )}
            </div>

            {selectedExams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No has seleccionado ningún examen.</p>
                <p className="text-sm">Selecciona exámenes para crear una cotización.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Proforma Interna */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-bold text-red-800 mb-2">
                    Proforma Interna (NO MOSTRAR AL CLIENTE)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Precio Original:</span>
                      <span className="font-semibold">S/ {quote?.precioOriginal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio Cliente:</span>
                      <span className="font-semibold">S/ {quote?.precioCliente.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recargo Total:</span>
                      <span className="font-semibold">S/ {quote?.recargoTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costo Domicilio:</span>
                      <span className="font-semibold">S/ {quote?.costoDomicilio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-red-800">
                      <span>Total Final:</span>
                      <span>S/ {quote?.totalFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Exámenes Seleccionados */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Exámenes Seleccionados:</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedExams.map((exam) => {
                      const precio = parsePrice(exam.precio);
                      const cliente = precio * 1.2 + (quote?.recargoUnitario || 0);
                      
                      return (
                        <div
                          key={exam.codigo}
                          className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{exam.nombre}</div>
                            <div className="text-xs text-gray-500">
                              {exam.codigo} - S/ {cliente.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRemoveFromSelected(exam.codigo)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Proforma Cliente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">
                    Proforma Cliente
                  </h3>
                  <div className="text-sm">
                    <div className="flex justify-between font-bold text-blue-800">
                      <span>Total a Pagar:</span>
                      <span>S/ {quote?.totalFinal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Incluye recargo por servicio a domicilio
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}