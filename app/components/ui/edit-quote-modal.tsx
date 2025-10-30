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
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  AlertCircle,
  Trash2,
  PlusCircle
} from "lucide-react";

interface Quote {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  createdAt: string;
  validUntil: string;
  notes?: string;
}

interface EditQuoteModalProps {
  quote: Quote;
  onQuoteUpdated: (quote: Quote) => void;
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

const availableServices = [
  { name: "Consulta Médica General", price: 80.00, category: "Consultas" },
  { name: "Hemograma Completo", price: 45.00, category: "Laboratorio" },
  { name: "Electrocardiograma", price: 120.00, category: "Cardiología" },
  { name: "Radiografía de Tórax", price: 95.00, category: "Imagenología" },
  { name: "Vacuna contra la Influenza", price: 35.00, category: "Vacunación" },
  { name: "Consulta Cardiológica", price: 150.00, category: "Cardiología" },
  { name: "Ecocardiografía", price: 200.00, category: "Cardiología" },
  { name: "Perfil Lipídico", price: 65.00, category: "Laboratorio" },
  { name: "Glucosa en Ayunas", price: 35.00, category: "Laboratorio" },
  { name: "Creatinina", price: 40.00, category: "Laboratorio" }
];

export function EditQuoteModal({ quote, onQuoteUpdated }: EditQuoteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Quote>(quote);

  useEffect(() => {
    setFormData(quote);
  }, [quote]);

  const handleInputChange = (field: string, value: string) => {
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
      patientEmail: patient?.email || prev.patientEmail,
      patientPhone: patient?.phone || prev.patientPhone
    }));
  };

  const addService = (service: { name: string; price: number; category: string }) => {
    const existingService = formData.services.find(s => s.name === service.name);
    if (existingService) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.map(s =>
          s.name === service.name
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, { name: service.name, price: service.price, quantity: 1 }]
      }));
    }
  };

  const removeService = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.name !== serviceName)
    }));
  };

  const updateServiceQuantity = (serviceName: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceName);
      return;
    }
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s =>
        s.name === serviceName
          ? { ...s, quantity }
          : s
      )
    }));
  };

  const calculateTotal = () => {
    return formData.services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedQuote: Quote = {
      ...formData,
      totalAmount: calculateTotal()
    };

    onQuoteUpdated(updatedQuote);
    setIsOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Aceptada</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expirada</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
            Editar Cotización #{quote.id}
          </DialogTitle>
          <DialogDescription>
            Modifique la información de la cotización médica
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
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange("patientPhone", e.target.value)}
                    className="pl-10"
                    placeholder="+51 999 123 456"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-primary-blue" />
                Doctor Responsable
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor *
                </label>
                <select
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange("doctorName", e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="expired">Expirada</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Servicios a Cotizar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de Servicios Disponibles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar Servicios
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {availableServices.map((service) => (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => addService(service)}
                      className="flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded border"
                    >
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.category} - S/ {service.price.toFixed(2)}</p>
                      </div>
                      <PlusCircle className="w-4 h-4 text-primary-blue" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Servicios Seleccionados */}
              {formData.services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicios Seleccionados
                  </label>
                  <div className="space-y-2">
                    {formData.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">S/ {service.price.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">Cantidad:</label>
                          <Input
                            type="number"
                            value={service.quantity}
                            onChange={(e) => updateServiceQuantity(service.name, parseInt(e.target.value) || 0)}
                            className="w-16"
                            min="1"
                          />
                          <span className="text-sm font-medium">
                            S/ {(service.price * service.quantity).toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeService(service.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fecha de Validez */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Validez de la Cotización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válida hasta *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange("validUntil", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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
                  placeholder="Notas adicionales sobre la cotización..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Cambios */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <DollarSign className="w-5 h-5" />
                Resumen de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Paciente:</p>
                    <p className="font-medium">{formData.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doctor:</p>
                    <p className="font-medium">{formData.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado:</p>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(formData.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Válida hasta:</p>
                    <p className="font-medium">
                      {formData.validUntil 
                        ? new Date(formData.validUntil).toLocaleDateString('es-ES')
                        : "No especificada"
                      }
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-blue">S/ {calculateTotal().toFixed(2)}</span>
                  </div>
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
