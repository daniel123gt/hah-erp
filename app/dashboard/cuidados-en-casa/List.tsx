import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2, Building2, Search } from "lucide-react";
import homeCareService, { type HomeCareContractWithPatient } from "~/services/homeCareService";
import { AddHomeCarePatientModal } from "~/components/ui/add-home-care-patient-modal";

function getPatientName(contract: HomeCareContractWithPatient): string {
  const p = contract.patient;
  if (!p) return "Paciente no encontrado";
  return Array.isArray(p) ? (p[0]?.name ?? "Paciente") : (p?.name ?? "Paciente");
}

type EstadoFilter = "todos" | "activos" | "inactivos";

export default function CuidadosEnCasaList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<HomeCareContractWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("activos");

  useEffect(() => {
    loadContracts();
  }, [estadoFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const options =
        estadoFilter === "todos"
          ? undefined
          : { is_active: estadoFilter === "activos" };
      const data = await homeCareService.getContracts(options);
      setContracts(data);
    } catch (error) {
      console.error("Error al cargar contratos:", error);
      toast.error("Error al cargar la lista de cuidados en casa");
    } finally {
      setLoading(false);
    }
  };

  const filtered = contracts.filter((c) => {
    if (!searchTerm.trim()) return true;
    const name = getPatientName(c).toLowerCase();
    const familiar = (c.familiar_encargado ?? "").toLowerCase();
    const plan = (c.plan_nombre ?? "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || familiar.includes(term) || plan.includes(term);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Cuidados en casa
          </h1>
        </div>
        <AddHomeCarePatientModal
          onAdded={(patientId) => {
            loadContracts();
            navigate(`/cuidados-en-casa/${patientId}`);
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes con servicio de cuidados en casa</CardTitle>
          <p className="text-sm text-gray-500">
            Listado de pacientes con contrato de cuidado en casa (cobro quincenal). Filtra por estado o busca por nombre.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, familiar o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Estado:</span>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <span className="ml-2 text-gray-600">Cargando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>
                {contracts.length === 0
                  ? estadoFilter === "todos"
                    ? "No hay contratos de cuidados en casa."
                    : estadoFilter === "activos"
                      ? "No hay pacientes con servicio activo."
                      : "No hay pacientes con servicio inactivo."
                  : "No hay resultados para la búsqueda."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Familiar encargado</TableHead>
                    <TableHead>Fecha inicio</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto mensual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {getPatientName(contract)}
                      </TableCell>
                      <TableCell>{contract.familiar_encargado ?? "-"}</TableCell>
                      <TableCell>
                        {contract.fecha_inicio
                          ? new Date(contract.fecha_inicio).toLocaleDateString("es-PE")
                          : "-"}
                      </TableCell>
                      <TableCell>{contract.plan_nombre ?? "-"}</TableCell>
                      <TableCell>
                        S/ {Number(contract.plan_monto_mensual).toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            contract.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {contract.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/cuidados-en-casa/${contract.patient_id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
