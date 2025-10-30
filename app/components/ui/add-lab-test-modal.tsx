import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { 
  Plus, 
  FlaskConical, 
  Clock, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";

interface LabTest {
  id: string;
  patientName: string;
  patientEmail: string;
  testName: string;
  category: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "critical";
  priority: "low" | "medium" | "high" | "urgent";
  requestedBy: string;
  requestedDate: string;
  completedDate?: string;
  result?: string;
  notes?: string;
  price: number;
}

interface AddLabTestModalProps {
  onLabTestAdded: (labTest: LabTest) => void;
}

const mockDoctors = [
  { name: "Dr. Roberto Silva", specialty: "Medicina General" },
  { name: "Dra. Elena Morales", specialty: "Enfermería" },
  { name: "Dr. Carlos Mendoza", specialty: "Cardiología" },
  { name: "Lic. Miguel Torres", specialty: "Laboratorio" }
];

const mockPatients = [
  { name: "María González", email: "maria.gonzalez@email.com", phone: "+51 999 123 456" },
  { name: "Carlos Rodríguez", email: "carlos.rodriguez@email.com", phone: "+51 999 234 567" },
  { name: "Ana Torres", email: "ana.torres@email.com", phone: "+51 999 345 678" },
  { name: "Luis Mendoza", email: "luis.mendoza@email.com", phone: "+51 999 456 789" }
];

const testCategories = [
  "Hematología",
  "Bioquímica",
  "Función Renal",
  "Inmunología",
  "Microbiología",
  "Parasitología",
  "Hormonas",
  "Marcadores Tumorales",
  "Coagulación",
  "Electrolitos"
];

const availableTests = [
  { name: "Hemograma Completo", category: "Hematología", price: 45.00 },
  { name: "Glucosa en Ayunas", category: "Bioquímica", price: 35.00 },
  { name: "Perfil Lipídico", category: "Bioquímica", price: 65.00 },
  { name: "Creatinina y Urea", category: "Función Renal", price: 40.00 },
  { name: "Prueba de Embarazo", category: "Inmunología", price: 25.00 },
  { name: "Tiroides (TSH, T3, T4)", category: "Hormonas", price: 80.00 },
  { name: "Urocultivo", category: "Microbiología", price: 55.00 },
  { name: "Coprocultivo", category: "Microbiología", price: 50.00 },
  { name: "Hemoglobina Glicosilada", category: "Bioquímica", price: 60.00 },
  { name: "Proteína C Reactiva", category: "Bioquímica", price: 45.00 }
];

export function AddLabTestModal({ onLabTestAdded }: AddLabTestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    selectedTests: [] as string[],
    status: "pending" as const,
    priority: "medium" as const,
    requestedBy: "",
    requestedDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePatientChange = (patientName: string) => {
    const patient = mockPatients.find(p => p.name === patientName);
    setFormData(prev => ({
      ...prev,
      patientName,
      patientEmail: patient?.email || ""
    }));
  };

  const handleTestToggle = (testName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTests: prev.selectedTests.includes(testName)
        ? prev.selectedTests.filter(t => t !== testName)
        : [...prev.selectedTests, testName]
    }));
  };

  const getSelectedTestsData = () => {
    return formData.selectedTests.map(testName => 
      availableTests.find(t => t.name === testName)
    ).filter(Boolean);
  };

  const getTotalPrice = () => {
    return getSelectedTestsData().reduce((total, test) => total + (test?.price || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedTests.length === 0) {
      alert("Por favor seleccione al menos un examen");
      return;
    }

    // Crear un examen por cada test seleccionado
    const selectedTestsData = getSelectedTestsData();
    selectedTestsData.forEach((test, index) => {
      const newLabTest: LabTest = {
        id: `LT${Date.now()}-${index}`,
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        testName: test!.name,
        category: test!.category,
        status: formData.status,
        priority: formData.priority,
        requestedBy: formData.requestedBy,
        requestedDate: formData.requestedDate,
        price: test!.price,
        notes: formData.notes
      };

      onLabTestAdded(newLabTest);
    });

    setIsOpen(false);
    setFormData({
      patientName: "",
      patientEmail: "",
      selectedTests: [],
      status: "pending",
      priority: "medium",
      requestedBy: "",
      requestedDate: new Date().toISOString().split('T')[0],
      notes: ""
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Baja</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800">Media</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Examen
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Solicitar Nuevo Examen
          </DialogTitle>
          <DialogDescription>
            Complete la información para solicitar un nuevo examen de laboratorio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary-blue" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  value={formData.patientName}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {mockPatients.map((patient) => (
                    <option key={patient.name} value={patient.name}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => handleInputChange("patientEmail", e.target.value)}
                    className="pl-10"
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Exámenes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-primary-blue" />
                Seleccionar Exámenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Exámenes Disponibles * (Seleccione uno o más)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {availableTests.map((test) => (
                    <div
                      key={test.name}
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.selectedTests.includes(test.name)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTestToggle(test.name)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedTests.includes(test.name)}
                        onChange={() => handleTestToggle(test.name)}
                        className="mt-1 h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{test.name}</p>
                        <p className="text-xs text-gray-500">{test.category}</p>
                        <p className="text-sm font-semibold text-primary-blue">S/ {test.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.selectedTests.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Exámenes seleccionados:</strong> {formData.selectedTests.length}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Total:</strong> S/ {getTotalPrice().toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Solicitud
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="date"
                      value={formData.requestedDate}
                      onChange={(e) => handleInputChange("requestedDate", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Total
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      value={`S/ ${getTotalPrice().toFixed(2)}`}
                      className="pl-10 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración del Examen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary-blue" />
                Configuración del Examen
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solicitado por *
                </label>
                <select
                  value={formData.requestedBy}
                  onChange={(e) => handleInputChange("requestedBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar doctor</option>
                  {mockDoctors.map((doctor) => (
                    <option key={doctor.name} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Notas adicionales sobre el examen..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de los Exámenes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Paciente:</p>
                    <p className="font-medium">{formData.patientName || "No seleccionado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium">{formData.patientEmail || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado y Prioridad:</p>
                    <div className="flex gap-2">
                      {getStatusBadge(formData.status)}
                      {getPriorityBadge(formData.priority)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Solicitado por:</p>
                    <p className="font-medium">{formData.requestedBy || "No seleccionado"}</p>
                  </div>
                </div>
                
                {formData.selectedTests.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Exámenes Seleccionados:</p>
                    <div className="space-y-2">
                      {getSelectedTestsData().map((test, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium text-sm">{test!.name}</p>
                            <p className="text-xs text-gray-500">{test!.category}</p>
                          </div>
                          <p className="font-semibold text-primary-blue">S/ {test!.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-600">Total a pagar:</p>
                        <p className="text-lg font-bold text-primary-blue">S/ {getTotalPrice().toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.selectedTests.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No hay exámenes seleccionados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={formData.selectedTests.length === 0}
            >
              {formData.selectedTests.length === 0 
                ? "Seleccionar Exámenes" 
                : `Solicitar ${formData.selectedTests.length} Examen${formData.selectedTests.length > 1 ? 'es' : ''}`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
