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
import { Plus, X } from "lucide-react";
import { laboratoryService, LaboratoryExam, CreateExamData } from "~/services/laboratoryService";
import { toast } from "sonner";

interface AddExamModalProps {
  onExamAdded: () => void;
}

export function AddExamModal({ onExamAdded }: AddExamModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateExamData>({
    codigo: "",
    nombre: "",
    precio: "",
    categoria: "",
    descripcion: "",
    tiempo_resultado: "",
    preparacion: ""
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

  const handleInputChange = (field: keyof CreateExamData, value: string) => {
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

      await laboratoryService.createExam(formData);
      
      toast.success("Examen creado exitosamente");
      
      // Reset form
      setFormData({
        codigo: "",
        nombre: "",
        precio: "",
        categoria: "",
        descripcion: "",
        tiempo_resultado: "",
        preparacion: ""
      });
      
      setOpen(false);
      onExamAdded();
    } catch (error) {
      console.error("Error al crear examen:", error);
      toast.error("Error al crear el examen. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Examen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Examen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value)}
                placeholder="Ej: 2592"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio *</Label>
              <Input
                id="precio"
                value={formData.precio}
                onChange={(e) => handleInputChange("precio", e.target.value)}
                placeholder="Ej: S/ 150.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Examen *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: 11 DESOXI CORTICOSTERONA SUERO"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
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
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción del examen..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempo_resultado">Tiempo de Resultado</Label>
              <Input
                id="tiempo_resultado"
                value={formData.tiempo_resultado}
                onChange={(e) => handleInputChange("tiempo_resultado", e.target.value)}
                placeholder="Ej: 24 horas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preparacion">Preparación</Label>
              <Input
                id="preparacion"
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
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Creando..." : "Crear Examen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
