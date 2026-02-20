import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { medicalAppointmentRecordsService, type MedicalAppointmentRecord } from "~/services/medicalAppointmentRecordsService";
import { toast } from "sonner";

interface EditMedicalRecordModalProps {
  record: MedicalAppointmentRecord;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMedicalRecordModal({ record, onClose, onUpdated }: EditMedicalRecordModalProps) {
  const [ingreso, setIngreso] = useState(String(record.ingreso ?? 0));
  const [costo, setCosto] = useState(String(record.costo ?? 0));
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar registro - Cita médica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            {record.patient_name ?? "—"} · {record.appointment_type} · {record.fecha}
          </p>
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
            <Label>Notas</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Notas opcionales"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
