import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Building2, Plus, Pencil, Trash2 } from "lucide-react";
import homeCareService, {
  type HomeCareContractWithPatient,
  type HomeCarePeriod,
} from "~/services/homeCareService";
import {
  HomeCarePeriodModal,
  type PeriodFormData,
} from "~/components/ui/home-care-period-modal";
import {
  EditHomeCareContractModal,
  type ContractFormData,
} from "~/components/ui/edit-home-care-contract-modal";

function getPatientName(contract: HomeCareContractWithPatient | null): string {
  if (!contract?.patient) return "Paciente";
  const p = contract.patient;
  return Array.isArray(p) ? (p[0]?.name ?? "Paciente") : (p?.name ?? "Paciente");
}

function formatDate(s: string | null): string {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleDateString("es-PE");
  } catch {
    return s;
  }
}

function formatMoney(n: number): string {
  return `S/. ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const montoQuincena = contract ? contract.plan_monto_mensual / 2 : 0;

  const handleSaveContract = async (data: ContractFormData) => {
    if (!contract) return;
    await homeCareService.updateContract(contract.id, {
      familiar_encargado: data.familiar_encargado || null,
      hora_inicio: data.hora_inicio || null,
      fecha_inicio: data.fecha_inicio,
      plan_id: data.plan_id || null,
      plan_nombre: data.plan_nombre || null,
      plan_monto_mensual: parseFloat(data.plan_monto_mensual) || 0,
      is_active: data.is_active,
    });
    toast.success("Contrato actualizado.");
  };

  const handleDeletePeriod = async (p: HomeCarePeriod) => {
    if (!window.confirm(`¿Eliminar el periodo ${p.item} (${formatDate(p.f_desde)} - ${formatDate(p.f_hasta)})?`)) return;
    try {
      await homeCareService.deletePeriod(p.id);
      toast.success("Periodo eliminado.");
      loadData();
    } catch (error) {
      console.error("Error al eliminar periodo:", error);
      toast.error("No se pudo eliminar el periodo");
    }
  };

  const handleSavePeriod = async (data: PeriodFormData) => {
    if (!contract) return;
    const payload = {
      fecha_pago_quincena: data.fecha_pago_quincena || null,
      turno: "24X24" as const,
      f_desde: data.f_desde,
      f_hasta: data.f_hasta,
      monto: montoQuincena,
      f_feriados: data.f_feriados || null,
      m_feriados: parseFloat(data.m_feriados) || 0,
      p_del_serv: data.p_del_serv || null,
      f_pausas: data.f_pausas || null,
      monto_total: parseFloat(data.monto_total) || 0,
      fecha_pago: data.fecha_pago || null,
      metodo_pago: data.metodo_pago || null,
      numero_operacion: data.numero_operacion || null,
      factura_boleta: data.factura_boleta || null,
    };
    if (periodModalMode === "add") {
      await homeCareService.createPeriod(contract.id, payload);
      toast.success("Periodo agregado.");
    } else if (editingPeriod) {
      await homeCareService.updatePeriod(editingPeriod.id, payload);
      toast.success("Periodo actualizado.");
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

  const planLabel = contract.plan_nombre
    ? `${contract.plan_nombre} ${contract.plan_monto_mensual ? `S/. ${Number(contract.plan_monto_mensual).toLocaleString("es-PE")}` : ""}`
    : `S/. ${Number(contract.plan_monto_mensual).toLocaleString("es-PE")}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/cuidados-en-casa")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Cuidados en casa – {getPatientName(contract)}
        </h1>
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
              <span className="font-medium">{planLabel}</span>
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
                    <TableHead className="whitespace-nowrap">F. PAGO C.</TableHead>
                    <TableHead className="whitespace-nowrap">TURNO</TableHead>
                    <TableHead className="whitespace-nowrap">N° PAGO</TableHead>
                    <TableHead className="whitespace-nowrap">F. DESDE</TableHead>
                    <TableHead className="whitespace-nowrap">F. HASTA</TableHead>
                    <TableHead className="whitespace-nowrap">MONTO</TableHead>
                    <TableHead className="whitespace-nowrap">F. FERIADOS</TableHead>
                    <TableHead className="whitespace-nowrap">M. FERIADOS</TableHead>
                    <TableHead className="whitespace-nowrap">P. DEL SERV</TableHead>
                    <TableHead className="whitespace-nowrap">F. PAUSAS</TableHead>
                    <TableHead className="whitespace-nowrap">MONTO TOTAL</TableHead>
                    <TableHead className="whitespace-nowrap">FECHA DE PAGO</TableHead>
                    <TableHead className="whitespace-nowrap">METODO PAGO</TableHead>
                    <TableHead className="whitespace-nowrap">N° OPERACIÓN</TableHead>
                    <TableHead className="whitespace-nowrap">FACTURA/BOLETA</TableHead>
                    <TableHead className="whitespace-nowrap w-[140px] sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.item}</TableCell>
                      <TableCell>{formatDate(p.fecha_pago_quincena)}</TableCell>
                      <TableCell>{p.turno ?? "-"}</TableCell>
                      <TableCell>{p.n_pago}</TableCell>
                      <TableCell>{formatDate(p.f_desde)}</TableCell>
                      <TableCell>{formatDate(p.f_hasta)}</TableCell>
                      <TableCell>{formatMoney(p.monto)}</TableCell>
                      <TableCell>{p.f_feriados ?? "0"}</TableCell>
                      <TableCell>{formatMoney(p.m_feriados)}</TableCell>
                      <TableCell>{p.p_del_serv ?? "0"}</TableCell>
                      <TableCell>{p.f_pausas ?? "0"}</TableCell>
                      <TableCell className="font-medium">{formatMoney(p.monto_total)}</TableCell>
                      <TableCell>{p.fecha_pago ?? "-"}</TableCell>
                      <TableCell>{p.metodo_pago ?? "-"}</TableCell>
                      <TableCell>{p.numero_operacion ?? "-"}</TableCell>
                      <TableCell>{p.factura_boleta ?? "-"}</TableCell>
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
                            title="Eliminar periodo"
                          >
                            <Trash2 className="w-4 h-4" />
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
        planMontoMensual={contract.plan_monto_mensual}
        period={periodModalMode === "edit" ? editingPeriod : null}
        onSaved={loadData}
        onSave={handleSavePeriod}
      />
    </div>
  );
}
