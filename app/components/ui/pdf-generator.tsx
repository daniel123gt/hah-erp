import { useState } from 'react';
import { Button } from "~/components/ui/button";
import { LaboratoryExam, ExamQuote } from "~/services/laboratoryService";
import { toast } from "sonner";
import { FileDown, Download } from "lucide-react";

interface PDFGeneratorProps {
  quote: ExamQuote;
  isLoading: boolean;
  onGeneratePDF: () => void;
}

export function PDFGenerator({ quote, isLoading, onGeneratePDF }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Simular generación de PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí implementaríamos la generación real de PDF
      // Por ahora simulamos con un toast
      toast.success('Proforma PDF generada exitosamente');
      
      onGeneratePDF();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar la proforma PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Botón para generar PDF */}
      <div className="flex justify-center">
        <Button
          onClick={generatePDF}
          disabled={isGenerating || isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl flex items-center gap-2"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <FileDown className="w-5 h-5" />
          )}
          {isGenerating ? 'Generando PDF...' : 'Generar Proforma PDF'}
        </Button>
      </div>

      {/* Vista previa de la proforma */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Proforma de Exámenes Solicitados
          </h2>
          <p className="text-gray-600">Fecha: {formatDate()}</p>
        </div>

        {/* Logos de laboratorios */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-blue-600 font-bold text-sm">H@H</span>
            </div>
            <p className="text-xs text-gray-600">Health at Home</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold text-sm">SYN</span>
            </div>
            <p className="text-xs text-gray-600">Synlab</p>
          </div>
        </div>

        {/* Tabla de exámenes */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left">Código</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Nombre del Examen</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {quote.examenes.map((exam) => {
                const precio = parseFloat(exam.precio.replace('S/', '').replace(',', '').trim()) || 0;
                const precioCliente = precio * 1.2 + quote.recargoUnitario;
                
                return (
                  <tr key={exam.codigo} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{exam.codigo}</td>
                    <td className="border border-gray-300 px-3 py-2">{exam.nombre}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      S/ {precioCliente.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="border border-gray-300 px-3 py-2">
                  Total a Pagar
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right text-lg">
                  S/ {quote.totalFinal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Incluye recargo por servicio a domicilio</p>
          <p>Los resultados estarán disponibles según el tiempo indicado para cada examen</p>
        </div>
      </div>

      {/* Información de la proforma interna */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-bold text-red-800 mb-2">
          📋 Proforma Interna (NO MOSTRAR AL CLIENTE)
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Precio Original:</strong> S/ {quote.precioOriginal.toFixed(2)}</p>
            <p><strong>Precio Cliente:</strong> S/ {quote.precioCliente.toFixed(2)}</p>
          </div>
          <div>
            <p><strong>Recargo Total:</strong> S/ {quote.recargoTotal.toFixed(2)}</p>
            <p><strong>Recargo Unitario:</strong> S/ {quote.recargoUnitario.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-red-200">
          <p className="font-bold text-red-800">
            <strong>Total Final:</strong> S/ {quote.totalFinal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
