import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { appointmentsService, formatDateOnly } from "~/services/appointmentsService";
import { patientsService, type Patient } from "~/services/patientsService";
import { rxEcografiaRecordsService } from "~/services/rxEcografiaRecordsService";
import { getTodayLocal } from "~/lib/dateUtils";
import { normalizeSearchText } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AddAppointmentModal } from "~/components/ui/add-appointment-modal";
import { ViewAppointmentModal } from "~/components/ui/view-appointment-modal";
import { EditAppointmentModal } from "~/components/ui/edit-appointment-modal";
import { useNotifications } from "~/contexts/NotificationsContext";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Scan,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  duration: number;
  type: "consulta" | "examen" | "emergencia" | "seguimiento" | "procedimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
  district?: string | null;
  patient_id?: string;
  procedure_catalog_id?: string;
  procedure_name?: string;
  procedure_ingreso?: number | null;
  appointment_ingreso?: number | null;
  payment_method?: string | null;
  numero_operacion?: string | null;
}

export default function CitasRxEcografiasPage() {
  const navigate = useNavigate();
  const { addNotification, markCreatedByMe } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    appointmentsService
      .list("rx_ecografias")
      .then(setAppointments)
      .catch((err) => {
        console.error(err);
        toast.error("Error al cargar las citas");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ids = [...new Set(appointments.map((a) => a.patient_id).filter(Boolean))] as string[];
    if (ids.length === 0) {
      setPatients({});
      return;
    }
    Promise.all(ids.map((id) => patientsService.getPatientById(id).catch(() => null)))
      .then((list) => {
        const map: Record<string, Patient> = {};
        list.forEach((p, i) => {
          if (p) map[ids[i]] = p;
        });
        setPatients(map);
      })
      .catch(() => setPatients({}));
  }, [appointments]);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      normalizeSearchText(appointment.patientName).includes(normalizeSearchText(searchTerm)) ||
      normalizeSearchText(appointment.doctorName).includes(normalizeSearchText(searchTerm));
    const matchesDate = !filterDate || appointment.date === filterDate;
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    const matchesType = filterType === "all" || appointment.type === filterType;
    return matchesSearch && matchesDate && matchesStatus && matchesType;
  });

  const handleAppointmentAdded = (newAppointment: Appointment) => {
    return appointmentsService
      .create({
        variant: "rx_ecografias",
        patient_id: newAppointment.patient_id ?? null,
        patientName: newAppointment.patientName,
        patientEmail: newAppointment.patientEmail,
        patientPhone: newAppointment.patientPhone,
        doctorName: newAppointment.doctorName,
        doctorSpecialty: newAppointment.doctorSpecialty,
        date: newAppointment.date,
        time: newAppointment.time,
        duration: newAppointment.duration,
        type: newAppointment.type,
        status: newAppointment.status,
        notes: newAppointment.notes,
        location: newAppointment.location,
        appointment_ingreso: newAppointment.appointment_ingreso ?? null,
        payment_method: newAppointment.payment_method ?? null,
        numero_operacion: newAppointment.numero_operacion ?? null,
      })
      .then((created) => {
        setAppointments((prev) => [created, ...prev]);
        toast.success("Cita creada");
        addNotification(
          "cita_programada",
          "Cita RX/Ecografía programada",
          `${created.patientName} — ${created.date} ${created.time}${created.doctorName ? ` · ${created.doctorName}` : ""}`
        );
        markCreatedByMe("appointment", created.id);
        if (created.status === "completed") {
          rxEcografiaRecordsService
            .createFromAppointment({
              id: created.id,
              date: created.date,
              patient_id: created.patient_id ?? null,
              patientName: created.patientName,
              type: created.type,
              doctorName: created.doctorName,
              notes: created.notes,
              appointment_ingreso: created.appointment_ingreso ?? null,
              payment_method: created.payment_method ?? null,
              numero_operacion: created.numero_operacion ?? null,
            })
            .then(() => toast.success("Registro creado en Registro RX/Ecografías"))
            .catch((err) => {
              console.error("Error creando registro RX/Ecografías:", err);
              toast.error(err?.message ?? "Error al crear el registro en Registro RX/Ecografías");
            });
        }
      })
      .catch((err) => {
        toast.error(err?.message ?? "Error al crear la cita");
        throw err;
      });
  };

  const handleAppointmentUpdated = (updatedAppointment: Appointment) => {
    return appointmentsService
      .update({
        id: updatedAppointment.id,
        patient_id: updatedAppointment.patient_id ?? null,
        patientName: updatedAppointment.patientName,
        patientEmail: updatedAppointment.patientEmail,
        patientPhone: updatedAppointment.patientPhone,
        doctorName: updatedAppointment.doctorName,
        doctorSpecialty: updatedAppointment.doctorSpecialty,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        duration: updatedAppointment.duration,
        type: updatedAppointment.type,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        location: updatedAppointment.location,
        appointment_ingreso: updatedAppointment.appointment_ingreso ?? null,
        payment_method: updatedAppointment.payment_method ?? null,
        numero_operacion: updatedAppointment.numero_operacion ?? null,
      })
      .then((updated) => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        toast.success("Cita actualizada");
        if (updated.status === "completed") {
          const ingreso = Number(updated.appointment_ingreso ?? 0);
          rxEcografiaRecordsService
            .getByAppointmentId(updated.id)
            .then((existing) => {
              if (existing) {
                return rxEcografiaRecordsService.update({
                  id: existing.id,
                  ingreso,
                  payment_method: updated.payment_method ?? null,
                  numero_operacion: updated.numero_operacion ?? null,
                });
              }
              return rxEcografiaRecordsService.createFromAppointment({
                id: updated.id,
                date: updated.date,
                patient_id: updated.patient_id ?? null,
                patientName: updated.patientName,
                type: updated.type,
                doctorName: updated.doctorName,
                notes: updated.notes,
                appointment_ingreso: updated.appointment_ingreso ?? null,
                payment_method: updated.payment_method ?? null,
                numero_operacion: updated.numero_operacion ?? null,
              }).then(() => toast.success("Registro creado en Registro RX/Ecografías"));
            })
            .catch((err) => {
              console.error("Error en registro RX/Ecografías:", err);
              toast.error(err?.message ?? "Error al actualizar el registro en Registro RX/Ecografías");
            });
        }
      })
      .catch((err) => {
        toast.error(err?.message ?? "Error al actualizar la cita");
        throw err;
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completada</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case "no-show":
        return <Badge className="bg-orange-100 text-orange-800">No Asistió</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "consulta":
        return <Badge className="bg-blue-100 text-blue-800">Consulta</Badge>;
      case "examen":
        return <Badge className="bg-purple-100 text-purple-800">Examen</Badge>;
      case "emergencia":
        return <Badge className="bg-red-100 text-red-800">Emergencia</Badge>;
      case "seguimiento":
        return <Badge className="bg-green-100 text-green-800">Seguimiento</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "no-show":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const todayAppointments = appointments.filter((a) => a.date === getTodayLocal());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/citas")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-blue">Citas RX / Ecografías</h1>
            <p className="text-gray-600 mt-1">Agenda de citas a domicilio de RX y ecografías</p>
          </div>
        </div>
        <AddAppointmentModal
          onAppointmentAdded={handleAppointmentAdded}
          variant="rx_ecografias"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter((a) => a.status === "confirmed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Programadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter((a) => a.status === "scheduled").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-teal-100 rounded-full">
                <Scan className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-blue" />
              Agenda de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-blue">{appointment.time}</p>
                      <p className="text-sm text-gray-500">{appointment.duration} min</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.doctorName} – {appointment.doctorSpecialty}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    {getStatusBadge(appointment.status)}
                    <ViewAppointmentModal appointment={{ ...appointment, district: appointment.patient_id ? patients[appointment.patient_id]?.district ?? null : null }} professionalLabel="Técnico / Médico" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por paciente o técnico/médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Programadas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no-show">No Asistió</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los tipos</option>
              <option value="consulta">Consulta</option>
              <option value="examen">Examen</option>
              <option value="emergencia">Emergencia</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Técnico / Médico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{formatDateOnly(appointment.date)}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.time} ({appointment.duration} min)
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(appointment.status)}
                        {getStatusBadge(appointment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{appointment.patientPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{appointment.patient_id ? (patients[appointment.patient_id]?.district ?? "—") : "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.doctorName}</p>
                        <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(appointment.type)}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                      <div className="flex space-x-2">
                        <ViewAppointmentModal appointment={{ ...appointment, district: appointment.patient_id ? patients[appointment.patient_id]?.district ?? null : null }} professionalLabel="Técnico / Médico" />
                        <EditAppointmentModal
                          appointment={appointment}
                          onAppointmentUpdated={handleAppointmentUpdated}
                          variant="rx_ecografias"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
