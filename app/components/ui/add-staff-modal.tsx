import { useState } from "react";
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
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Stethoscope,
  Plus,
  X,
  Clock,
  GraduationCap
} from "lucide-react";
import { staffService } from "~/services/staffService";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "vacation";
  salary: number;
  avatar?: string;
  specialties?: string[];
  schedule?: string;
}

interface AddStaffModalProps {
  onStaffAdded: (staff: Staff) => void;
}

export function AddStaffModal({ onStaffAdded }: AddStaffModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    hireDate: new Date().toISOString().split('T')[0],
    salary: "",
    specialties: [] as string[],
    schedule: "",
    status: "active" as "active" | "inactive" | "vacation"
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  const departments = [
    "Medicina General",
    "Enfermería", 
    "Laboratorio",
    "Administración",
    "Cardiología",
    "Pediatría",
    "Ginecología",
    "Cirugía",
    "Radiología",
    "Farmacia"
  ];

  const positions = [
    "Médico General",
    "Médico Especialista",
    "Enfermera",
    "Enfermera Jefe",
    "Técnico de Laboratorio",
    "Técnico de Radiología",
    "Recepcionista",
    "Administrador",
    "Contador",
    "Secretaria",
    "Auxiliar de Enfermería",
    "Farmacéutico"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const generateStaffId = () => {
    const count = Math.floor(Math.random() * 1000) + 1;
    return `S${count.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Crear empleado usando el servicio de Supabase
      const createdStaff = await staffService.createStaff({
        name: formData.name,
        email: formData.email.trim() || undefined,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        hire_date: formData.hireDate,
        status: formData.status === 'active' ? 'Activo' : formData.status === 'inactive' ? 'Inactivo' : 'Suspendido',
        salary: parseFloat(formData.salary),
        qualifications: formData.specialties.length > 0 ? formData.specialties : undefined
      });

      // Convertir a formato del modal para el callback
      const modalStaff: Staff = {
        id: createdStaff.id,
        name: createdStaff.name,
        email: createdStaff.email || '',
        phone: createdStaff.phone || '',
        position: createdStaff.position,
        department: createdStaff.department || '',
        hireDate: createdStaff.hire_date || new Date().toISOString().split('T')[0],
        status: createdStaff.status === 'Activo' ? 'active' : createdStaff.status === 'Inactivo' ? 'inactive' : 'vacation',
        salary: createdStaff.salary || 0,
        specialties: createdStaff.qualifications,
        schedule: 'Horario por definir'
      };

      onStaffAdded(modalStaff);
      
      toast.success("Empleado creado exitosamente");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        hireDate: new Date().toISOString().split('T')[0],
        salary: "",
        specialties: [],
        schedule: "",
        status: "active"
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Error al agregar empleado:", error);
      toast.error("Error al crear el empleado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Agregar Nuevo Empleado
          </DialogTitle>
          <DialogDescription>
            Complete la información del empleado para registrarlo en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-primary-blue" />
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
                    placeholder="Ej: Dr. Roberto Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Ej: roberto.silva@healthathome.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Ej: +51 999 111 222"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Laboral */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-primary-blue" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posición *</Label>
                  <select
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Seleccionar posición</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Seleccionar departamento</option>
                    {departments.map(department => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Fecha de Contratación *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleInputChange("hireDate", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Económica y Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-blue" />
                Información Económica y Horarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salario (S/) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    placeholder="Ej: 4500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Horario de Trabajo</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => handleInputChange("schedule", e.target.value)}
                    placeholder="Ej: Lunes a Viernes 8:00 - 17:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado del Empleado</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="vacation">Vacaciones</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Especialidades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-primary-blue" />
                Especialidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Especialidades Médicas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Ej: Cardiología Intervencionista"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                  />
                  <Button type="button" onClick={handleAddSpecialty} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {specialty}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-500" 
                          onClick={() => handleRemoveSpecialty(specialty)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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
              {isLoading ? "Agregando..." : "Agregar Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
