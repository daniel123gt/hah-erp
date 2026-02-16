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
import { procedureService, type ProcedureCatalogItem, PAYMENT_METHOD_OPTIONS, type PaymentMethodKey, recordToPaymentPayload } from "~/services/procedureService";
import { patientsService } from "~/services/patientsService";
import { toast } from "sonner";
import { Plus, User, FileText, DollarSign, MapPin } from "lucide-react";

interface AddProcedureModalProps {
  onCreated: () => void;
}

const emptyForm = {
  fecha: new Date().toISOString().split("T")[0],
  patient_id: "" as string | null,
  patient_name: "",
  procedure_catalog_id: "" as string | null,
  procedure_name: "",
  district: "",
  paymentMethod: "efectivo" as PaymentMethodKey,
  paymentAmount: 0,
  numero_operacion: "",
  gastos_material: 0,
  combustible: 0,
  costo_adicional_servicio: 0,
  observacion: "",
};

export function AddProcedureModal({ onCreated }: AddProcedureModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [catalog, setCatalog] = useState<ProcedureCatalogItem[]>([]);
  const [districts, setDistricts] = useState<Array<{ name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingData(true);
      try {
        const [pRes, cList, dList] = await Promise.all([
          patientsService.getPatients({ limit: 500 }),
          procedureService.getCatalog(false),
          patientsService.getDistricts(),
        ]);
        setPatients(pRes.data.map((p) => ({ id: p.id, name: p.name })));
        setCatalog(cList);
        setDistricts(dList.map((d) => ({ name: d.name })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payment = recordToPaymentPayload(form.paymentMethod, form.paymentAmount);
      await procedureService.createRecord({
        fecha: form.fecha,
        patient_id: form.patient_id || null,
        patient_name: form.patient_name || null,
        quantity: 1,
        procedure_catalog_id: form.procedure_catalog_id || null,
        procedure_name: form.procedure_name || null,
        district: form.district || null,
        ...payment,
        numero_operacion: form.numero_operacion || null,
        gastos_material: form.gastos_material,
        combustible: form.combustible,
        costo_adicional_servicio: form.costo_adicional_servicio,
        observacion: form.observacion || null,
      });
      toast.success("Procedimiento registrado");
      setForm(emptyForm);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const ingreso = form.paymentAmount;
  const utilidad =
    ingreso -
    form.gastos_material -
    form.combustible -
    form.costo_adicional_servicio;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo procedimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar procedimiento</DialogTitle>
          <DialogDescription>
            Complete los datos del procedimiento realizado y los pagos recibidos.
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Paciente y procedimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Paciente</label>
                  <select
                    value={form.patient_id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        patient_id: v || null,
                        patient_name: v ? (patients.find((p) => p.id === v)?.name ?? f.patient_name) : f.patient_name,
                      }));
                    }}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Sin asignar / Otro</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre (si no está en la lista)</label>
                  <Input
                    value={form.patient_name}
                    onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <Input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Procedimiento</label>
                  <select
                    value={form.procedure_catalog_id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        procedure_catalog_id: v || null,
                        procedure_name: v ? catalog.find((c) => c.id === v)?.name ?? "" : "",
                      }));
                    }}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Seleccionar...</option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (S/ {Number(c.base_price_soles).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Distrito / Ubicación</label>
                  <select
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Seleccionar...</option>
                    {districts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  Pago recibido (S/.)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Método de pago</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethodKey }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto (S/.)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.paymentAmount || ""}
                    onChange={(e) => setForm((f) => ({ ...f, paymentAmount: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Número de operación / Referencia</label>
                  <Input
                    value={form.numero_operacion}
                    onChange={(e) => setForm((f) => ({ ...f, numero_operacion: e.target.value }))}
                    placeholder="Ej. LINK, 28752876"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Costos (S/.)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gastos de material</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.gastos_material || ""}
                    onChange={(e) => setForm((f) => ({ ...f, gastos_material: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Combustible</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.combustible || ""}
                    onChange={(e) => setForm((f) => ({ ...f, combustible: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo adicional / servicio</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.costo_adicional_servicio || ""}
                    onChange={(e) => setForm((f) => ({ ...f, costo_adicional_servicio: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Observación</label>
                  <textarea
                    value={form.observacion}
                    onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-600">Ingreso total: </span>
                <span className="font-medium">S/ {ingreso.toFixed(2)}</span>
                <span className="text-gray-600 ml-4">Utilidad: </span>
                <span className="font-medium text-green-600">S/ {utilidad.toFixed(2)}</span>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
