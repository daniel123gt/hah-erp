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
import { AddQuoteModal } from "~/components/ui/add-quote-modal";
import { ViewQuoteModal } from "~/components/ui/view-quote-modal";
import { EditQuoteModal } from "~/components/ui/edit-quote-modal";
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  DollarSign, 
  Calendar, 
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Quote {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  createdAt: string;
  validUntil: string;
  notes?: string;
}

const mockQuotes: Quote[] = [
  {
    id: "Q001",
    patientName: "María González",
    patientEmail: "maria.gonzalez@email.com",
    patientPhone: "+51 999 123 456",
    doctorName: "Dr. Roberto Silva",
    services: [
      { name: "Consulta Médica General", price: 80.00, quantity: 1 },
      { name: "Hemograma Completo", price: 45.00, quantity: 1 },
      { name: "Radiografía de Tórax", price: 95.00, quantity: 1 }
    ],
    totalAmount: 220.00,
    status: "accepted",
    createdAt: "2025-01-20",
    validUntil: "2025-02-20",
    notes: "Paciente aceptó la cotización"
  },
  {
    id: "Q002",
    patientName: "Carlos Rodríguez",
    patientEmail: "carlos.rodriguez@email.com",
    patientPhone: "+51 999 234 567",
    doctorName: "Dra. Elena Morales",
    services: [
      { name: "Electrocardiograma", price: 120.00, quantity: 1 },
      { name: "Perfil Lipídico", price: 65.00, quantity: 1 }
    ],
    totalAmount: 185.00,
    status: "sent",
    createdAt: "2025-01-22",
    validUntil: "2025-02-22"
  },
  {
    id: "Q003",
    patientName: "Ana Torres",
    patientEmail: "ana.torres@email.com",
    patientPhone: "+51 999 345 678",
    doctorName: "Dr. Carlos Mendoza",
    services: [
      { name: "Consulta Cardiológica", price: 150.00, quantity: 1 },
      { name: "Ecocardiografía", price: 200.00, quantity: 1 },
      { name: "Prueba de Esfuerzo", price: 180.00, quantity: 1 }
    ],
    totalAmount: 530.00,
    status: "draft",
    createdAt: "2025-01-23",
    validUntil: "2025-02-23"
  },
  {
    id: "Q004",
    patientName: "Luis Mendoza",
    patientEmail: "luis.mendoza@email.com",
    patientPhone: "+51 999 456 789",
    doctorName: "Lic. Miguel Torres",
    services: [
      { name: "Hemograma Completo", price: 45.00, quantity: 2 },
      { name: "Glucosa en Ayunas", price: 35.00, quantity: 1 },
      { name: "Creatinina", price: 40.00, quantity: 1 }
    ],
    totalAmount: 165.00,
    status: "rejected",
    createdAt: "2025-01-18",
    validUntil: "2025-02-18",
    notes: "Paciente prefirió otro laboratorio"
  },
  {
    id: "Q005",
    patientName: "Carmen Silva",
    patientEmail: "carmen.silva@email.com",
    patientPhone: "+51 999 567 890",
    doctorName: "Dr. Roberto Silva",
    services: [
      { name: "Vacuna contra la Influenza", price: 35.00, quantity: 1 },
      { name: "Consulta de Control", price: 60.00, quantity: 1 }
    ],
    totalAmount: 95.00,
    status: "expired",
    createdAt: "2025-01-10",
    validUntil: "2025-02-10"
  }
];

export default function CotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || quote.status === filterStatus;
    const matchesDate = !filterDate || quote.createdAt === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleQuoteAdded = (newQuote: Quote) => {
    setQuotes(prev => [newQuote, ...prev]);
  };

  const handleQuoteUpdated = (updatedQuote: Quote) => {
    setQuotes(prev => 
      prev.map(quote => 
        quote.id === updatedQuote.id ? updatedQuote : quote
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Aceptada</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expirada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="w-4 h-4 text-gray-600" />;
      case "sent":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;
  const totalRevenue = quotes
    .filter(q => q.status === "accepted")
    .reduce((acc, q) => acc + q.totalAmount, 0);
  const pendingQuotes = quotes.filter(q => q.status === "sent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Cotizaciones</h1>
          <p className="text-gray-600 mt-2">Administra presupuestos y cotizaciones médicas</p>
        </div>
        <AddQuoteModal onQuoteAdded={handleQuoteAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cotizaciones</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuotes}</p>
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
                <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                <p className="text-2xl font-bold text-gray-900">{acceptedQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">S/ {totalRevenue.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar cotizaciones por paciente, doctor o ID..."
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
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="accepted">Aceptada</option>
              <option value="rejected">Rechazada</option>
              <option value="expired">Expirada</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.patientName}</p>
                      <p className="text-sm text-gray-500">{quote.patientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{quote.doctorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {quote.services.map((service, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-gray-500 ml-2">
                            x{service.quantity} - S/ {service.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">S/ {quote.totalAmount.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(quote.status)}
                      {getStatusBadge(quote.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <ViewQuoteModal quote={quote} />
                      <EditQuoteModal 
                        quote={quote} 
                        onQuoteUpdated={handleQuoteUpdated} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
