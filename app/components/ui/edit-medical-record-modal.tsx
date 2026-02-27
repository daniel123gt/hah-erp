import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { medicalAppointmentRecordsService, type MedicalAppointmentRecord } from "~/services/medicalAppointmentRecordsService";
import { toast } from "sonner";
import { Loader2, User, DollarSign, FileText } from "lucide-react";

interface EditMedicalRecordModalProps {
  record: MedicalAppointmentRecord;
  onClose: () => void;
  onUpdated: () => void;
}

const PAYMENT_METHODS = [
  { value: "", label: "Sin especificar" },
  { value: "Efectivo", label: "Efectivo" },
  { value: "Yape", label: "Yape" },
  { value: "Plin", label: "Plin" },
  { value: "Transferencia/Depósito", label: "Transferencia / Depósito" },
  { value: "Tarjeta/Link/POS", label: "Tarjeta / Link / POS" },
];

export function EditMedicalRecordModal({ record, onClose, onUpdated }: EditMedicalRecordModalProps) {
  const [ingreso, setIngreso] = useState(String(record.ingreso ?? 0));
  const [costo, setCosto] = useState(String(record.costo ?? 0));
  const [payment_method, setPayment_method] = useState(record.payment_method ?? "");
  const [numero_operacion, setNumero_operacion] = useState(record.numero_operacion ?? "");
  const [notes, setNotes] = useState(record.notes ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await medicalAppointmentRecordsService.update({
        id: record.id,
        ingreso: Number(ingreso) || 0,
        costo: Number(costo) || 0,
        payment_method: payment_method?.trim() || null,
        numero_operacion: numero_operacion?.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Registro actualizado");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error((err as Error)?.message ?? "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar registro - Cita médica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Paciente y cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {record.patient_name ?? "—"} · {record.appointment_type} · {record.fecha}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Ingreso y pago (S/.)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ingreso (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingreso}
                  onChange={(e) => setIngreso(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Costo (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Método de pago</Label>
                <select
                  value={payment_method}
                  onChange={(e) => setPayment_method(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PAYMENT_METHODS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Número de operación / Referencia</Label>
                <Input
                  value={numero_operacion}
                  onChange={(e) => setNumero_operacion(e.target.value)}
                  placeholder="Ej. ref. transferencia, código Yape/Plin..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Notas opcionales"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
