import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
import { Plus, User, FileText, Calendar, Search, UserPlus, Loader2, X, Copy, KeyRound, ExternalLink, Home, MapPin, MapPinned } from "lucide-react";
import { toast } from "sonner";
import patientsService, { type Patient } from "~/services/patientsService";
import { staffService, type Staff } from "~/services/staffService";
import { useAuthStore, getAppRole } from "~/store/authStore";
import labOrderService from "~/services/labOrderService";
import {
  ensurePatientPortalUser,
  generatePortalPassword,
} from "~/services/patientPortalService";

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
  const user = useAuthStore((s) => s.user);
  const isGestor = getAppRole(user) === "gestor";
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
    dni: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    district: "",
  });
  const [districts, setDistricts] = useState<Array<{ name: string; zone: string }>>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);

  // Estados para información de la orden
  const [formData, setFormData] = useState({
    fechaOrden: new Date().toISOString().split('T')[0],
    medicoSolicitante: "",
    prioridad: "normal" as 'urgente' | 'normal' | 'programada',
    observaciones: "",
  });

  // Nro. documento, dirección y distrito para paciente que aún no los tiene (requeridos para órdenes)
  const [dniParaOrden, setDniParaOrden] = useState("");
  const [addressParaOrden, setAddressParaOrden] = useState("");
  const [districtParaOrden, setDistrictParaOrden] = useState("");
  // Credenciales de portal creadas (mostrar en diálogo para copiar y navegar)
  const [portalCredentials, setPortalCredentials] = useState<{ dni: string; password: string; orderId?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      patientsService.getDistricts().then(setDistricts).catch(() => setDistricts([]));
      staffService
        .getStaff({ department: "Medicina General", limit: 200 })
        .then((res) => setDoctors(res.data))
        .catch(() => setDoctors([]));
    }
  }, [open]);

  // Reset cuando se abre/cierra el modal (no tocamos portalCredentials: el modal de credenciales se cierra solo con sus botones)
  useEffect(() => {
    if (!open) {
      setSelectedPatient(null);
      setSearchTerm("");
      setSearchResults([]);
      setShowNewPatientForm(false);
      setDniParaOrden("");
      setAddressParaOrden("");
      setDistrictParaOrden("");
      setNewPatientData({
        name: "",
        dni: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        district: "",
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
        dni: newPatientData.dni.trim() || undefined,
        email: newPatientData.email || undefined,
        phone: newPatientData.phone || undefined,
        gender: (newPatientData.gender as 'M' | 'F') || undefined,
        address: newPatientData.address || undefined,
        district: newPatientData.district?.trim() || undefined,
      });
      
      setSelectedPatient(newPatient);
      setShowNewPatientForm(false);
      setNewPatientData({ name: "", dni: "", email: "", phone: "", gender: "", address: "", district: "" });
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

    const dniFinal = selectedPatient.dni?.trim() || dniParaOrden.trim();
    if (!dniFinal) {
      toast.error("Para generar usuario y contraseña del portal de resultados, ingrese el Nro. de documento del paciente.");
      return;
    }

    const addressFinal = selectedPatient.address?.trim() || addressParaOrden.trim();
    if (!addressFinal) {
      toast.error("La dirección es requerida para la orden de exámenes. Ingrese la dirección del paciente.");
      return;
    }

    const districtFinal = selectedPatient.district?.trim() || districtParaOrden.trim();
    if (!districtFinal) {
      toast.error("El distrito es requerido para la orden de exámenes. Seleccione el distrito del paciente.");
      return;
    }

    try {
      setIsLoading(true);

      if (dniFinal) {
        const dniTaken = await patientsService.isDniTaken(dniFinal, selectedPatient.id);
        if (dniTaken) {
          toast.error("Este número de documento ya está registrado para otro paciente.");
          setIsLoading(false);
          return;
        }
      }

      let patientToUse = selectedPatient;
      const updates: { id: string; dni?: string; address?: string; district?: string } = { id: selectedPatient.id };
      if (!selectedPatient.dni?.trim() && dniParaOrden.trim()) updates.dni = dniParaOrden.trim();
      if (!selectedPatient.address?.trim() && addressParaOrden.trim()) updates.address = addressParaOrden.trim();
      if (!selectedPatient.district?.trim() && districtParaOrden.trim()) updates.district = districtParaOrden.trim();
      if (Object.keys(updates).length > 1) {
        await patientsService.updatePatient(updates);
        patientToUse = { ...selectedPatient, ...updates };
      }

      // Crear la orden de exámenes
      const orderCreated = await labOrderService.createOrder({
        patient_id: patientToUse.id,
        order_date: formData.fechaOrden,
        physician_name: formData.medicoSolicitante || undefined,
        priority: formData.prioridad,
        observations: formData.observaciones || undefined,
        exam_ids: selectedExams.map(exam => exam.id),
      });

      toast.success("Orden de exámenes creada exitosamente");

      // Crear cuenta de portal para el paciente (login por nro. documento)
      try {
        const password = generatePortalPassword();
        const result = await ensurePatientPortalUser({
          patient_id: patientToUse.id,
          dni: dniFinal,
          full_name: patientToUse.name,
          email: patientToUse.email,
          phone: patientToUse.phone,
          password,
        });
        if (result.ok && !result.already_exists) {
          setPortalCredentials({ dni: dniFinal, password, orderId: orderCreated.id });
          // No cerramos el modal: mostramos las credenciales dentro del mismo
        } else if (result.ok && result.already_exists) {
          toast.info("El paciente ya tiene cuenta de portal para ver sus resultados.");
          setOpen(false);
          onOrderCreated();
        } else if (!result.ok) {
          toast.warning(result.error || "No se pudo crear la cuenta de portal.");
          setOpen(false);
          onOrderCreated();
        }
      } catch (e) {
        console.error("Error al crear cuenta de portal:", e);
        toast.warning("Orden creada. No se pudo crear la cuenta de portal del paciente.");
        setOpen(false);
        onOrderCreated();
      }
      
      if (!portalCredentials) {
        setSelectedPatient(null);
        setSearchTerm("");
        setSearchResults([]);
        setShowNewPatientForm(false);
        setDniParaOrden("");
        setAddressParaOrden("");
        setDistrictParaOrden("");
        setFormData({
          fechaOrden: new Date().toISOString().split('T')[0],
          medicoSolicitante: "",
          prioridad: "normal",
          observaciones: "",
        });
      }
      // No llamar onOrderCreated() aquí cuando mostramos credenciales: el padre limpiaría la
      // selección y desmontaría el modal. Se llama al cerrar la vista de credenciales.
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
    <>
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          if (portalCredentials) onOrderCreated();
          setPortalCredentials(null);
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white text-sm flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden lg:inline">Crear Orden de Exámenes</span>
          <span className="hidden sm:inline lg:hidden">Crear Orden</span>
          <span className="sm:hidden">Orden</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={portalCredentials ? "max-w-md" : "max-w-4xl max-h-[90vh] overflow-y-auto"}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {portalCredentials ? (
              <>
                <KeyRound className="w-5 h-5 text-green-700" />
                Cuenta de portal creada
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Crear Orden de Exámenes
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {portalCredentials ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copie y entregue estos datos al paciente para que pueda ver sus resultados en el portal (login con Nro. documento y contraseña):
            </p>
            <div className="grid gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-500 text-xs">Usuario (Nro. documento)</Label>
                <p className="font-mono text-lg font-semibold mt-1 select-all">{portalCredentials.dni}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Contraseña</Label>
                <p className="font-mono text-lg font-semibold mt-1 select-all">{portalCredentials.password}</p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full bg-primary-blue hover:bg-primary-blue/90"
              onClick={() => {
                const text = `Nro. documento: ${portalCredentials.dni}\nContraseña: ${portalCredentials.password}`;
                navigator.clipboard.writeText(text).then(
                  () => toast.success("Copiado al portapapeles"),
                  () => toast.error("No se pudo copiar")
                );
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar usuario y contraseña
            </Button>
            <div className="flex flex-col gap-2 pt-2 border-t">
              {portalCredentials.orderId && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPortalCredentials(null);
                    setOpen(false);
                    onOrderCreated();
                    navigate(`/laboratorio/ordenes/${portalCredentials.orderId}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ir al detalle de la orden
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPortalCredentials(null);
                  setOpen(false);
                  onOrderCreated();
                  navigate("/laboratorio");
                }}
              >
                <Home className="w-4 h-4 mr-2" />
                Ir a Laboratorio
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setPortalCredentials(null);
                  setOpen(false);
                  onOrderCreated();
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
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
                            <Label>Nro. documento (para portal de resultados)</Label>
                            <Input
                              value={newPatientData.dni}
                              onChange={(e) => setNewPatientData({ ...newPatientData, dni: e.target.value })}
                              placeholder="Ej. 12345678"
                              maxLength={20}
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
                          <div>
                            <Label>Distrito</Label>
                            <Select
                              value={newPatientData.district || "__none__"}
                              onValueChange={(value) => setNewPatientData({ ...newPatientData, district: value === "__none__" ? "" : value })}
                            >
                              <SelectTrigger>
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
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-semibold">Paciente seleccionado: {selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedPatient.dni ? `Nro. doc.: ${selectedPatient.dni}` : "Sin nro. documento"}
                      {selectedPatient.dni ? " · " : ""}
                      {selectedPatient.email || selectedPatient.phone || "Sin contacto"}
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
                {!selectedPatient.dni?.trim() && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Label htmlFor="dniOrden" className="flex items-center gap-2 text-amber-800 font-medium">
                      <KeyRound className="w-4 h-4" />
                      Nro. de documento del paciente (requerido para generar usuario y contraseña del portal de resultados)
                    </Label>
                    <Input
                      id="dniOrden"
                      value={dniParaOrden}
                      onChange={(e) => setDniParaOrden(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20))}
                      placeholder="Ej: 12345678"
                      maxLength={20}
                      className="mt-2 max-w-xs font-mono"
                    />
                  </div>
                )}
                {!selectedPatient.address?.trim() && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Label htmlFor="addressOrden" className="flex items-center gap-2 text-amber-800 font-medium">
                      <MapPin className="w-4 h-4" />
                      Dirección del paciente (requerida para la orden de exámenes)
                    </Label>
                    <Input
                      id="addressOrden"
                      value={addressParaOrden}
                      onChange={(e) => setAddressParaOrden(e.target.value)}
                      placeholder="Ej: Av. Principal 123, distrito"
                      className="mt-2 w-full"
                    />
                  </div>
                )}
                {!selectedPatient.district?.trim() && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Label htmlFor="districtOrden" className="flex items-center gap-2 text-amber-800 font-medium">
                      <MapPinned className="w-4 h-4" />
                      Distrito del paciente (requerido para la orden de exámenes)
                    </Label>
                    <Select
                      value={districtParaOrden || "__none__"}
                      onValueChange={(v) => setDistrictParaOrden(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger id="districtOrden" className="mt-2 max-w-xs">
                        <SelectValue placeholder="Seleccionar distrito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Seleccionar distrito</SelectItem>
                        {districts.map((d) => (
                          <SelectItem key={d.name} value={d.name}>
                            {d.name} {d.zone ? `(${d.zone})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
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
                    <Select
                      value={formData.medicoSolicitante || "__none__"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, medicoSolicitante: value === "__none__" ? "" : value })
                      }
                    >
                      <SelectTrigger id="medicoSolicitante">
                        <SelectValue placeholder="Seleccionar médico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {doctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.name}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    {!isGestor && (
                      <div className="flex justify-between">
                        <span>Precio original:</span>
                        <span className="font-semibold">S/ {total.original.toFixed(2)}</span>
                      </div>
                    )}
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
            <Button
              type="submit"
              disabled={
                isLoading ||
                !selectedPatient ||
                (!(selectedPatient.dni?.trim()) && !dniParaOrden.trim()) ||
                (!(selectedPatient.address?.trim()) && !addressParaOrden.trim()) ||
                (!(selectedPatient.district?.trim()) && !districtParaOrden.trim())
              }
            >
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
        )}
      </DialogContent>

    </Dialog>
    </>
  );
}
