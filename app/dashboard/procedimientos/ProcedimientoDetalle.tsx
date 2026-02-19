import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { procedureService, type ProcedureRecordWithDetails, type ProcedureCatalogItem, getPaymentFromRecord, PAYMENT_METHOD_OPTIONS } from "~/services/procedureService";
import { formatDateOnly } from "~/lib/utils";
import { ArrowLeft, Loader2, User, FileText, DollarSign } from "lucide-react";

function totalIngreso(r: ProcedureRecordWithDetails): number {
  return (
    Number(r.yape || 0) +
    Number(r.plin || 0) +
    Number(r.transfer_deposito || 0) +
    Number(r.tarjeta_link_pos || 0) +
    Number(r.efectivo || 0)
  );
}

export default function ProcedimientoDetalle() {
  const { id } = useParams("/procedimientos/listado/:id");
  const navigate = useNavigate();
  const [record, setRecord] = useState<ProcedureRecordWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await procedureService.getRecordById(id);
        setRecord(data ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/procedimientos/listado")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="text-gray-500">No se encontró el registro.</p>
      </div>
    );
  }

  const displayName =
    (record.patient as { name?: string } | null)?.name ?? record.patient_name ?? "-";
  const proc = record.procedure_catalog as ProcedureCatalogItem | null;
  const procName = proc?.name ?? record.procedure_name ?? "-";
  const ing = totalIngreso(record);
  const costo = proc ? Number(proc.total_cost_soles ?? 0) : 0;
  const materialExtra = Number(record.gastos_material ?? 0);
  const combustible = Number(record.combustible ?? 0);
  const util = ing - costo - materialExtra - combustible - Number(record.costo_adicional_servicio ?? 0);
  const payment = getPaymentFromRecord(record);
  const paymentLabel = PAYMENT_METHOD_OPTIONS.find((o) => o.value === payment.method)?.label ?? payment.method;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalle del procedimiento</h1>
          <p className="text-gray-600 mt-1">
            {(() => {
              const s = String(record.fecha).trim().slice(0, 10);
              const [y, m, d] = s.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            })()}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/procedimientos/listado")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al listado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Paciente y procedimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Paciente</p>
            <p className="font-medium">{displayName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">{formatDateOnly(record.fecha, "es-PE")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cantidad</p>
            <p className="font-medium">{record.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Procedimiento</p>
            <p className="font-medium">{procName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Distrito / Ubicación</p>
            <p className="font-medium">{record.district ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Número de operación</p>
            <p className="font-medium">{record.numero_operacion ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pago recibido (S/.)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Método de pago</p>
            <p className="font-medium">{paymentLabel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monto</p>
            <p className="font-medium">S/ {payment.amount.toFixed(2)}</p>
          </div>
          <div className="md:col-span-2 pt-2 border-t">
            <p className="text-sm text-gray-500">Ingreso total</p>
            <p className="text-lg font-semibold text-primary-blue">S/ {ing.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Costos y utilidad (S/.)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Costo (catálogo)</p>
            <p className="font-medium">{costo.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Material extra</p>
            <p className="font-medium">{materialExtra.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Combustible</p>
            <p className="font-medium">{combustible.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Costo adicional / servicio</p>
            <p className="font-medium">{Number(record.costo_adicional_servicio || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Utilidad</p>
            <p className="font-semibold text-green-600 text-lg">S/ {util.toFixed(2)}</p>
          </div>
          {record.observacion && (
            <div className="md:col-span-4">
              <p className="text-sm text-gray-500">Observación</p>
              <p className="font-medium">{record.observacion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
