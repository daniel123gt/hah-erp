import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Phone, MessageCircle, PhoneIncoming, Plus, Loader2, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  leadsService,
  LEAD_TYPE_LABELS,
  LEAD_CATEGORY_LABELS,
  type LeadType,
  type LeadCategory,
  type TodayLeadCounts,
} from "~/services/leadsService";
import { cn } from "~/lib/utils";

const CATEGORY_OPTIONS: { value: LeadCategory; label: string; desc: string }[] = [
  { value: "potencial", label: "Cliente potencial", desc: "Realmente interesado en el servicio" },
  { value: "basura", label: "Basura", desc: "Consulta por algo que no ofrecemos" },
  { value: "no_apto", label: "Cliente no apto", desc: "Interesado, pero no concreta (precio, no conviene)" },
];

export function RegisterLeadCard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [type, setType] = useState<LeadType | null>(null);
  const [category, setCategory] = useState<LeadCategory | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [counts, setCounts] = useState<TodayLeadCounts>({ total: 0, potencial: 0, basura: 0, no_apto: 0 });

  const loadCounts = useCallback(() => {
    leadsService
      .getTodayCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const resetAndClose = () => {
    setOpen(false);
    setStep("select");
    setType(null);
    setCategory(null);
    setNotes("");
  };

  const handleConfirm = async () => {
    if (!type || !category) return;
    try {
      setSubmitting(true);
      await leadsService.createLead({ type, category, notes });
      toast.success("Registro guardado");
      resetAndClose();
      loadCounts();
    } catch (error: any) {
      console.error("Error al registrar:", error);
      toast.error(error?.message || "No se pudo guardar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-primary-blue flex items-center gap-2">
          <PhoneIncoming className="w-5 h-5" />
          Llamadas y mensajes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Registros hoy</span>
            <span className="text-2xl font-bold text-gray-900">{counts.total}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
              Potencial {counts.potencial}
            </span>
            <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5">
              Basura {counts.basura}
            </span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
              No apto {counts.no_apto}
            </span>
          </div>
        </div>

        <Button
          className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white"
          onClick={() => {
            setStep("select");
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar registro
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}>
        <DialogContent className="sm:max-w-md">
          {step === "select" ? (
            <>
              <DialogHeader>
                <DialogTitle>Registrar llamada / mensaje</DialogTitle>
                <DialogDescription>Selecciona el tipo y la categoría del contacto.</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Tipo */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Tipo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("llamada")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                        type === "llamada"
                          ? "border-primary-blue bg-primary-blue/10 text-primary-blue"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Phone className="w-4 h-4" />
                      Llamada
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("whatsapp")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                        type === "whatsapp"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Categoría</p>
                  <div className="space-y-2">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={cn(
                          "w-full text-left rounded-lg border p-3 transition-colors",
                          category === opt.value
                            ? "border-primary-blue bg-primary-blue/10"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                          {category === opt.value && <Check className="w-4 h-4 text-primary-blue" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nota opcional */}
                <div className="space-y-2">
                  <label htmlFor="leadNotes" className="text-sm font-medium text-gray-700">
                    Nota (opcional)
                  </label>
                  <textarea
                    id="leadNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalle breve..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetAndClose}>
                  Cancelar
                </Button>
                <Button disabled={!type || !category} onClick={() => setStep("confirm")}>
                  Continuar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar registro</DialogTitle>
                <DialogDescription>Revisa los datos antes de guardar.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo</span>
                    <span className="font-medium text-gray-900">{type ? LEAD_TYPE_LABELS[type] : ""}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Categoría</span>
                    <span className="font-medium text-gray-900">
                      {category ? LEAD_CATEGORY_LABELS[category] : ""}
                    </span>
                  </div>
                  {notes.trim() && (
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 shrink-0">Nota</span>
                      <span className="font-medium text-gray-900 text-right break-words">{notes.trim()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep("select")} disabled={submitting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button onClick={handleConfirm} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar y registrar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
