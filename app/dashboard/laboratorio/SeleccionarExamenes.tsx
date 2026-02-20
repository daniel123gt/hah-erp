import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getExams, getExamStats, calculateQuote } from "~/services/labService";
import { procedureService } from "~/services/procedureService";

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
import { useAuthStore, getAppRole } from "~/store/authStore";
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
  const user = useAuthStore((s) => s.user);
  const isGestor = getAppRole(user) === "gestor";
  const [exams, setExams] = useState<LaboratoryExam[]>([]);
  const [selectedExams, setSelectedExams] = useState<LaboratoryExam[]>([]);
  const [searchByName, setSearchByName] = useState("");
  const [searchByCode, setSearchByCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [quote, setQuote] = useState<ExamQuote | null>(null);
  // Recargo por toma de muestra: mismo valor que usa el modal Crear Orden (procedimiento en BD)
  const [recargoTomaMuestra, setRecargoTomaMuestra] = useState(120);

  // Cargar recargo del procedimiento "toma de muestra" para que la cotización coincida con el modal
  useEffect(() => {
    procedureService.getProcedureByName("toma de muestra").then((p) => {
      if (p?.base_price_soles != null) setRecargoTomaMuestra(p.base_price_soles);
    }).catch(() => {});
  }, []);

  // Función para normalizar texto (sin acentos) - igual que en tu MVP
  const normalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Cargar exámenes desde Supabase (enviamos nombre o código al API; el otro filtro se aplica en cliente)
  const searchParam = searchByName.trim() || searchByCode.trim();
  const loadExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getExams({
        page: 1,
        limit: 1000,
        search: searchParam || undefined
      });
      
      setExams(result.data);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      toast.error('Error al cargar los exámenes');
    } finally {
      setIsLoading(false);
    }
  }, [searchParam]);

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

  // Calcular cotización cuando cambien los exámenes seleccionados (usamos mismo recargo que el modal Crear Orden)
  useEffect(() => {
    if (selectedExams.length > 0) {
      const calculatedQuote = calculateQuote(selectedExams, recargoTomaMuestra);
      setQuote(calculatedQuote);
    } else {
      setQuote(null);
    }
  }, [selectedExams, recargoTomaMuestra]);

  // Filtrar exámenes: debe coincidir por nombre (si hay texto) y por código (si hay texto)
  const filteredExams = exams.filter((exam) => {
    const matchName = !searchByName.trim() || normalize(exam.nombre).includes(normalize(searchByName));
    const matchCode = !searchByCode.trim() || normalize(exam.codigo).includes(normalize(searchByCode));
    return matchName && matchCode;
  });

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
          <Button variant="outline" onClick={() => navigate('/')}>
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

      {/* Búsqueda por nombre y por código */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Buscar por nombre</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ej. Glucosa, Hemograma..."
                value={searchByName}
                onChange={(e) => setSearchByName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Buscar por código</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ej. 1001, 2002..."
                value={searchByCode}
                onChange={(e) => setSearchByCode(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
                          {!isGestor && (
                            <span className="font-semibold text-green-600">{exam.precio}</span>
                          )}
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
            <div className="flex flex-col gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Cotización
              </h2>
              {selectedExams.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
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
                    className="text-red-600 hover:text-red-700 w-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="ml-2">Limpiar</span>
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
                {/* Proforma Interna - solo admin */}
                {!isGestor && (
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
                )}

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
                              {exam.codigo}
                              {!isGestor && ` - S/ ${cliente.toFixed(2)}`}
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

      {/* Proforma de exámenes solicitados - ancho completo */}
      {selectedExams.length > 0 && quote && (
        <Card className="w-full mt-8 overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Encabezado: título y fecha a la izquierda, logos a la derecha */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Proforma de exámenes solicitados
                </h2>
                <p className="text-gray-600 mt-1">
                  Fecha: {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <img
                  src="/logo.svg"
                  alt="Health At Home"
                  className="h-12 object-contain"
                />
                <img
                  src="/synlab-log.jpeg"
                  alt="SYNLAB Analytics & Diagnostics"
                  className="h-12 object-contain"
                />
              </div>
            </div>

            {/* Tabla Código | Nombre | Precio */}
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">
                      Código
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">
                      Nombre
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800">
                      Precio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExams.map((exam) => {
                    const precio = parsePrice(exam.precio);
                    const precioCliente = precio * 1.2 + (quote?.recargoUnitario ?? 0);
                    return (
                      <tr
                        key={exam.codigo}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <td className="py-3 px-4 text-gray-900 font-mono">
                          {exam.codigo}
                        </td>
                        <td className="py-3 px-4 text-gray-800">
                          {exam.nombre}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          S/ {precioCliente.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 border-t-2 border-gray-200">
                <span className="font-bold text-gray-900">Precio Total</span>
                <span className="font-bold text-gray-900">
                  S/ {quote.totalFinal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}