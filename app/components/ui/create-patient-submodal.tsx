"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Combobox } from "~/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { UserPlus, Loader2, AlertTriangle } from "lucide-react";
import { patientsService, type Patient } from "~/services/patientsService";
import { toast } from "sonner";

export interface CreatePatientSubmodalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama con el paciente creado; el padre debe seleccionarlo y cerrar el submodal si quiere */
  onCreated: (patient: Patient) => void;
  /** Texto breve para la descripción (ej. "Se seleccionará automáticamente para la cita.") */
  description?: string;
}

const emptyForm = {
  name: "",
  dni: "",
  email: "",
  phone: "",
  gender: "",
  address: "",
  district: "",
};

export function CreatePatientSubmodal({
  open,
  onOpenChange,
  onCreated,
  description = "Se seleccionará automáticamente en el formulario.",
}: CreatePatientSubmodalProps) {
  const [form, setForm] = useState(emptyForm);
  const [districts, setDistricts] = useState<Array<{ name: string; zone?: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicatePatients, setDuplicatePatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      patientsService.getDistricts().then(setDistricts).catch(() => setDistricts([]));
    }
  }, [open]);

  const doCreatePatient = async () => {
    const patient = await patientsService.createPatient({
      name: form.name.trim().toUpperCase(),
      dni: form.dni.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      gender: (form.gender as "M" | "F") || undefined,
      address: form.address.trim() || undefined,
      district: form.district.trim() || undefined,
      status: "Activo",
    });
    onCreated(patient);
    setForm(emptyForm);
    setDuplicateWarningOpen(false);
    setDuplicatePatients([]);
    onOpenChange(false);
    toast.success("Paciente creado correctamente.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const sameName = await patientsService.findPatientsWithSameName(form.name.trim());
      if (sameName.length > 0) {
        setDuplicatePatients(sameName);
        setDuplicateWarningOpen(true);
        setSaving(false);
        return;
      }
      await doCreatePatient();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el paciente.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDuplicateAndCreate = async () => {
    setSaving(true);
    try {
      await doCreatePatient();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el paciente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-blue" />
            Crear nuevo paciente
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                placeholder="Nombre completo (mayúsculas)"
                required
              />
            </div>
            <div>
              <Label>Nro. documento</Label>
              <Input
                value={form.dni}
                onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
                placeholder="Ej. 12345678"
                maxLength={20}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label>Género</Label>
              <Select
                value={form.gender || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distrito</Label>
              <Combobox
                options={districts.map((d) => ({ value: d.name, label: d.zone ? `${d.name} (${d.zone})` : d.name }))}
                value={form.district || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, district: v === "__none__" ? "" : v }))}
                placeholder="Seleccionar distrito"
                emptyOption={{ value: "__none__", label: "Sin especificar" }}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Dirección"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {saving ? "Creando..." : "Crear paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <Dialog open={duplicateWarningOpen} onOpenChange={setDuplicateWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Ya hay paciente(s) con ese nombre
            </DialogTitle>
            <DialogDescription>
              Se encontraron pacientes registrados con el mismo nombre (o muy similar). Revisa la lista y confirma si deseas agregar al nuevo paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {duplicatePatients.map((p) => (
              <div key={p.id} className="text-sm font-medium">
                {p.name}
                {p.dni ? ` · DNI ${p.dni}` : ""}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro que deseas agregar el nuevo paciente?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDuplicateWarningOpen(false); setDuplicatePatients([]); }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary-blue hover:bg-primary-blue/90"
              onClick={handleConfirmDuplicateAndCreate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Sí, agregar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
