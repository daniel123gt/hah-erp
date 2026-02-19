import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { PERSONAL_CATEGORIES } from "./categories";
import { HeartPulse, Stethoscope, Briefcase, X, Users, UserCheck, Calendar, Loader2 } from "lucide-react";
import { staffService, type Staff } from "~/services/staffService";
import { formatDateOnly } from "~/lib/dateUtils";

const categoryIcons: Record<string, React.ReactNode> = {
  enfermeria: <HeartPulse className="w-8 h-8 text-green-600" />,
  medicina: <Stethoscope className="w-8 h-8 text-blue-600" />,
  administracion: <Briefcase className="w-8 h-8 text-orange-600" />,
};

const categoryColors: Record<string, string> = {
  enfermeria: "bg-green-50 border-green-200 hover:bg-green-100",
  medicina: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  administracion: "bg-orange-50 border-orange-200 hover:bg-orange-100",
};

export default function PersonalDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, thisYear: 0, medicos: 0 });
  const [staffHiredThisYear, setStaffHiredThisYear] = useState<Staff[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHiredThisYear, setLoadingHiredThisYear] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [statsData, medicosResult] = await Promise.all([
        staffService.getStaffStats(),
        staffService.getStaff({ position: "Medico General", limit: 1, page: 1 }),
      ]);
      setStats({
        total: statsData.total,
        active: statsData.active,
        thisYear: statsData.thisYear,
        medicos: medicosResult.total ?? 0,
      });
    } catch (err) {
      console.error("Error al cargar estadísticas de personal:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadStaffHiredThisYear = useCallback(async () => {
    try {
      setLoadingHiredThisYear(true);
      const list = await staffService.getStaffHiredThisYear();
      setStaffHiredThisYear(list);
    } catch (err) {
      console.error("Error al cargar personal contratado este año:", err);
    } finally {
      setLoadingHiredThisYear(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadStaffHiredThisYear();
  }, [loadStats, loadStaffHiredThisYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Personal</h1>
          <p className="text-gray-600 mt-1">Seleccione una categoría para ver el listado</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <X className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Personal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Personal Activo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Médicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stats.medicos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contratados Este Año</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : stats.thisYear}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PERSONAL_CATEGORIES.map((cat) => (
          <Card
            key={cat.slug}
            className={`p-6 cursor-pointer transition-colors ${categoryColors[cat.slug] ?? "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
            onClick={() => navigate(`/personal/${cat.slug}`)}
          >
            <CardContent className="flex flex-col items-center text-center space-y-3 pt-6">
              {categoryIcons[cat.slug]}
              <div>
                <h3 className="font-semibold text-gray-800">{cat.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {cat.subcategories.length} {cat.subcategories.length === 1 ? "área" : "áreas"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla resumen: Empleados que ingresaron este año */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-blue" />
            Empleados que ingresaron este año
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHiredThisYear ? (
            <div className="flex justify-center py-8 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando...
            </div>
          ) : staffHiredThisYear.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Ningún empleado ingresó este año.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Fecha de contratación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffHiredThisYear.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>{member.department ?? "—"}</TableCell>
                      <TableCell>{member.hire_date ? formatDateOnly(member.hire_date) : "—"}</TableCell>
                      <TableCell>
                        <Badge className={member.status === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {member.status}
                        </Badge>
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
