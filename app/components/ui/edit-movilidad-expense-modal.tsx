import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  expensesService,
  MOVILIDAD_TYPES,
  EXPENSE_PAYMENT_METHODS,
  type Expense,
} from "~/services/expensesService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditMovilidadExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMovilidadExpenseModal({ expense, onClose, onUpdated }: EditMovilidadExpenseModalProps) {
  const [form, setForm] = useState({
    fecha: String(expense.fecha).slice(0, 10),
    type: expense.type,
    description: expense.description ?? "",
    amount: Number(expense.amount ?? 0),
    payment_method: expense.payment_method ?? "efectivo",
    numero_operacion: expense.numero_operacion ?? "",
    notes: expense.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      toast.error("Ingrese un monto válido.");
      return;
    }
    setLoading(true);
    try {
      await expensesService.update({
        id: expense.id,
        fecha: form.fecha,
        type: form.type,
        description: form.description || null,
        amount: Number(form.amount),
        payment_method: form.payment_method || null,
        numero_operacion: form.numero_operacion || null,
        notes: form.notes || null,
      });
      toast.success("Egreso actualizado");
      onClose();
      onUpdated();
    } catch (err) {
      toast.error("Error al actualizar el egreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar egreso de movilidad</DialogTitle>
          <DialogDescription>Modifique los datos del egreso.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
              >
                {MOVILIDAD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto (S/.) *</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.amount || ""}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Método de pago</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
              >
                {EXPENSE_PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">N° de operación / comprobante</label>
              <Input
                value={form.numero_operacion}
                onChange={(e) => setForm((f) => ({ ...f, numero_operacion: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 min-h-[70px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
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
