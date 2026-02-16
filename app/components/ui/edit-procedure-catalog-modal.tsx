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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { procedureService, type ProcedureCatalogItem, type ProcedureCatalogMaterial } from "~/services/procedureService";
import { toast } from "sonner";
import { DollarSign, Plus, Trash2, ChevronDown } from "lucide-react";

export interface ProcedureCatalogFormMaterial {
  material_name: string;
  quantity: number;
  cost_soles: number;
}

interface EditProcedureCatalogModalProps {
  procedure: ProcedureCatalogItem;
  materials: ProcedureCatalogMaterial[];
  onClose: () => void;
  onUpdated: () => void;
}

export function EditProcedureCatalogModal({
  procedure,
  materials,
  onClose,
  onUpdated,
}: EditProcedureCatalogModalProps) {
  const [basePrice, setBasePrice] = useState(Number(procedure.base_price_soles) ?? 0);
  const [honorarios, setHonorarios] = useState(Number(procedure.honorarios_soles) ?? 0);
  const [movilidad, setMovilidad] = useState(Number(procedure.movilidad_soles) ?? 0);
  const [mats, setMats] = useState<ProcedureCatalogFormMaterial[]>(
    materials.length > 0
      ? materials.map((m) => ({
          material_name: m.material_name,
          quantity: Number(m.quantity) || 1,
          cost_soles: Number(m.cost_soles) ?? 0,
        }))
      : [{ material_name: "", quantity: 1, cost_soles: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [materialsMaster, setMaterialsMaster] = useState<Array<{ id: string; name: string; cost_soles: number }>>([]);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  useEffect(() => {
    procedureService.getMaterialsMaster().then(setMaterialsMaster);
  }, []);

  const materialsCost = mats.reduce(
    (s, m) => s + (Number(m.quantity) || 0) * (Number(m.cost_soles) ?? 0),
    0
  );
  const totalCost = honorarios + movilidad + materialsCost;
  const utility = basePrice - totalCost;

  const addRow = () => {
    setMats((prev) => [...prev, { material_name: "", quantity: 1, cost_soles: 0 }]);
  };

  const removeRow = (index: number) => {
    setMats((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ProcedureCatalogFormMaterial, value: string | number) => {
    setMats((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: field === "material_name" ? value : Number(value) || 0 } : row
      )
    );
  };

  const selectMaterialFromList = (index: number, name: string, cost_soles: number) => {
    setMats((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, material_name: name, cost_soles } : row
      )
    );
    setOpenPopoverIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMats = mats.filter((m) => m.material_name.trim());
    if (validMats.some((m) => (m.quantity || 0) <= 0)) {
      toast.error("Las cantidades deben ser mayor a 0");
      return;
    }
    setSaving(true);
    try {
      await procedureService.updateProcedureCatalog(procedure.id, {
        base_price_soles: basePrice,
        honorarios_soles: honorarios,
        movilidad_soles: movilidad,
        materials: validMats.map((m) => ({
          material_name: m.material_name.trim(),
          quantity: Number(m.quantity) || 1,
          cost_soles: Number(m.cost_soles) ?? 0,
        })),
      });
      toast.success("Procedimiento actualizado");
      onClose();
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar procedimiento</DialogTitle>
          <DialogDescription>
            {procedure.name}. El costo total y la utilidad se calculan automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Precio y costos fijos (S/.)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio del servicio</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={basePrice || ""}
                  onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Honorarios de enfermería</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={honorarios || ""}
                  onChange={(e) => setHonorarios(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Promedio movilidad</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={movilidad || ""}
                  onChange={(e) => setMovilidad(Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Insumos (cantidad, nombre, costo unitario)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">
                Elija un insumo de la lista o escriba uno nuevo (se creará en el catálogo de materiales).
              </p>
              <div className="space-y-2">
                {mats.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center flex-wrap">
                    <Input
                      type="number"
                      min={1}
                      className="w-16"
                      placeholder="Cant."
                      value={row.quantity || ""}
                      onChange={(e) => updateRow(index, "quantity", e.target.value)}
                    />
                    <Input
                      className="flex-1 min-w-[120px]"
                      placeholder="Nombre del insumo"
                      value={row.material_name}
                      onChange={(e) => updateRow(index, "material_name", e.target.value)}
                    />
                    <Popover open={openPopoverIndex === index} onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="shrink-0">
                          Lista <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar insumo..." />
                          <CommandList>
                            <CommandEmpty>Ninguno en lista. Escriba el nombre arriba para crear uno nuevo.</CommandEmpty>
                            <CommandGroup>
                              {materialsMaster.map((mat) => (
                                <CommandItem
                                  key={mat.id}
                                  value={mat.name}
                                  onSelect={() => selectMaterialFromList(index, mat.name, mat.cost_soles)}
                                >
                                  <span className="flex-1 truncate">{mat.name}</span>
                                  <span className="text-gray-500 tabular-nums">S/ {Number(mat.cost_soles).toFixed(2)}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-24"
                      placeholder="Costo"
                      value={row.cost_soles || ""}
                      onChange={(e) => updateRow(index, "cost_soles", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      className="text-red-600 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="text-gray-600">Costo total: </span>
              <span className="font-semibold">{totalCost.toFixed(2)}</span>
              <span className="text-gray-600 ml-4">Utilidad: </span>
              <span className={`font-semibold ${utility >= 0 ? "text-green-600" : "text-red-600"}`}>
                {utility.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
