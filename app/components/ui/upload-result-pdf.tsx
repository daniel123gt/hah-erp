import { useState, useEffect } from "react";
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
import { Upload, FileText, Loader2, X, Download } from "lucide-react";
import { toast } from "sonner";
import storageService from "~/services/storageService";
import labOrderService from "~/services/labOrderService";

interface UploadResultPdfProps {
  orderId: string;
  orderNumber: string;
  currentPdfUrl?: string;
  currentResultDate?: string;
  currentResultNotes?: string;
  onResultUpdated: () => void;
}

export function UploadResultPdf({
  orderId,
  orderNumber,
  currentPdfUrl,
  currentResultDate,
  currentResultNotes,
  onResultUpdated
}: UploadResultPdfProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultDate, setResultDate] = useState(currentResultDate || new Date().toISOString().split('T')[0]);
  const [resultNotes, setResultNotes] = useState(currentResultNotes || "");
  const [deleting, setDeleting] = useState(false);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);

  // Obtener URL firmada cuando hay un PDF
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (currentPdfUrl) {
        try {
          // Extraer el path del URL público
          const urlParts = currentPdfUrl.split('/');
          const bucketAndPath = urlParts.slice(urlParts.indexOf('object') + 2).join('/');
          const bucket = bucketAndPath.split('/')[0];
          const filePath = bucketAndPath.split('/').slice(1).join('/');
          
          // Obtener URL firmada válida por 1 hora
          const signedUrl = await storageService.getDownloadUrl(bucket, filePath, 3600);
          setPdfSignedUrl(signedUrl);
        } catch (error) {
          console.error('Error al obtener URL firmada:', error);
          // Si falla, usar la URL pública como fallback
          setPdfSignedUrl(currentPdfUrl);
        }
      }
    };
    
    loadSignedUrl();
  }, [currentPdfUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("El archivo es demasiado grande. Máximo 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile && !currentPdfUrl) {
      toast.error("Debes seleccionar un archivo PDF");
      return;
    }

    try {
      setUploading(true);

      let pdfUrl = currentPdfUrl;

      // Si hay un nuevo archivo, subirlo
      if (selectedFile) {
        pdfUrl = await storageService.uploadFile({
          file: selectedFile,
          bucket: 'lab-results', // Nombre del bucket en Supabase Storage
          folder: `ordenes/${orderId}`,
          compressPdf: false // Por ahora sin compresión adicional
        });
      }

      // Actualizar la orden con el resultado
      await labOrderService.updateOrderResult(orderId, {
        result_pdf_url: pdfUrl,
        result_date: resultDate,
        result_notes: resultNotes || undefined,
        status: 'Completado'
      });

      toast.success("Resultado subido exitosamente");
      setOpen(false);
      setSelectedFile(null);
      onResultUpdated();
    } catch (error: any) {
      console.error("Error al subir resultado:", error);
      toast.error(error?.message || "Error al subir el resultado");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPdfUrl) return;

    if (!confirm("¿Estás seguro de que quieres eliminar este resultado?")) {
      return;
    }

    try {
      setDeleting(true);
      await labOrderService.deleteOrderResult(orderId);
      toast.success("Resultado eliminado exitosamente");
      setOpen(false);
      setResultDate(new Date().toISOString().split('T')[0]);
      setResultNotes("");
      onResultUpdated();
    } catch (error: any) {
      console.error("Error al eliminar resultado:", error);
      toast.error(error?.message || "Error al eliminar el resultado");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentPdfUrl ? (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Ver/Actualizar PDF
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Subir Resultado
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir Resultado PDF - Orden #{orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Archivo actual */}
          {currentPdfUrl && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Resultado ya subido</p>
                    <p className="text-sm text-green-700">
                      Fecha: {currentResultDate ? new Date(currentResultDate).toLocaleDateString('es-ES') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (pdfSignedUrl) {
                        window.open(pdfSignedUrl, '_blank');
                      } else {
                        toast.error("No se pudo generar el enlace de descarga");
                      }
                    }}
                    disabled={!pdfSignedUrl}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver PDF
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Selector de archivo */}
          <div>
            <Label htmlFor="pdf-file">Seleccionar PDF {currentPdfUrl ? '(reemplazar)' : ''}</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tamaño máximo: 10MB. Se recomienda comprimir el PDF antes de subirlo.
            </p>
            {selectedFile && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <p className="font-medium">Archivo seleccionado: {selectedFile.name}</p>
                <p className="text-gray-600">Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          {/* Fecha de resultado */}
          <div>
            <Label htmlFor="result-date">Fecha del Resultado</Label>
            <Input
              id="result-date"
              type="date"
              value={resultDate}
              onChange={(e) => setResultDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Notas */}
          <div>
들과 <Label htmlFor="result-notes">Notas del Resultado (Opcional)</Label>
            <Textarea
              id="result-notes"
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="Agregar notas adicionales sobre el resultado..."
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading || deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || deleting || (!selectedFile && !currentPdfUrl)}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {currentPdfUrl ? 'Actualizar Resultado' : 'Subir Resultado'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

