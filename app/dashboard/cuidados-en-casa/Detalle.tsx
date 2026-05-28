import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Building2, Plus, Pencil, Trash2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import homeCareService, {
  type HomeCareContractWithPatient,
  type HomeCarePeriod,
  type HomeCarePeriodAdicional,
} from "~/services/homeCareService";
import {
  HomeCarePeriodModal,
  type PeriodFormData,
} from "~/components/ui/home-care-period-modal";
import {
  EditHomeCareContractModal,
  type ContractFormData,
} from "~/components/ui/edit-home-care-contract-modal";
import { formatDateOnly } from "~/lib/utils";

function getPatientName(contract: HomeCareContractWithPatient | null): string {
  if (!contract?.patient) return "Paciente";
  const p = contract.patient;
  return Array.isArray(p) ? (p[0]?.name ?? "Paciente") : (p?.name ?? "Paciente");
}

/** Formatea fecha YYYY-MM-DD en hora local (evita desfase de un día por UTC). */
function formatDate(s: string | null): string {
  if (!s) return "-";
  const formatted = formatDateOnly(s, "es-PE");
  return formatted || s;
}

function formatMoney(n: number): string {
  return `S/. ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAdicionalesCell(adicionales: HomeCarePeriodAdicional[] | undefined): string {
  if (!adicionales?.length) return "-";
  return adicionales.map((a) => `${a.descripcion} — ${formatMoney(a.monto)}`).join("\n");
}

export default function CuidadosEnCasaDetalle() {
  const { patientId } = useParams("/cuidados-en-casa/:patientId");
  const navigate = useNavigate();
  const [contract, setContract] = useState<HomeCareContractWithPatient | null>(null);
  const [periods, setPeriods] = useState<HomeCarePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodModalMode, setPeriodModalMode] = useState<"add" | "edit">("add");
  const [editingPeriod, setEditingPeriod] = useState<HomeCarePeriod | null>(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [plans, setPlans] = useState<Awaited<ReturnType<typeof homeCareService.getPlans>>>([]);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (patientId) loadData();
  }, [patientId]);

  useEffect(() => {
    homeCareService.getPlans().then(setPlans).catch(() => {});
  }, []);

  const loadData = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const contractData = await homeCareService.getContractByPatientId(patientId);
      setContract(contractData ?? null);
      if (contractData) {
        const periodsData = await homeCareService.getPeriodsByContractId(contractData.id);
        setPeriods(periodsData);
      } else {
        setPeriods([]);
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      toast.error("Error al cargar el detalle del servicio");
    } finally {
      setLoading(false);
    }
  };

  const planMontoFinal = contract ? (contract.plan_monto_mensual_final ?? contract.plan_monto_mensual) : 0;
  const montoQuincena = planMontoFinal / 2;
  /** Turno del plan del contrato (ej. "8H día Lu-Sá", "24X24"); se usa al crear/editar periodos. */
  const planTurno = contract?.plan_id ? (plans.find((p) => p.id === contract.plan_id)?.turno ?? null) : null;

  const handleSaveContract = async (data: ContractFormData) => {
    if (!contract) return;
    await homeCareService.updateContract(contract.id, {
      familiar_encargado: data.familiar_encargado || null,
      hora_inicio: data.hora_inicio || null,
      fecha_inicio: data.fecha_inicio,
      plan_id: data.plan_id || null,
      plan_nombre: data.plan_nombre || null,
      plan_monto_mensual: parseFloat(data.plan_monto_mensual) || 0,
      descuento: parseFloat(data.descuento) || 0,
      plan_monto_mensual_final: parseFloat(data.plan_monto_mensual_final) || 0,
      is_active: data.is_active,
    });
    toast.success("Contrato actualizado.");
  };

  const handleDeletePeriod = async (p: HomeCarePeriod) => {
    if (!window.confirm(`¿Eliminar el periodo ${p.item} (${formatDate(p.f_desde)} - ${formatDate(p.f_hasta)})?`)) return;
    try {
      setDeletingPeriodId(p.id);
      await homeCareService.deletePeriod(p.id);
      toast.success("Periodo eliminado.");
      loadData();
    } catch (error) {
      console.error("Error al eliminar periodo:", error);
      toast.error("No se pudo eliminar el periodo");
    } finally {
      setDeletingPeriodId(null);
    }
  };

  const handleSavePeriod = async (data: PeriodFormData) => {
    if (!contract) return;
    const turno =
      periodModalMode === "edit" && editingPeriod?.turno
        ? editingPeriod.turno
        : (planTurno ?? "24X24");
    const payload = {
      fecha_pago_quincena: data.fecha_pago_quincena || null,
      turno,
      f_desde: data.f_desde,
      f_hasta: data.f_hasta,
      monto: montoQuincena,
      f_feriados: data.f_feriados || null,
      m_feriados: parseFloat(data.m_feriados) || 0,
      p_del_serv: data.p_del_serv || null,
      f_pausas: data.f_pausas || null,
      adicionales: data.adicionales ?? [],
      monto_total: parseFloat(data.monto_total) || 0,
      fecha_pago: data.fecha_pago || null,
      metodo_pago: data.metodo_pago || null,
      numero_operacion: data.numero_operacion || null,
    };
    if (periodModalMode === "add") {
      await homeCareService.createPeriod(contract.id, payload);
      toast.success("Periodo agregado.");
    } else if (editingPeriod) {
      await homeCareService.updatePeriod(editingPeriod.id, payload);
      toast.success("Periodo actualizado.");
    }
  };

  const getPeriodoEstado = (period: HomeCarePeriod): "Completado" | "Pendiente" =>
    period.fecha_pago ? "Completado" : "Pendiente";

  const handleExportPdf = async () => {
    if (!contract) return;
    try {
      setExportingPdf(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const generadoEl = new Date().toLocaleString("es-PE");
      const estadoContrato = contract.is_active ? "Activo" : "Inactivo";
      const nombrePaciente = getPatientName(contract);

      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Reporte de Cuidados en Casa", 36, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Paciente: ${nombrePaciente}`, 36, 62);
      doc.text(`Generado: ${generadoEl}`, pageWidth - 220, 62);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Informacion general del contrato", 36, 112);

      autoTable(doc, {
        startY: 126,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 6,
          lineColor: [229, 231, 235],
          lineWidth: 0.6,
          textColor: [31, 41, 55],
        },
        headStyles: {
          fillColor: [239, 246, 255],
          textColor: [30, 64, 175],
          fontStyle: "bold",
        },
        head: [["Campo", "Detalle"]],
        body: [
          ["Paciente", nombrePaciente],
          ["Familiar encargado", contract.familiar_encargado ?? "-"],
          ["Hora de inicio", contract.hora_inicio ?? "-"],
          ["Fecha de inicio", formatDate(contract.fecha_inicio)],
          ["Plan mensual", contract.plan_nombre ?? "-"],
          ["Monto mensual", formatMoney(montoFinalVal)],
          ["Estado", estadoContrato],
          ["Total periodos", String(periods.length)],
        ],
      });

      const detalleInicio = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 170;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Detalle de periodos quincenales", 36, detalleInicio + 28);

      autoTable(doc, {
        startY: detalleInicio + 42,
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          cellPadding: 4,
          textColor: [31, 41, 55],
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        head: [[
          "ITEM",
          "Estado",
          "F. Pago C.",
          "Turno",
          "F. Desde",
          "F. Hasta",
          "Monto",
          "F. Feriados",
          "M. Feriados",
          "P. Serv",
          "F. Pausas",
          "Adicionales",
          "Monto Total",
          "Fecha de Pago",
          "Metodo Pago",
          "N Operacion",
        ]],
        body: periods.map((p) => [
          p.item ?? "-",
          getPeriodoEstado(p),
          formatDate(p.fecha_pago_quincena),
          p.turno ?? "-",
          formatDate(p.f_desde),
          formatDate(p.f_hasta),
          formatMoney(p.monto),
          p.f_feriados ?? "0",
          formatMoney(p.m_feriados),
          p.p_del_serv ?? "0",
          p.f_pausas ?? "0",
          formatAdicionalesCell(p.adicionales),
          formatMoney(p.monto_total),
          formatDate(p.fecha_pago),
          p.metodo_pago ?? "-",
          p.numero_operacion ?? "-",
        ]),
      });

      const safePatientName = nombrePaciente
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      doc.save(`reporte-cuidados-en-casa-${safePatientName || "paciente"}.pdf`);
      toast.success("PDF generado correctamente.");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate("/cuidados-en-casa")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="mt-4 text-gray-500">No se encontró contrato activo para este paciente.</p>
      </div>
    );
  }

  const montoOriginal = Number(contract.plan_monto_mensual) || 0;
  const montoFinalVal = contract.plan_monto_mensual_final != null
    ? Number(contract.plan_monto_mensual_final)
    : montoOriginal;
  const descuentoVal = Number(contract.descuento) || 0;
  const aplicaDescuento = descuentoVal > 0 && montoFinalVal < montoOriginal;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => navigate("/cuidados-en-casa")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Cuidados en casa – {getPatientName(contract)}
        </h1>
        <div className="ml-auto">
          <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cabecera tipo Excel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Datos del contrato</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setContractModalOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">PACIENTE</span>
              <span className="font-medium">{getPatientName(contract)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">FAMILIAR ENCARGADO</span>
              <span className="font-medium">{contract.familiar_encargado ?? "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">HORA INICIO</span>
              <span className="font-medium">{contract.hora_inicio ?? "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">FECHA INICIO</span>
              <span className="font-medium">{formatDate(contract.fecha_inicio)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">PLAN MENSUAL</span>
              <div className="font-medium space-y-0.5">
                {contract.plan_nombre && <span className="block">{contract.plan_nombre}</span>}
                {aplicaDescuento ? (
                  <span className="inline-flex items-baseline gap-2 flex-wrap">
                    <span className="line-through text-gray-500">
                      S/. {montoOriginal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                    <span>S/. {montoFinalVal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-500 text-xs font-normal">(descuento S/. {descuentoVal.toLocaleString("es-PE", { minimumFractionDigits: 2 })})</span>
                  </span>
                ) : (
                  <span>S/. {montoOriginal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500 block">ESTADO</span>
              <span className="font-medium">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    contract.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {contract.is_active ? "Activo" : "Inactivo"}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditHomeCareContractModal
        open={contractModalOpen}
        onOpenChange={setContractModalOpen}
        contract={contract}
        plans={plans}
        onSaved={loadData}
        onSave={handleSaveContract}
      />

      {/* Tabla de periodos quincenales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Periodos quincenales</CardTitle>
            <p className="text-sm text-gray-500">
              Fechas, montos, feriados, pausas y datos de pago por quincena.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPeriod(null);
              setPeriodModalMode("add");
              setPeriodModalOpen(true);
            }}
            className="bg-primary-blue hover:bg-primary-blue/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar periodo
          </Button>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 space-y-2">
              <p>Aún no hay periodos registrados.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPeriod(null);
                  setPeriodModalMode("add");
                  setPeriodModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer periodo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ITEM</TableHead>
                    <TableHead className="whitespace-nowrap">ESTADO</TableHead>
                    <TableHead className="whitespace-nowrap">F. PAGO C.</TableHead>
                    <TableHead className="whitespace-nowrap">TURNO</TableHead>
                    <TableHead className="whitespace-nowrap">F. DESDE</TableHead>
                    <TableHead className="whitespace-nowrap">F. HASTA</TableHead>
                    <TableHead className="whitespace-nowrap">MONTO</TableHead>
                    <TableHead className="whitespace-nowrap">F. FERIADOS</TableHead>
                    <TableHead className="whitespace-nowrap">M. FERIADOS</TableHead>
                    <TableHead className="whitespace-nowrap">P. DEL SERV</TableHead>
                    <TableHead className="whitespace-nowrap">F. PAUSAS</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[160px]">ADICIONALES</TableHead>
                    <TableHead className="whitespace-nowrap">MONTO TOTAL</TableHead>
                    <TableHead className="whitespace-nowrap">FECHA DE PAGO</TableHead>
                    <TableHead className="whitespace-nowrap">METODO PAGO</TableHead>
                    <TableHead className="whitespace-nowrap">N° OPERACIÓN</TableHead>
                    <TableHead className="whitespace-nowrap w-[140px] sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.item}</TableCell>
                      <TableCell>
                        <span className={p.fecha_pago ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                          {getPeriodoEstado(p)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(p.fecha_pago_quincena)}</TableCell>
                      <TableCell>{p.turno ?? "-"}</TableCell>
                      <TableCell>{formatDate(p.f_desde)}</TableCell>
                      <TableCell>{formatDate(p.f_hasta)}</TableCell>
                      <TableCell>{formatMoney(p.monto)}</TableCell>
                      <TableCell>{p.f_feriados ?? "0"}</TableCell>
                      <TableCell>{formatMoney(p.m_feriados)}</TableCell>
                      <TableCell>{p.p_del_serv ?? "0"}</TableCell>
                      <TableCell>{p.f_pausas ?? "0"}</TableCell>
                      <TableCell className="whitespace-pre-line text-sm">
                        {formatAdicionalesCell(p.adicionales)}
                      </TableCell>
                      <TableCell className="font-medium">{formatMoney(p.monto_total)}</TableCell>
                      <TableCell>{p.fecha_pago ?? "-"}</TableCell>
                      <TableCell>{p.metodo_pago ?? "-"}</TableCell>
                      <TableCell>{p.numero_operacion ?? "-"}</TableCell>
                      <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPeriod(p);
                              setPeriodModalMode("edit");
                              setPeriodModalOpen(true);
                            }}
                            title="Editar periodo"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePeriod(p)}
                            disabled={deletingPeriodId === p.id}
                            title="Eliminar periodo"
                          >
                            {deletingPeriodId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <HomeCarePeriodModal
        key={`period-modal-${periodModalMode}-${editingPeriod?.id ?? "new"}`}
        open={periodModalOpen}
        onOpenChange={setPeriodModalOpen}
        mode={periodModalMode}
        contractId={contract.id}
        planMontoMensual={planMontoFinal}
        planTurno={planTurno}
        period={periodModalMode === "edit" ? editingPeriod : null}
        onSaved={loadData}
        onSave={handleSavePeriod}
      />
    </div>
  );
}
