import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Droplets,
  AlertTriangle,
  Plus,
  X
} from "lucide-react";
import { patientsService } from "~/services/patientsService";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  dni?: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  district?: string;
  lastVisit: string;
  status: "active" | "inactive" | "pending";
  bloodType?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  primaryPhysician?: string;
  currentMedications?: string[];
  primaryDiagnosis?: string;
}

interface AddPatientModalProps {
  onPatientAdded: (patient: Patient) => void;
}

export function AddPatientModal({ onPatientAdded }: AddPatientModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    district: "",
    bloodType: "",
    allergies: [] as string[],
    emergencyContactName: "",
    emergencyContactPhone: "",
    primaryPhysician: "",
    currentMedications: [] as string[],
    primaryDiagnosis: "",
    status: "active" as "active" | "inactive" | "pending"
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [districts, setDistricts] = useState<Array<{ name: string; zone: string }>>([]);

  useEffect(() => {
    if (open) {
      patientsService.getDistricts().then(setDistricts).catch(() => setDistricts([]));
    }
  }, [open]);

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["Masculino", "Femenino"];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const handleAddMedication = () => {
    if (newMedication.trim() !== "" && !formData.currentMedications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newMedication.trim()]
      }));
      setNewMedication("");
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(m => m !== medication)
    }));
  };

  const generatePatientId = () => {
    const count = Math.floor(Math.random() * 1000) + 1;
    return `P${count.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
             const dni = formData.dni.trim();
             if (dni) {
               const taken = await patientsService.isDniTaken(dni);
               if (taken) {
                 toast.error("Este número de documento ya está registrado para otro paciente.");
                 setIsLoading(false);
                 return;
               }
             }
             // Crear paciente usando el servicio de Supabase
             const createdPatient = await patientsService.createPatient({
               name: formData.name,
               dni: formData.dni.trim() || undefined,
               email: formData.email,
               phone: formData.phone,
               age: parseInt(formData.age),
               gender: formData.gender === 'Masculino' ? 'M' : 'F',
               address: formData.address,
               district: formData.district || undefined,
               last_visit: new Date().toISOString().split('T')[0],
               status: formData.status === 'active' ? 'Activo' : formData.status === 'inactive' ? 'Inactivo' : 'Pendiente',
               blood_type: formData.bloodType || undefined,
               allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
               emergency_contact_name: formData.emergencyContactName || undefined,
               emergency_contact_phone: formData.emergencyContactPhone || undefined,
               primary_physician: formData.primaryPhysician || undefined,
               current_medications: formData.currentMedications.length > 0 ? formData.currentMedications : undefined,
               primary_diagnosis: formData.primaryDiagnosis || undefined
             });

             // Convertir a formato del modal para el callback
             const modalPatient: Patient = {
               id: createdPatient.id,
               name: createdPatient.name,
               dni: createdPatient.dni,
               email: createdPatient.email || '',
               phone: createdPatient.phone || '',
               age: createdPatient.age || 0,
               gender: createdPatient.gender === 'M' ? 'Masculino' : 'Femenino',
               address: createdPatient.address || '',
               district: createdPatient.district,
               lastVisit: createdPatient.last_visit || new Date().toISOString().split('T')[0],
               status: createdPatient.status === 'Activo' ? 'active' : createdPatient.status === 'Inactivo' ? 'inactive' : 'pending',
               bloodType: createdPatient.blood_type,
               allergies: createdPatient.allergies,
               emergencyContactName: createdPatient.emergency_contact_name,
               emergencyContactPhone: createdPatient.emergency_contact_phone,
               primaryPhysician: createdPatient.primary_physician,
               currentMedications: createdPatient.current_medications,
               primaryDiagnosis: createdPatient.primary_diagnosis
             };

      onPatientAdded(modalPatient);
      
      toast.success("Paciente creado exitosamente");
      
             // Reset form
             setFormData({
               name: "",
               dni: "",
               email: "",
               phone: "",
               age: "",
               gender: "",
               address: "",
               district: "",
               bloodType: "",
               allergies: [],
               emergencyContactName: "",
               emergencyContactPhone: "",
               primaryPhysician: "",
               currentMedications: [],
               primaryDiagnosis: "",
               status: "active"
             });
      
      setOpen(false);
    } catch (error) {
      console.error("Error al agregar paciente:", error);
      toast.error("Error al crear el paciente. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Agregar Nuevo Paciente
          </DialogTitle>
          <DialogDescription>
            Complete la información del paciente para registrarlo en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-blue" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: María González"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">Nro. documento (para portal de resultados)</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    placeholder="Ej: 12345678"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Edad *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="Ej: 35"
                    min="0"
                    max="120"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género *</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Seleccionar género</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary-blue" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Ej: maria@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Ej: +51 999 123 456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Ej: Av. Arequipa 123, Lima"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Distrito</Label>
                  <Select
                    value={formData.district || "__none__"}
                    onValueChange={(value) => handleInputChange("district", value === "__none__" ? "" : value)}
                  >
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Seleccionar distrito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {districts.map((d) => (
                        <SelectItem key={d.name} value={d.name}>
                          {d.name} {d.zone ? `(${d.zone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Médica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-primary-blue" />
                Información Médica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Tipo de Sangre</Label>
                  <select
                    id="bloodType"
                    value={formData.bloodType}
                    onChange={(e) => handleInputChange("bloodType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Seleccionar tipo de sangre</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado del Paciente</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Alergias</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Ej: Penicilina"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                    />
                    <Button type="button" onClick={handleAddAllergy} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {allergy}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => handleRemoveAllergy(allergy)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contacto de Emergencia</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    placeholder="Nombre del contacto de emergencia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                    placeholder="Ej: +51 999 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryPhysician">Médico Tratante</Label>
                  <Input
                    id="primaryPhysician"
                    value={formData.primaryPhysician}
                    onChange={(e) => handleInputChange("primaryPhysician", e.target.value)}
                    placeholder="Nombre del médico tratante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryDiagnosis">Diagnóstico Principal</Label>
                  <Input
                    id="primaryDiagnosis"
                    value={formData.primaryDiagnosis}
                    onChange={(e) => handleInputChange("primaryDiagnosis", e.target.value)}
                    placeholder="Diagnóstico principal del paciente"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medicamentos Actuales</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Ej: Metformina 500mg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMedication())}
                  />
                  <Button type="button" onClick={handleAddMedication} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {formData.currentMedications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.currentMedications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {medication}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => handleRemoveMedication(medication)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={isLoading}
            >
              {isLoading ? "Agregando..." : "Agregar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
