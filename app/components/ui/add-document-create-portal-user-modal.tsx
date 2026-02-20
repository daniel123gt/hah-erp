import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import patientsService from "~/services/patientsService";
import {
  ensurePatientPortalUser,
  generatePortalPassword,
} from "~/services/patientPortalService";

interface AddDocumentCreatePortalUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: { id: string; name: string; email?: string; phone?: string; dni?: string } | null;
  onSuccess: (dni: string, password: string) => void;
}

/** Modal para agregar Nro. de documento y/o generar usuario y contraseña del portal.
 * Útil cuando el paciente no tiene DNI (órdenes antiguas) o cuando no se pudo crear la cuenta por error. */
export function AddDocumentCreatePortalUserModal({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: AddDocumentCreatePortalUserModalProps) {
  const [dni, setDni] = useState(patient?.dni?.trim() ?? "");
  const [loading, setLoading] = useState(false);

  const hasDni = !!patient?.dni?.trim();
  const isAddingDocument = !hasDni;

  useEffect(() => {
    if (open && patient) setDni(patient.dni?.trim() ?? "");
  }, [open, patient?.id, patient?.dni]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDni(patient?.dni?.trim() ?? "");
      setLoading(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dniTrim = dni.trim();
    if (!dniTrim) {
      toast.error("Ingrese el Nro. de documento para generar las credenciales.");
      return;
    }
    if (!patient) return;
    setLoading(true);
    try {
      if (!patient.dni?.trim() || patient.dni.trim() !== dniTrim) {
        const taken = await patientsService.isDniTaken(dniTrim, patient.id);
        if (taken) {
          toast.error("Este número de documento ya está registrado para otro paciente.");
          setLoading(false);
          return;
        }
        await patientsService.updatePatient({ id: patient.id, dni: dniTrim });
      }
      const password = generatePortalPassword();
      const result = await ensurePatientPortalUser({
        patient_id: patient.id,
        dni: dniTrim,
        full_name: patient.name || "",
        email: patient.email?.trim(),
        phone: patient.phone?.trim(),
        password,
      });
      if (result.ok) {
        onSuccess(dniTrim, password);
        handleOpenChange(false);
        toast.success(
          result.already_exists
            ? "El paciente ya tenía cuenta. Se generó una nueva contraseña."
            : "Usuario de portal creado. Entregue las credenciales al paciente."
        );
      } else {
        toast.error(result.error || "No se pudo crear la cuenta del portal.");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al crear usuario de portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-blue" />
            {isAddingDocument
              ? "Agregar documento y crear usuario de portal"
              : "Crear usuario y contraseña de portal"}
          </DialogTitle>
        </DialogHeader>
        {patient && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              {isAddingDocument
                ? "Este paciente no tiene Nro. de documento registrado. Ingrese el documento para poder generar usuario y contraseña del portal de resultados."
                : "El paciente tiene documento pero aún no tiene cuenta en el portal (o hubo un error). Puede editar el DNI si es necesario y generar las credenciales."}
            </p>
            <div>
              <Label htmlFor="portal-dni">Nro. de documento</Label>
              <Input
                id="portal-dni"
                value={dni}
                onChange={(e) =>
                  setDni(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20))
                }
                placeholder="Ej: 12345678"
                maxLength={20}
                className="mt-1 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !dni.trim()}
                className="bg-primary-blue hover:bg-primary-blue/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                {isAddingDocument
                  ? "Agregar documento y generar credenciales"
                  : "Generar usuario y contraseña"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
