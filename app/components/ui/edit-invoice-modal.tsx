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
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  X,
  Plus as PlusIcon
} from "lucide-react";

interface Service {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "card" | "transfer" | "insurance";
  services: Service[];
  notes?: string;
}

interface EditInvoiceModalProps {
  invoice: Invoice;
  onInvoiceUpdated: (invoice: Invoice) => void;
}

const mockPatients = [
  { name: "María González", email: "maria.gonzalez@email.com", phone: "+51 999 123 456" },
  { name: "Carlos Rodríguez", email: "carlos.rodriguez@email.com", phone: "+51 999 234 567" },
  { name: "Ana Torres", email: "ana.torres@email.com", phone: "+51 999 345 678" },
  { name: "Luis Mendoza", email: "luis.mendoza@email.com", phone: "+51 999 456 789" },
  { name: "Carmen Silva", email: "carmen.silva@email.com", phone: "+51 999 567 890" }
];

const availableServices = [
  { name: "Consulta Médica General", price: 80.00 },
  { name: "Consulta Cardiológica", price: 150.00 },
  { name: "Consulta Dermatológica", price: 120.00 },
  { name: "Hemograma Completo", price: 45.00 },
  { name: "Glucosa en Ayunas", price: 35.00 },
  { name: "Perfil Lipídico", price: 65.00 },
  { name: "Creatinina y Urea", price: 40.00 },
  { name: "Radiografía de Tórax", price: 95.00 },
  { name: "Electrocardiograma", price: 120.00 },
  { name: "Ecocardiografía", price: 200.00 },
  { name: "Prueba de Esfuerzo", price: 180.00 },
  { name: "Vacuna contra la Influenza", price: 35.00 },
  { name: "Consulta de Control", price: 60.00 }
];

export function EditInvoiceModal({ invoice, onInvoiceUpdated }: EditInvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Invoice>(invoice);

  useEffect(() => {
    setFormData(invoice);
  }, [invoice]);

  const [newService, setNewService] = useState({
    name: "",
    quantity: 1,
    unitPrice: 0
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
      patientEmail: patient?.email || prev.patientEmail,
      patientPhone: patient?.phone || prev.patientPhone
    }));
  };

  const handleServiceChange = (serviceName: string) => {
    const service = availableServices.find(s => s.name === serviceName);
    setNewService(prev => ({
      ...prev,
      name: serviceName,
      unitPrice: service?.price || 0
    }));
  };

  const addService = () => {
    if (newService.name && newService.quantity > 0 && newService.unitPrice > 0) {
      const service: Service = {
        ...newService,
        total: newService.quantity * newService.unitPrice
      };
      
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, service]
      }));
      
      setNewService({
        name: "",
        quantity: 1,
        unitPrice: 0
      });
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.services.reduce((acc, service) => acc + service.total, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = calculateTotal();
    const updatedInvoice: Invoice = {
      ...formData,
      totalAmount,
      paidAmount: formData.status === "paid" ? totalAmount : formData.paidAmount
    };

    onInvoiceUpdated(updatedInvoice);
    setIsOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
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
            Editar Factura #{invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Modifique la información de la factura
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la Factura
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Fechas de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Emisión *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange("dueDate", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary-blue" />
                Servicios y Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agregar Servicio */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio
                  </label>
                  <select
                    value={newService.name}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Seleccionar servicio</option>
                    {availableServices.map((service) => (
                      <option key={service.name} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    value={newService.quantity}
                    onChange={(e) => setNewService(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={newService.unitPrice}
                      onChange={(e) => setNewService(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addService}
                    className="w-full bg-primary-blue hover:bg-primary-blue/90"
                    disabled={!newService.name || newService.quantity <= 0 || newService.unitPrice <= 0}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Lista de Servicios */}
              {formData.services.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Servicios Agregados:</h4>
                  {formData.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {service.quantity} | Precio: S/ {service.unitPrice.toFixed(2)} | 
                          Total: S/ {service.total.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeService(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de Pago */}
          {formData.status === "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-primary-blue" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={formData.paymentMethod || ""}
                    onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Seleccionar método</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="insurance">Seguro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Pagado (S/)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => handleInputChange("paidAmount", parseFloat(e.target.value) || 0)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
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
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Notas adicionales sobre la factura..."
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
                  <p className="text-sm text-gray-600">Estado:</p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(formData.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Servicios:</p>
                  <p className="font-medium">{formData.services.length} servicio(s)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total:</p>
                  <p className="font-medium text-green-600 text-lg">
                    S/ {calculateTotal().toFixed(2)}
                  </p>
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
              disabled={formData.services.length === 0}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
