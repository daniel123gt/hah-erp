import { useState, useEffect } from "react";
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
  Edit, 
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

interface EditLabTestModalProps {
  labTest: LabTest;
  onLabTestUpdated: (labTest: LabTest) => void;
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

export function EditLabTestModal({ labTest, onLabTestUpdated }: EditLabTestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<LabTest>(labTest);

  useEffect(() => {
    setFormData(labTest);
  }, [labTest]);

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
      patientEmail: patient?.email || prev.patientEmail
    }));
  };

  const handleTestChange = (testName: string) => {
    const test = availableTests.find(t => t.name === testName);
    setFormData(prev => ({
      ...prev,
      testName,
      category: test?.category || prev.category,
      price: test?.price || prev.price
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedLabTest: LabTest = {
      ...formData,
      completedDate: formData.status === "completed" && !formData.completedDate 
        ? new Date().toISOString().split('T')[0] 
        : formData.completedDate
    };

    onLabTestUpdated(updatedLabTest);
    setIsOpen(false);
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
        <Button size="sm" variant="outline">
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Editar Examen #{labTest.id}
          </DialogTitle>
          <DialogDescription>
            Modifique la información del examen de laboratorio
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

          {/* Información del Examen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-primary-blue" />
                Información del Examen
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Examen *
                </label>
                <select
                  value={formData.testName}
                  onChange={(e) => handleTestChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar examen</option>
                  {availableTests.map((test) => (
                    <option key={test.name} value={test.name}>
                      {test.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  placeholder="Categoría del examen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (S/)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
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
              <div>
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
              {formData.status === "completed" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Completado
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="date"
                      value={formData.completedDate || ""}
                      onChange={(e) => handleInputChange("completedDate", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Resultados del Examen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resultado
                </label>
                <textarea
                  value={formData.result || ""}
                  onChange={(e) => handleInputChange("result", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Ingrese el resultado del examen..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-primary-blue" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Notas adicionales sobre el examen..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Cambios */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Paciente:</p>
                  <p className="font-medium">{formData.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Examen:</p>
                  <p className="font-medium">{formData.testName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categoría:</p>
                  <p className="font-medium">{formData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio:</p>
                  <p className="font-medium">S/ {formData.price.toFixed(2)}</p>
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
                  <p className="font-medium">{formData.requestedBy}</p>
                </div>
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
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
