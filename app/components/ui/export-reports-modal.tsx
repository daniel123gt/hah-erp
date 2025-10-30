import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Database,
  Calendar,
  Filter,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  Clock
} from "lucide-react";

interface ReportData {
  period: string;
  patients: number;
  appointments: number;
  revenue: number;
  services: number;
}

interface ExportReportsModalProps {
  reportData: ReportData[];
  topServices: Array<{ name: string; count: number; revenue: number }>;
  patientDemographics: Array<{ ageGroup: string; count: number; percentage: number }>;
  totalRevenue: number;
  totalPatients: number;
  totalAppointments: number;
  totalServices: number;
}

const exportFormats = [
  {
    id: "excel",
    name: "Excel (.xlsx)",
    description: "Ideal para análisis detallado y gráficos",
    icon: FileSpreadsheet,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    id: "pdf",
    name: "PDF",
    description: "Perfecto para presentaciones y reportes formales",
    icon: FileText,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  {
    id: "csv",
    name: "CSV",
    description: "Para importar en otros sistemas y análisis",
    icon: File,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    id: "json",
    name: "JSON",
    description: "Para desarrolladores y integración con APIs",
    icon: Database,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  }
];

const reportSections = [
  {
    id: "summary",
    name: "Resumen Ejecutivo",
    description: "Métricas principales y KPIs",
    icon: BarChart3,
    included: true
  },
  {
    id: "revenue",
    name: "Análisis de Ingresos",
    description: "Tendencias y comparaciones de ingresos",
    icon: DollarSign,
    included: true
  },
  {
    id: "patients",
    name: "Datos de Pacientes",
    description: "Demografía y estadísticas de pacientes",
    icon: Users,
    included: true
  },
  {
    id: "services",
    name: "Servicios Populares",
    description: "Ranking de servicios más utilizados",
    icon: Activity,
    included: true
  },
  {
    id: "appointments",
    name: "Citas y Programación",
    description: "Estadísticas de citas y programación",
    icon: Calendar,
    included: false
  },
  {
    id: "performance",
    name: "Indicadores de Rendimiento",
    description: "Métricas de satisfacción y tiempos",
    icon: CheckCircle,
    included: false
  }
];

export function ExportReportsModal({ 
  reportData, 
  topServices, 
  patientDemographics, 
  totalRevenue, 
  totalPatients, 
  totalAppointments, 
  totalServices 
}: ExportReportsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("excel");
  const [selectedSections, setSelectedSections] = useState(
    reportSections.map(section => ({ ...section, included: section.included }))
  );
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.map(section =>
        section.id === sectionId ? { ...section, included: !section.included } : section
      )
    );
  };

  const generateExcelData = () => {
    const data: any = {};
    
    if (selectedSections.find(s => s.id === "summary")?.included) {
      data["Resumen Ejecutivo"] = [
        ["Métrica", "Valor", "Período"],
        ["Total Pacientes", totalPatients, "Acumulado"],
        ["Total Citas", totalAppointments, "Acumulado"],
        ["Ingresos Totales", `S/ ${totalRevenue.toFixed(2)}`, "Acumulado"],
        ["Total Servicios", totalServices, "Acumulado"]
      ];
    }

    if (selectedSections.find(s => s.id === "revenue")?.included) {
      data["Análisis de Ingresos"] = [
        ["Período", "Pacientes", "Citas", "Ingresos", "Servicios"],
        ...reportData.map(period => [
          period.period,
          period.patients,
          period.appointments,
          period.revenue,
          period.services
        ])
      ];
    }

    if (selectedSections.find(s => s.id === "patients")?.included) {
      data["Demografía de Pacientes"] = [
        ["Grupo de Edad", "Cantidad", "Porcentaje"],
        ...patientDemographics.map(demo => [
          demo.ageGroup,
          demo.count,
          `${demo.percentage}%`
        ])
      ];
    }

    if (selectedSections.find(s => s.id === "services")?.included) {
      data["Servicios Populares"] = [
        ["Servicio", "Cantidad Realizada", "Ingresos Generados"],
        ...topServices.map(service => [
          service.name,
          service.count,
          `S/ ${service.revenue.toFixed(2)}`
        ])
      ];
    }

    return data;
  };

  const generateCSVData = () => {
    const sections = selectedSections.filter(s => s.included);
    let csvContent = "";
    
    sections.forEach((section, index) => {
      if (index > 0) csvContent += "\n\n";
      csvContent += `# ${section.name}\n`;
      
      switch (section.id) {
        case "summary":
          csvContent += "Métrica,Valor,Período\n";
          csvContent += `Total Pacientes,${totalPatients},Acumulado\n`;
          csvContent += `Total Citas,${totalAppointments},Acumulado\n`;
          csvContent += `Ingresos Totales,S/ ${totalRevenue.toFixed(2)},Acumulado\n`;
          csvContent += `Total Servicios,${totalServices},Acumulado\n`;
          break;
        case "revenue":
          csvContent += "Período,Pacientes,Citas,Ingresos,Servicios\n";
          reportData.forEach(period => {
            csvContent += `${period.period},${period.patients},${period.appointments},${period.revenue},${period.services}\n`;
          });
          break;
        case "patients":
          csvContent += "Grupo de Edad,Cantidad,Porcentaje\n";
          patientDemographics.forEach(demo => {
            csvContent += `${demo.ageGroup},${demo.count},${demo.percentage}%\n`;
          });
          break;
        case "services":
          csvContent += "Servicio,Cantidad Realizada,Ingresos Generados\n";
          topServices.forEach(service => {
            csvContent += `${service.name},${service.count},S/ ${service.revenue.toFixed(2)}\n`;
          });
          break;
      }
    });
    
    return csvContent;
  };

  const generateJSONData = () => {
    const data: any = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: dateRange,
        format: selectedFormat
      }
    };

    if (selectedSections.find(s => s.id === "summary")?.included) {
      data.summary = {
        totalPatients,
        totalAppointments,
        totalRevenue,
        totalServices
      };
    }

    if (selectedSections.find(s => s.id === "revenue")?.included) {
      data.revenue = reportData;
    }

    if (selectedSections.find(s => s.id === "patients")?.included) {
      data.patientDemographics = patientDemographics;
    }

    if (selectedSections.find(s => s.id === "services")?.included) {
      data.topServices = topServices;
    }

    return data;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `reporte_medico_${timestamp}`;
      
      switch (selectedFormat) {
        case "excel":
          // Para Excel necesitaríamos una librería como xlsx
          // Por ahora generamos CSV con extensión .xlsx
          const csvData = generateCSVData();
          downloadFile(csvData, `${filename}.csv`, 'text/csv');
          break;
          
        case "pdf":
          // Para PDF necesitaríamos una librería como jsPDF
          // Por ahora generamos un HTML que se puede imprimir como PDF
          const htmlContent = generateHTMLReport();
          downloadFile(htmlContent, `${filename}.html`, 'text/html');
          break;
          
        case "csv":
          const csvContent = generateCSVData();
          downloadFile(csvContent, `${filename}.csv`, 'text/csv');
          break;
          
        case "json":
          const jsonData = generateJSONData();
          downloadFile(JSON.stringify(jsonData, null, 2), `${filename}.json`, 'application/json');
          break;
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateHTMLReport = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte Médico - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte Médico</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
    
    ${selectedSections.find(s => s.id === "summary")?.included ? `
    <div class="section">
        <h2>Resumen Ejecutivo</h2>
        <div class="metric"><strong>Total Pacientes:</strong> ${totalPatients}</div>
        <div class="metric"><strong>Total Citas:</strong> ${totalAppointments}</div>
        <div class="metric"><strong>Ingresos Totales:</strong> S/ ${totalRevenue.toFixed(2)}</div>
        <div class="metric"><strong>Total Servicios:</strong> ${totalServices}</div>
    </div>
    ` : ''}
    
    ${selectedSections.find(s => s.id === "revenue")?.included ? `
    <div class="section">
        <h2>Análisis de Ingresos</h2>
        <table>
            <tr><th>Período</th><th>Pacientes</th><th>Citas</th><th>Ingresos</th><th>Servicios</th></tr>
            ${reportData.map(period => `
                <tr>
                    <td>${period.period}</td>
                    <td>${period.patients}</td>
                    <td>${period.appointments}</td>
                    <td>S/ ${period.revenue.toFixed(2)}</td>
                    <td>${period.services}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}
    
    ${selectedSections.find(s => s.id === "services")?.included ? `
    <div class="section">
        <h2>Servicios Populares</h2>
        <table>
            <tr><th>Servicio</th><th>Cantidad Realizada</th><th>Ingresos Generados</th></tr>
            ${topServices.map(service => `
                <tr>
                    <td>${service.name}</td>
                    <td>${service.count}</td>
                    <td>S/ ${service.revenue.toFixed(2)}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}
    
    ${selectedSections.find(s => s.id === "patients")?.included ? `
    <div class="section">
        <h2>Demografía de Pacientes</h2>
        <table>
            <tr><th>Grupo de Edad</th><th>Cantidad</th><th>Porcentaje</th></tr>
            ${patientDemographics.map(demo => `
                <tr>
                    <td>${demo.ageGroup}</td>
                    <td>${demo.count}</td>
                    <td>${demo.percentage}%</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}
</body>
</html>`;
  };

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);
  const includedSections = selectedSections.filter(s => s.included);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Exportar Reportes
          </DialogTitle>
          <DialogDescription>
            Seleccione el formato y las secciones para exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato de Exportación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary-blue" />
                Formato de Exportación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-primary-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-6 h-6 ${format.color}`} />
                        <div>
                          <h3 className="font-medium">{format.name}</h3>
                          <p className="text-sm text-gray-600">{format.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rango de Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Rango de Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secciones a Incluir */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5 text-primary-blue" />
                Secciones a Incluir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedSections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <div
                      key={section.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        section.included
                          ? 'border-primary-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          section.included
                            ? 'border-primary-blue bg-primary-blue'
                            : 'border-gray-300'
                        }`}>
                          {section.included && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <h3 className="font-medium">{section.name}</h3>
                          <p className="text-sm text-gray-600">{section.description}</p>
                        </div>
                        <Badge className={section.included ? 'bg-primary-blue' : 'bg-gray-200'}>
                          {section.included ? 'Incluido' : 'Excluido'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Exportación */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <Download className="w-5 h-5" />
                Resumen de Exportación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Formato seleccionado:</p>
                  <p className="font-medium">{selectedFormatInfo?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Secciones incluidas:</p>
                  <p className="font-medium">{includedSections.length} de {selectedSections.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rango de fechas:</p>
                  <p className="font-medium">
                    {new Date(dateRange.start).toLocaleDateString('es-ES')} - {new Date(dateRange.end).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tamaño estimado:</p>
                  <p className="font-medium">
                    {selectedFormat === 'json' ? '~15KB' : 
                     selectedFormat === 'csv' ? '~8KB' : 
                     selectedFormat === 'excel' ? '~12KB' : '~25KB'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || includedSections.length === 0}
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Reporte
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
