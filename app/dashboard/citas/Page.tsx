import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AddAppointmentModal } from "~/components/ui/add-appointment-modal";
import { ViewAppointmentModal } from "~/components/ui/view-appointment-modal";
import { EditAppointmentModal } from "~/components/ui/edit-appointment-modal";
import { formatDateOnly } from "~/services/appointmentsService";
import { parseDateOnlyAsLocal, getTodayLocal } from "~/lib/dateUtils";
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  duration: number;
  type: "consulta" | "examen" | "emergencia" | "seguimiento";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "A001",
    patientName: "María González",
    patientEmail: "maria.gonzalez@email.com",
    patientPhone: "+51 999 123 456",
    doctorName: "Dr. Roberto Silva",
    doctorSpecialty: "Medicina General",
    date: "2025-01-25",
    time: "09:00",
    duration: 30,
    type: "consulta",
    status: "confirmed",
    location: "Consultorio 1"
  },
  {
    id: "A002",
    patientName: "Carlos Rodríguez",
    patientEmail: "carlos.rodriguez@email.com",
    patientPhone: "+51 999 234 567",
    doctorName: "Dra. Elena Morales",
    doctorSpecialty: "Enfermería",
    date: "2025-01-25",
    time: "10:30",
    duration: 45,
    type: "examen",
    status: "scheduled",
    location: "Laboratorio"
  },
  {
    id: "A003",
    patientName: "Ana Torres",
    patientEmail: "ana.torres@email.com",
    patientPhone: "+51 999 345 678",
    doctorName: "Dr. Carlos Mendoza",
    doctorSpecialty: "Cardiología",
    date: "2025-01-25",
    time: "14:00",
    duration: 60,
    type: "seguimiento",
    status: "scheduled",
    location: "Consultorio 3"
  },
  {
    id: "A004",
    patientName: "Luis Mendoza",
    patientEmail: "luis.mendoza@email.com",
    patientPhone: "+51 999 456 789",
    doctorName: "Lic. Miguel Torres",
    doctorSpecialty: "Laboratorio",
    date: "2025-01-24",
    time: "08:00",
    duration: 20,
    type: "examen",
    status: "completed",
    location: "Laboratorio"
  },
  {
    id: "A005",
    patientName: "Carmen Silva",
    patientEmail: "carmen.silva@email.com",
    patientPhone: "+51 999 567 890",
    doctorName: "Dr. Roberto Silva",
    doctorSpecialty: "Medicina General",
    date: "2025-01-23",
    time: "16:30",
    duration: 30,
    type: "consulta",
    status: "cancelled",
    notes: "Paciente canceló por enfermedad",
    location: "Consultorio 1"
  }
];

export default function CitasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || appointment.date === filterDate;
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    const matchesType = filterType === "all" || appointment.type === filterType;
    
    return matchesSearch && matchesDate && matchesStatus && matchesType;
  });

  const handleAppointmentAdded = (newAppointment: Appointment) => {
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const handleAppointmentUpdated = (updatedAppointment: Appointment) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === updatedAppointment.id ? updatedAppointment : appointment
      )
    );
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

  const todayLocal = getTodayLocal();
  const todayAppointments = appointments.filter((a) => a.date === todayLocal);
  const upcomingAppointments = appointments.filter(
    (a) => parseDateOnlyAsLocal(a.date) > new Date()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Citas</h1>
          <p className="text-gray-600 mt-2">Programa y administra las citas médicas</p>
        </div>
        <AddAppointmentModal onAppointmentAdded={handleAppointmentAdded} />
      </div>

      {/* Stats Cards */}
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
                  {appointments.filter(a => a.status === "confirmed").length}
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
                  {appointments.filter(a => a.status === "scheduled").length}
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
                <p className="text-sm font-medium text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
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
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-blue">{appointment.time}</p>
                      <p className="text-sm text-gray-500">{appointment.duration} min</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">{appointment.doctorName} - {appointment.doctorSpecialty}</p>
                      <p className="text-sm text-gray-500">{appointment.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    {getStatusBadge(appointment.status)}
                    <ViewAppointmentModal appointment={appointment} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar citas por paciente o doctor..."
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

      {/* Appointments Table */}
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
                <TableHead>Paciente</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-medium">{formatDateOnly(appointment.date)}</p>
                      <p className="text-sm text-gray-500">{appointment.time} ({appointment.duration} min)</p>
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
                    <div>
                      <p className="font-medium">{appointment.doctorName}</p>
                      <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(appointment.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{appointment.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appointment.status)}
                      {getStatusBadge(appointment.status)}
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex space-x-2">
                      <ViewAppointmentModal appointment={appointment} />
                      <EditAppointmentModal 
                        appointment={appointment} 
                        onAppointmentUpdated={handleAppointmentUpdated} 
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
