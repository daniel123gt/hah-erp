import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { FileText, Loader2, ClipboardList, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import labQuoteService from "~/services/labQuoteService";

interface LaboratoryExam {
  id: string;
  codigo: string;
  nombre: string;
  precio: string;
}

interface SaveQuoteModalProps {
  selectedExams: LaboratoryExam[];
  total: number;
  onSaved: () => void;
}

export function SaveQuoteModal({ selectedExams, total, onSaved }: SaveQuoteModalProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [observations, setObservations] = useState("");
  const [savedNumber, setSavedNumber] = useState<string | null>(null);

  const handleSave = async () => {
    if (selectedExams.length === 0) {
      toast.error("Debes seleccionar al menos un examen");
      return;
    }
    try {
      setIsLoading(true);
      const quote = await labQuoteService.createQuote({
        exam_ids: selectedExams.map((e) => e.id),
        observations: observations.trim() || undefined,
      });
      setSavedNumber(quote.quote_number);
      toast.success(`Cotización ${quote.quote_number} guardada`);
    } catch (error: any) {
      console.error("Error al guardar cotización:", error);
      toast.error(error?.message || "No se pudo guardar la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (savedNumber) onSaved();
      setSavedNumber(null);
      setObservations("");
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ClipboardList className="w-4 h-4 mr-2" />
          Guardar cotización
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {savedNumber ? "Cotización guardada" : "Guardar cotización"}
          </DialogTitle>
        </DialogHeader>

        {savedNumber ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-sm text-gray-600">Número de cotización</p>
              <p className="text-2xl font-bold font-mono text-green-700 mt-1 select-all">
                {savedNumber}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Guarda este número para recuperarla cuando el cliente confirme.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  handleClose(false);
                  navigate("/laboratorio/cotizaciones");
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a Cotizaciones
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => handleClose(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-800">Exámenes</p>
                <p className="font-semibold text-blue-900">{selectedExams.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-800">Total</p>
                <p className="font-bold text-blue-900">S/ {total.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quoteObservations">Nota / referencia (opcional)</Label>
              <textarea
                id="quoteObservations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ej: llamó Juan, confirma en la tarde..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                No se piden datos del paciente. La cotización se identifica por su número.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Guardar cotización
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
