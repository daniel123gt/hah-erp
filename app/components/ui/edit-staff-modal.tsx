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
  Edit,
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

interface EditStaffModalProps {
  staff: Staff;
  onStaffUpdated: (updatedStaff: Staff) => void;
}

export function EditStaffModal({ staff, onStaffUpdated }: EditStaffModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    position: staff.position,
    department: staff.department,
    hireDate: staff.hireDate,
    salary: staff.salary.toString(),
    specialties: staff.specialties || [],
    schedule: staff.schedule || "",
    status: staff.status
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Actualizar empleado usando el servicio de Supabase
      const updatedStaff = await staffService.updateStaff({
        id: staff.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        hire_date: formData.hireDate,
        salary: parseFloat(formData.salary),
        qualifications: formData.specialties.length > 0 ? formData.specialties : undefined,
        status: formData.status === 'active' ? 'Activo' : formData.status === 'inactive' ? 'Inactivo' : 'Suspendido'
      });

      // Convertir a formato del modal para el callback
      const modalStaff: Staff = {
        ...staff,
        name: updatedStaff.name,
        email: updatedStaff.email || '',
        phone: updatedStaff.phone || '',
        position: updatedStaff.position,
        department: updatedStaff.department || '',
        hireDate: updatedStaff.hire_date || new Date().toISOString().split('T')[0],
        salary: updatedStaff.salary || 0,
        specialties: updatedStaff.qualifications,
        schedule: formData.schedule || undefined,
        status: updatedStaff.status === 'Activo' ? 'active' : updatedStaff.status === 'Inactivo' ? 'inactive' : 'vacation'
      };

      onStaffUpdated(modalStaff);
      toast.success("Empleado actualizado exitosamente");
      setOpen(false);
    } catch (error) {
      console.error("Error al actualizar empleado:", error);
      toast.error("Error al actualizar el empleado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        position: staff.position,
        department: staff.department,
        hireDate: staff.hireDate,
        salary: staff.salary.toString(),
        specialties: staff.specialties || [],
        schedule: staff.schedule || "",
        status: staff.status
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Editar Empleado
          </DialogTitle>
          <DialogDescription>
            Modifica la información del empleado {staff.name}
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
                  <Label htmlFor="edit-name">Nombre Completo *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Dr. Roberto Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Ej: roberto.silva@healthathome.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Teléfono *</Label>
                  <Input
                    id="edit-phone"
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
                  <Label htmlFor="edit-position">Posición *</Label>
                  <select
                    id="edit-position"
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
                  <Label htmlFor="edit-department">Departamento *</Label>
                  <select
                    id="edit-department"
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
                  <Label htmlFor="edit-hireDate">Fecha de Contratación *</Label>
                  <Input
                    id="edit-hireDate"
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
                  <Label htmlFor="edit-salary">Salario (S/) *</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    placeholder="Ej: 4500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-schedule">Horario de Trabajo</Label>
                  <Input
                    id="edit-schedule"
                    value={formData.schedule}
                    onChange={(e) => handleInputChange("schedule", e.target.value)}
                    placeholder="Ej: Lunes a Viernes 8:00 - 17:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado del Empleado</Label>
                  <select
                    id="edit-status"
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
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
