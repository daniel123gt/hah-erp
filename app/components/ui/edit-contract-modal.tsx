import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Label } from "./label";
import { 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Edit,
  Loader2
} from "lucide-react";
import { contractsService, type PatientContract } from "~/services/contractsService";
import { patientsService } from "~/services/patientsService";
import { toast } from "sonner";

interface EditContractModalProps {
  contract: PatientContract;
  onContractUpdated: (contract: PatientContract) => void;
}

export function EditContractModal({ contract, onContractUpdated }: EditContractModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Array<{id: string, name: string}>>([]);
  const [formData, setFormData] = useState({
    patient_id: contract.patient_id,
    contract_date: contract.contract_date,
    responsible_family_member: contract.responsible_family_member,
    service_type: contract.service_type,
    start_date: contract.start_date,
    end_date: contract.end_date || "",
    start_time: contract.start_time || "08:00",
    monthly_amount: contract.monthly_amount.toString(),
    hourly_rate: contract.hourly_rate?.toString() || "",
    payment_method: contract.payment_method,
    status: contract.status,
    notes: contract.notes || ""
  });

  const serviceTypes = [
    "24 HORAS",
    "8 HORAS", 
    "12 HORAS",
    "PROCEDIMIENTO",
    "LABORATORIO",
    "RX",
    "ECOGRAFÍA"
  ];

  const paymentMethods = [
    "Transferencia",
    "Efectivo",
    "PLIN",
    "YAPE",
    "Tranferencia Bancaria"
  ];

  // Cargar pacientes al abrir el modal
  useEffect(() => {
    if (open) {
      loadPatients();
    }
  }, [open]);

  // Actualizar formData cuando cambie el contrato
  useEffect(() => {
    if (open) {
      setFormData({
        patient_id: contract.patient_id,
        contract_date: contract.contract_date,
        responsible_family_member: contract.responsible_family_member,
        service_type: contract.service_type,
        start_date: contract.start_date,
        end_date: contract.end_date || "",
        start_time: contract.start_time || "08:00",
        monthly_amount: contract.monthly_amount.toString(),
        hourly_rate: contract.hourly_rate?.toString() || "",
        payment_method: contract.payment_method,
        status: contract.status,
        notes: contract.notes || ""
      });
    }
  }, [open, contract]);

  const loadPatients = async () => {
    try {
      const response = await patientsService.getPatients({ limit: 100 });
      setPatients(response.data.map(p => ({ id: p.id, name: p.name })));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast.error("Error al cargar la lista de pacientes");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const contractData = {
        id: contract.id,
        patient_id: formData.patient_id,
        contract_date: formData.contract_date,
        responsible_family_member: formData.responsible_family_member,
        service_type: formData.service_type,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        start_time: formData.start_time,
        monthly_amount: parseFloat(formData.monthly_amount),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        payment_method: formData.payment_method,
        status: formData.status,
        notes: formData.notes || undefined
      };

      const updatedContract = await contractsService.updateContract(contractData);
      onContractUpdated(updatedContract);
      
      toast.success("Contrato actualizado exitosamente");
      setOpen(false);
    } catch (error) {
      console.error("Error al actualizar contrato:", error);
      toast.error("Error al actualizar el contrato. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        patient_id: contract.patient_id,
        contract_date: contract.contract_date,
        responsible_family_member: contract.responsible_family_member,
        service_type: contract.service_type,
        start_date: contract.start_date,
        end_date: contract.end_date || "",
        start_time: contract.start_time || "08:00",
        monthly_amount: contract.monthly_amount.toString(),
        hourly_rate: contract.hourly_rate?.toString() || "",
        payment_method: contract.payment_method,
        status: contract.status,
        notes: contract.notes || ""
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Editar Contrato
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Modifica los datos del contrato {contract.contract_number}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-patient_id">Paciente *</Label>
                  <select
                    id="edit-patient_id"
                    value={formData.patient_id}
                    onChange={(e) => handleInputChange("patient_id", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsible_family_member">Familiar Responsable *</Label>
                  <Input
                    id="edit-responsible_family_member"
                    value={formData.responsible_family_member}
                    onChange={(e) => handleInputChange("responsible_family_member", e.target.value)}
                    placeholder="Nombre del familiar responsable"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contract_date">Fecha del Contrato *</Label>
                  <Input
                    id="edit-contract_date"
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => handleInputChange("contract_date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-service_type">Tipo de Servicio *</Label>
                  <select
                    id="edit-service_type"
                    value={formData.service_type}
                    onChange={(e) => handleInputChange("service_type", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-start_date">Fecha de Inicio *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end_date">Fecha de Fin</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-start_time">Hora de Inicio</Label>
                  <Input
                    id="edit-start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado *</Label>
                  <select
                    id="edit-status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-monthly_amount">Monto Mensual (S/.) *</Label>
                  <Input
                    id="edit-monthly_amount"
                    type="number"
                    value={formData.monthly_amount}
                    onChange={(e) => handleInputChange("monthly_amount", e.target.value)}
                    placeholder="5000"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hourly_rate">Tarifa por Hora (S/.)</Label>
                  <Input
                    id="edit-hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                    placeholder="100"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-payment_method">Método de Pago *</Label>
                  <select
                    id="edit-payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange("payment_method", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observaciones</Label>
                <textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Observaciones adicionales sobre el contrato..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Actualizando..." : "Actualizar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
