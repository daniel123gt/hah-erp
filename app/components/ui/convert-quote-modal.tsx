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
import { Combobox } from "~/components/ui/combobox";
import { CreatePatientSubmodal } from "~/components/ui/create-patient-submodal";
import {
  User,
  FileText,
  Calendar,
  Search,
  UserPlus,
  Loader2,
  MapPin,
  MapPinned,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import patientsService, { type Patient } from "~/services/patientsService";
import { staffService, type Staff } from "~/services/staffService";
import labQuoteService, { type LabQuote } from "~/services/labQuoteService";
import { getTodayLocal } from "~/lib/dateUtils";
import { useNotificationsOptional } from "~/contexts/NotificationsContext";

interface ConvertQuoteModalProps {
  quote: LabQuote;
  onConverted: () => void;
}

export function ConvertQuoteModal({ quote, onConverted }: ConvertQuoteModalProps) {
  const navigate = useNavigate();
  const notificationsContext = useNotificationsOptional();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  const [districts, setDistricts] = useState<Array<{ name: string; zone: string }>>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);

  const [addressParaOrden, setAddressParaOrden] = useState("");
  const [districtParaOrden, setDistrictParaOrden] = useState("");

  const [formData, setFormData] = useState({
    fechaOrden: getTodayLocal(),
    fechaTomaMuestra: getTodayLocal(),
    horaTomaMuestra: "08:00",
    medicoSolicitante: "",
    prioridad: "normal" as "urgente" | "normal" | "programada",
    observaciones: quote.observations ?? "",
  });

  useEffect(() => {
    if (open) {
      patientsService.getDistricts().then(setDistricts).catch(() => setDistricts([]));
      staffService
        .getStaff({ department: "Medicina General", limit: 200 })
        .then((res) => setDoctors(res.data))
        .catch(() => setDoctors([]));
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedPatient(null);
      setSearchTerm("");
      setSearchResults([]);
      setAddPatientModalOpen(false);
      setAddressParaOrden("");
      setDistrictParaOrden("");
      setFormData({
        fechaOrden: getTodayLocal(),
        fechaTomaMuestra: getTodayLocal(),
        horaTomaMuestra: "08:00",
        medicoSolicitante: "",
        prioridad: "normal",
        observaciones: quote.observations ?? "",
      });
    }
  }, [open, quote.observations]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }
    try {
      setIsSearching(true);
      const results = await patientsService.getPatients({ search: searchTerm, limit: 10 });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Debes seleccionar o crear un paciente primero");
      return;
    }

    const addressFinal = selectedPatient.address?.trim() || addressParaOrden.trim();
    if (!addressFinal) {
      toast.error("La dirección es requerida para la orden de exámenes.");
      return;
    }
    const districtFinal = selectedPatient.district?.trim() || districtParaOrden.trim();
    if (!districtFinal) {
      toast.error("El distrito es requerido para la orden de exámenes.");
      return;
    }

    try {
      setIsLoading(true);

      // Completar datos faltantes del paciente.
      const updates: { id: string; address?: string; district?: string } = { id: selectedPatient.id };
      if (!selectedPatient.address?.trim() && addressParaOrden.trim()) updates.address = addressParaOrden.trim();
      if (!selectedPatient.district?.trim() && districtParaOrden.trim()) updates.district = districtParaOrden.trim();
      if (Object.keys(updates).length > 1) {
        await patientsService.updatePatient(updates);
      }

      const sampleDate = formData.fechaTomaMuestra || formData.fechaOrden;
      const sampleDateTime = formData.horaTomaMuestra?.trim()
        ? new Date(`${sampleDate}T${formData.horaTomaMuestra.trim()}:00`).toISOString()
        : sampleDate;

      const order = await labQuoteService.convertToOrder(quote.id, {
        patient_id: selectedPatient.id,
        order_date: formData.fechaOrden,
        sample_date: sampleDateTime,
        physician_name: formData.medicoSolicitante || undefined,
        priority: formData.prioridad,
        observations: formData.observaciones || undefined,
      });

      toast.success(`Cotización ${quote.quote_number} convertida en orden`);

      if (notificationsContext) {
        try {
          const patientName = selectedPatient.name ?? "Paciente";
          const body = `${patientName} — ${order.items?.length ?? quote.items.length} exámenes`;
          notificationsContext.addNotification("laboratorio_programado", "Orden creada desde cotización", body);
          notificationsContext.markCreatedByMe("lab_order", order.id);
        } catch (err) {
          console.warn("No se pudo agregar notificación:", err);
        }
      }

      setOpen(false);
      onConverted();
      navigate(`/laboratorio/ordenes/${order.id}`);
    } catch (error: any) {
      console.error("Error al convertir cotización:", error);
      toast.error(error?.message || "No se pudo convertir la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <ArrowRightLeft className="w-4 h-4 mr-1" />
          Convertir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Convertir {quote.quote_number} en orden
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen de la cotización */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">
                {quote.items.length} exámenes · precio congelado
              </span>
              <span className="font-bold text-blue-900">S/ {quote.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Selección de Paciente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5" />
              Seleccionar Paciente
            </h3>

            {!selectedPatient ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    className="flex-1 min-w-0"
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setAddPatientModalOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <CreatePatientSubmodal
                  open={addPatientModalOpen}
                  onOpenChange={setAddPatientModalOpen}
                  onCreated={(newPatient) => {
                    setSelectedPatient(newPatient);
                    setSearchResults([]);
                    setSearchTerm("");
                  }}
                  description="Se seleccionará automáticamente para la orden."
                />

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <Card
                        key={patient.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchResults([]);
                          setSearchTerm("");
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-gray-500">
                                {patient.email || patient.phone || "Sin contacto"}
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
                    <p className="font-semibold">Paciente: {selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedPatient.email || selectedPatient.phone || "Sin contacto"}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                    Cambiar
                  </Button>
                </div>
                {!selectedPatient.address?.trim() && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Label htmlFor="addressOrden" className="flex items-center gap-2 text-amber-800 font-medium">
                      <MapPin className="w-4 h-4" />
                      Dirección del paciente (requerida)
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
                      Distrito del paciente (requerido)
                    </Label>
                    <Combobox
                      id="districtOrden"
                      options={districts.map((d) => ({ value: d.name, label: d.zone ? `${d.name} (${d.zone})` : d.name }))}
                      value={districtParaOrden || "__none__"}
                      onValueChange={(v) => setDistrictParaOrden(v === "__none__" ? "" : v)}
                      placeholder="Seleccionar distrito"
                      emptyOption={{ value: "__none__", label: "Seleccionar distrito" }}
                      className="mt-2 max-w-xs"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Información de la Orden */}
          {selectedPatient && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información de la Orden
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Fecha y hora de toma de muestra</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={formData.fechaTomaMuestra}
                      onChange={(e) => setFormData({ ...formData, fechaTomaMuestra: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={formData.horaTomaMuestra}
                      onChange={(e) => setFormData({ ...formData, horaTomaMuestra: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value: "urgente" | "normal" | "programada") =>
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
                <div className="space-y-2">
                  <Label htmlFor="medicoSolicitante">Médico Solicitante</Label>
                  <Combobox
                    id="medicoSolicitante"
                    uppercase
                    options={doctors.map((doc) => ({ value: doc.name, label: doc.name }))}
                    value={formData.medicoSolicitante || "__none__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, medicoSolicitante: value === "__none__" ? "" : value })
                    }
                    placeholder="Seleccionar médico"
                    emptyOption={{ value: "__none__", label: "Ninguno" }}
                  />
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
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !selectedPatient ||
                (!selectedPatient.address?.trim() && !addressParaOrden.trim()) ||
                (!selectedPatient.district?.trim() && !districtParaOrden.trim())
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Convertir en orden
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
