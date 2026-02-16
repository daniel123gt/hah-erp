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
} from "~/components/ui/dialog";
import { procedureService, type ProcedureRecordWithDetails, type ProcedureCatalogItem, PAYMENT_METHOD_OPTIONS, type PaymentMethodKey, getPaymentFromRecord, recordToPaymentPayload } from "~/services/procedureService";
import { patientsService } from "~/services/patientsService";
import { toast } from "sonner";
import { User, FileText, DollarSign } from "lucide-react";

interface EditProcedureModalProps {
  record: ProcedureRecordWithDetails;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditProcedureModal({ record, onClose, onUpdated }: EditProcedureModalProps) {
  const initialPayment = getPaymentFromRecord(record);
  const [form, setForm] = useState({
    fecha: record.fecha,
    patient_id: record.patient_id ?? "",
    patient_name: record.patient_name ?? "",
    quantity: record.quantity,
    procedure_catalog_id: record.procedure_catalog_id ?? "",
    procedure_name: record.procedure_name ?? "",
    district: record.district ?? "",
    paymentMethod: initialPayment.method,
    paymentAmount: initialPayment.amount,
    numero_operacion: record.numero_operacion ?? "",
    gastos_material: record.gastos_material ?? 0,
    combustible: record.combustible ?? 0,
    costo_adicional_servicio: record.costo_adicional_servicio ?? 0,
    observacion: record.observacion ?? "",
  });
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [catalog, setCatalog] = useState<ProcedureCatalogItem[]>([]);
  const [districts, setDistricts] = useState<Array<{ name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payment = recordToPaymentPayload(form.paymentMethod, form.paymentAmount);
      await procedureService.updateRecord({
        id: record.id,
        fecha: form.fecha,
        patient_id: form.patient_id || null,
        patient_name: form.patient_name || null,
        quantity: form.quantity,
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
      toast.success("Procedimiento actualizado");
      onClose();
      onUpdated();
    } catch (err) {
      toast.error("Error al actualizar");
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
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar procedimiento</DialogTitle>
          <DialogDescription>
            Modifique los datos del procedimiento.
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
                    value={form.patient_id}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        patient_id: v,
                        patient_name: v ? patients.find((p) => p.id === v)?.name ?? f.patient_name : f.patient_name,
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
                  <label className="block text-sm font-medium mb-1">Cantidad</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Procedimiento (catálogo)</label>
                  <select
                    value={form.procedure_catalog_id}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        procedure_catalog_id: v,
                        procedure_name: v ? catalog.find((c) => c.id === v)?.name ?? f.procedure_name : f.procedure_name,
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
                <div>
                  <label className="block text-sm font-medium mb-1">Procedimiento (texto)</label>
                  <Input
                    value={form.procedure_name}
                    onChange={(e) => setForm((f) => ({ ...f, procedure_name: e.target.value }))}
                  />
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
                  <label className="block text-sm font-medium mb-1">Número de operación</label>
                  <Input
                    value={form.numero_operacion}
                    onChange={(e) => setForm((f) => ({ ...f, numero_operacion: e.target.value }))}
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
                  <label className="block text-sm font-medium mb-1">Costo adicional</label>
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
