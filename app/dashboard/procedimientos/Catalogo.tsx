import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { procedureService, type ProcedureCatalogItem, type ProcedureCatalogMaterial } from "~/services/procedureService";
import { EditProcedureCatalogModal } from "~/components/ui/edit-procedure-catalog-modal";
import { AddProcedureCatalogModal } from "~/components/ui/add-procedure-catalog-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

export default function CatalogoProcedimientos() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<ProcedureCatalogItem[]>([]);
  const [materialsByProc, setMaterialsByProc] = useState<Record<string, ProcedureCatalogMaterial[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<{ procedure: ProcedureCatalogItem; materials: ProcedureCatalogMaterial[] } | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ProcedureCatalogItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const filteredCatalog = useMemo(() => {
    const active = catalog.filter((item) => item.is_active !== false);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return active;
    return active.filter((item) => item.name.toLowerCase().includes(term));
  }, [catalog, searchTerm]);

  const refreshCatalog = async () => {
    try {
      const list = await procedureService.getCatalog(false);
      setCatalog(list);
      const map: Record<string, ProcedureCatalogMaterial[]> = {};
      for (const p of list) {
        const mats = await procedureService.getMaterials(p.id);
        map[p.id] = mats;
      }
      setMaterialsByProc(map);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refreshCatalog();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Procedimientos</h1>
          <p className="text-gray-600 mt-1">Procedimientos con costo y materiales</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo procedimiento
          </Button>
          <Button variant="outline" onClick={() => navigate("/procedimientos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
          <span className="ml-2">Cargando catálogo...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCatalog.map((item) => {
            const materials = materialsByProc[item.id] ?? [];
            const price = Number(item.base_price_soles);
            const totalCost = Number(item.total_cost_soles);
            const utility = Number(item.utility_soles);
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col"
              >
                {/* Título, precio y botones siempre visibles */}
                <div className="flex justify-between items-center gap-2 p-3 border-b border-gray-200 bg-gray-50/80">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 min-w-0">
                    {item.name}
                  </h3>
                  <span className="text-base font-semibold text-primary-blue whitespace-nowrap">
                    {price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-300 bg-white hover:bg-gray-100"
                      onClick={() => setEditing({ procedure: item, materials })}
                      title="Editar procedimiento"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-300 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      onClick={() => setDeleting(item)}
                      title="Eliminar procedimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Honorarios + lista de materiales: columna Cant. y columna Nombre */}
                <div className="flex-1 p-3 border-b border-gray-100">
                  <ul className="space-y-1.5 text-sm">
                    {(Number(item.honorarios_soles) ?? 0) > 0 && (
                      <li className="flex justify-between gap-2 text-gray-700 border-b border-gray-100/80 pb-1">
                        <div className="flex gap-2 flex-1 min-w-0">
                          <span className="w-8 shrink-0 text-center text-gray-500">—</span>
                          <span className="flex-1 min-w-0">HONORARIOS DE ENFERMERÍA</span>
                        </div>
                        <span className="text-gray-600 tabular-nums whitespace-nowrap">
                          {Number(item.honorarios_soles).toFixed(2)}
                        </span>
                      </li>
                    )}
                    {(Number(item.movilidad_soles) ?? 0) > 0 && (
                      <li className="flex justify-between gap-2 text-gray-700 border-b border-gray-100/80 pb-1">
                        <div className="flex gap-2 flex-1 min-w-0">
                          <span className="w-8 shrink-0 text-center text-gray-500">—</span>
                          <span className="flex-1 min-w-0">PROMEDIO MOVILIDAD</span>
                        </div>
                        <span className="text-gray-600 tabular-nums whitespace-nowrap">
                          {Number(item.movilidad_soles).toFixed(2)}
                        </span>
                      </li>
                    )}
                    {materials.length > 0 ? (
                      materials.map((m) => {
                        const qty = Number(m.quantity) ?? 1;
                        const unitCost = Number(m.cost_soles) ?? 0;
                        const lineTotal = qty * unitCost;
                        return (
                          <li
                            key={m.id}
                            className="flex justify-between gap-2 text-gray-700 border-b border-gray-100/80 last:border-0 pb-1 last:pb-0 items-center"
                          >
                            <div className="flex gap-2 flex-1 min-w-0">
                              <span className="w-8 shrink-0 text-center tabular-nums font-medium">
                                {qty}
                              </span>
                              <span className="flex-1 min-w-0">{m.material_name}</span>
                            </div>
                            <span className="text-gray-600 tabular-nums whitespace-nowrap">
                              {lineTotal.toFixed(2)}
                            </span>
                          </li>
                        );
                      })
                    ) : (Number(item.honorarios_soles) ?? 0) === 0 ? (
                      <li className="text-gray-500 italic">Sin materiales cargados</li>
                    ) : null}
                  </ul>
                </div>
                {/* COSTO TOTAL y UTILIDAD */}
                <div className="p-3 bg-gray-50 border-t-2 border-gray-200 space-y-1">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">COSTO TOTAL</span>
                    <span className="tabular-nums">{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">UTILIDAD</span>
                    <span className="tabular-nums text-green-600">{utility.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditProcedureCatalogModal
          procedure={editing.procedure}
          materials={editing.materials}
          onClose={() => setEditing(null)}
          onUpdated={() => {
            setEditing(null);
            refreshCatalog();
          }}
        />
      )}

      {adding && (
        <AddProcedureCatalogModal
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            refreshCatalog();
          }}
        />
      )}

      {deleting && (
        <Dialog open onOpenChange={(open) => !open && !deletingLoading && setDeleting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar procedimiento</DialogTitle>
              <DialogDescription>
                ¿Está seguro de eliminar <strong>{deleting.name}</strong>? El procedimiento dejará de mostrarse en el catálogo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => !deletingLoading && setDeleting(null)}
                disabled={deletingLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deletingLoading}
                onClick={async () => {
                  setDeletingLoading(true);
                  try {
                    await procedureService.deleteProcedureCatalog(deleting.id);
                    toast.success("Procedimiento eliminado");
                    setDeleting(null);
                    refreshCatalog();
                  } catch (e) {
                    console.error(e);
                    toast.error("Error al eliminar");
                  } finally {
                    setDeletingLoading(false);
                  }
                }}
              >
                {deletingLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
