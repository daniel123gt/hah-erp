import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Edit, X } from "lucide-react";
import { laboratoryService, LaboratoryExam, UpdateExamData } from "~/services/laboratoryService";
import { toast } from "sonner";

interface EditExamModalProps {
  exam: LaboratoryExam;
  onExamUpdated: () => void;
}

export function EditExamModal({ exam, onExamUpdated }: EditExamModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateExamData>({
    id: exam.id,
    codigo: exam.codigo,
    nombre: exam.nombre,
    precio: exam.precio,
    categoria: exam.categoria || "",
    descripcion: exam.descripcion || "",
    tiempo_resultado: exam.tiempo_resultado || "",
    preparacion: exam.preparacion || ""
  });

  const categories = [
    "Hematología",
    "Bioquímica",
    "Microbiología",
    "Inmunología",
    "Endocrinología",
    "Toxicología",
    "Genética",
    "Parasitología",
    "Urología",
    "Otros"
  ];

  const handleInputChange = (field: keyof UpdateExamData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar datos requeridos
      if (!formData.codigo || !formData.nombre || !formData.precio) {
        toast.error("Por favor completa todos los campos requeridos");
        setIsLoading(false);
        return;
      }

      // Validar formato de precio
      const precioRegex = /^S\/\s?\d+(\.\d{2})?$/;
      if (!precioRegex.test(formData.precio)) {
        toast.error("El precio debe tener el formato: S/ 0.00");
        setIsLoading(false);
        return;
      }

      await laboratoryService.updateExam(formData);
      
      toast.success("Examen actualizado exitosamente");
      
      setOpen(false);
      onExamUpdated();
    } catch (error) {
      console.error("Error al actualizar examen:", error);
      toast.error("Error al actualizar el examen. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Examen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">Código *</Label>
              <Input
                id="edit-codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value)}
                placeholder="Ej: 2592"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-precio">Precio *</Label>
              <Input
                id="edit-precio"
                value={formData.precio}
                onChange={(e) => handleInputChange("precio", e.target.value)}
                placeholder="Ej: S/ 150.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre del Examen *</Label>
            <Input
              id="edit-nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: 11 DESOXI CORTICOSTERONA SUERO"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-categoria">Categoría</Label>
            <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Textarea
              id="edit-descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción del examen..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tiempo_resultado">Tiempo de Resultado</Label>
              <Input
                id="edit-tiempo_resultado"
                value={formData.tiempo_resultado}
                onChange={(e) => handleInputChange("tiempo_resultado", e.target.value)}
                placeholder="Ej: 24 horas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-preparacion">Preparación</Label>
              <Input
                id="edit-preparacion"
                value={formData.preparacion}
                onChange={(e) => handleInputChange("preparacion", e.target.value)}
                placeholder="Ej: Ayuno de 8 horas"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Actualizando..." : "Actualizar Examen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
