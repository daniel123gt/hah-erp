import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Plus, User, FileText, Calendar, Search, UserPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import patientsService, { type Patient } from "~/services/patientsService";
import labOrderService from "~/services/labOrderService";

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

interface CreateOrderModalProps {
  selectedExams: LaboratoryExam[];
  onOrderCreated: () => void;
}

export function CreateOrderModal({ selectedExams, onOrderCreated }: CreateOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  
  // Estados para paciente
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  
  // Estados para formulario de nuevo paciente
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
  });

  // Estados para información de la orden
  const [formData, setFormData] = useState({
    fechaOrden: new Date().toISOString().split('T')[0],
    medicoSolicitante: "",
    prioridad: "normal" as 'urgente' | 'normal' | 'programada',
    observaciones: "",
  });

  // Reset cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      setSelectedPatient(null);
      setSearchTerm("");
      setSearchResults([]);
      setShowNewPatientForm(false);
      setNewPatientData({
        name: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
      });
      setFormData({
        fechaOrden: new Date().toISOString().split('T')[0],
        medicoSolicitante: "",
        prioridad: "normal",
        observaciones: "",
      });
    }
  }, [open]);

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

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
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
        gender: (newPatientData.gender as 'M' | 'F') || undefined,
        address: newPatientData.address || undefined,
      });
      
      setSelectedPatient(newPatient);
      setShowNewPatientForm(false);
      setNewPatientData({ name: "", email: "", phone: "", gender: "", address: "" });
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

    if (!selectedPatient) {
      toast.error("Debes seleccionar o crear un paciente primero");
      return;
    }

    if (selectedExams.length === 0) {
      toast.error("Debes seleccionar al menos un examen");
      return;
    }

    try {
      setIsLoading(true);

      // Crear la orden de exámenes
      await labOrderService.createOrder({
        patient_id: selectedPatient.id,
        order_date: formData.fechaOrden,
        physician_name: formData.medicoSolicitante || undefined,
        priority: formData.prioridad,
        observations: formData.observaciones || undefined,
        exam_ids: selectedExams.map(exam => exam.id),
      });

      toast.success("Orden de exámenes creada exitosamente");
      
      // Reset y cerrar
      setSelectedPatient(null);
      setSearchTerm("");
      setSearchResults([]);
      setShowNewPatientForm(false);
      setFormData({
        fechaOrden: new Date().toISOString().split('T')[0],
        medicoSolicitante: "",
        prioridad: "normal",
        observaciones: "",
      });
      
      setOpen(false);
      onOrderCreated();
    } catch (error: any) {
      console.error("Error al crear orden:", error);
      toast.error(error?.message || "Error al crear la orden. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const parsePrice = (precio: string) =>
      parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

    const totalOriginal = selectedExams.reduce(
      (acc, exam) => acc + parsePrice(exam.precio),
      0
    );

    const RECARGO_TOTAL = 120;
    const recargoUnitario = selectedExams.length > 0 ? RECARGO_TOTAL / selectedExams.length : 0;
    
    const totalCliente = selectedExams.reduce(
      (acc, exam) => acc + parsePrice(exam.precio) * 1.2 + recargoUnitario,
      0
    );

    return {
      original: totalOriginal,
      cliente: totalCliente
    };
  };

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white text-sm flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden lg:inline">Crear Orden de Exámenes</span>
          <span className="hidden sm:inline lg:hidden">Crear Orden</span>
          <span className="sm:hidden">Orden</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Crear Orden de Exámenes
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Paciente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5" />
              Seleccionar Paciente
            </h3>

            {!selectedPatient ? (
              <>
                {/* Búsqueda de paciente */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nuevo Paciente
                  </Button>
                </div>

                {/* Formulario de Nuevo Paciente */}
                {showNewPatientForm && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Crear Nuevo Paciente</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewPatientForm(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Label>Género</Label>
                            <Select
                              value={newPatientData.gender}
                              onValueChange={(value) => setNewPatientData({ ...newPatientData, gender: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">Masculino</SelectItem>
                                <SelectItem value="F">Femenino</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Dirección</Label>
                            <Input
                              value={newPatientData.address}
                              onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                              placeholder="Dirección"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateNewPatient}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creando...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Crear Paciente
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <Card
                        key={patient.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-gray-500">
                                {patient.email || patient.phone || 'Sin contacto'}
                              </p>
                            </div>
                            <Button type="button" variant="outline" size="sm">
                              Seleccionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-semibold">Paciente seleccionado: {selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.email || selectedPatient.phone || 'Sin contacto'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Cambiar
                </Button>
              </div>
            )}
          </div>

          {/* Información de la Orden */}
          {selectedPatient && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Información de la Orden
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaOrden">Fecha de Orden</Label>
                    <Input
                      id="fechaOrden"
                      type="date"
                      value={formData.fechaOrden}
                      onChange={(e) => setFormData({ ...formData, fechaOrden: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicoSolicitante">Médico Solicitante</Label>
                    <Input
                      id="medicoSolicitante"
                      value={formData.medicoSolicitante}
                      onChange={(e) => setFormData({ ...formData, medicoSolicitante: e.target.value })}
                      placeholder="Nombre del médico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridad">Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onValueChange={(value: 'urgente' | 'normal' | 'programada') =>
                        setFormData({ ...formData, prioridad: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="programada">Programada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Resumen de Exámenes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Resumen de Exámenes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total de exámenes:</span>
                      <span className="font-semibold">{selectedExams.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio original:</span>
                      <span className="font-semibold">S/ {total.original.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio al cliente:</span>
                      <span className="font-semibold text-green-600">S/ {total.cliente.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPatient}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Orden
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
