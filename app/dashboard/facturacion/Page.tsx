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
import { AddInvoiceModal } from "~/components/ui/add-invoice-modal";
import { ViewInvoiceModal } from "~/components/ui/view-invoice-modal";
import { EditInvoiceModal } from "~/components/ui/edit-invoice-modal";
import { 
  Search, 
  Plus, 
  Filter, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Invoice {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "card" | "transfer" | "insurance";
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "INV001",
    patientName: "María González",
    patientEmail: "maria.gonzalez@email.com",
    patientPhone: "+51 999 123 456",
    invoiceNumber: "F-2025-001",
    issueDate: "2025-01-20",
    dueDate: "2025-02-20",
    totalAmount: 220.00,
    paidAmount: 220.00,
    status: "paid",
    paymentMethod: "card",
    services: [
      { name: "Consulta Médica General", quantity: 1, unitPrice: 80.00, total: 80.00 },
      { name: "Hemograma Completo", quantity: 1, unitPrice: 45.00, total: 45.00 },
      { name: "Radiografía de Tórax", quantity: 1, unitPrice: 95.00, total: 95.00 }
    ]
  },
  {
    id: "INV002",
    patientName: "Carlos Rodríguez",
    patientEmail: "carlos.rodriguez@email.com",
    patientPhone: "+51 999 234 567",
    invoiceNumber: "F-2025-002",
    issueDate: "2025-01-22",
    dueDate: "2025-02-22",
    totalAmount: 185.00,
    paidAmount: 0.00,
    status: "sent",
    services: [
      { name: "Electrocardiograma", quantity: 1, unitPrice: 120.00, total: 120.00 },
      { name: "Perfil Lipídico", quantity: 1, unitPrice: 65.00, total: 65.00 }
    ]
  },
  {
    id: "INV003",
    patientName: "Ana Torres",
    patientEmail: "ana.torres@email.com",
    patientPhone: "+51 999 345 678",
    invoiceNumber: "F-2025-003",
    issueDate: "2025-01-23",
    dueDate: "2025-02-23",
    totalAmount: 530.00,
    paidAmount: 0.00,
    status: "draft",
    services: [
      { name: "Consulta Cardiológica", quantity: 1, unitPrice: 150.00, total: 150.00 },
      { name: "Ecocardiografía", quantity: 1, unitPrice: 200.00, total: 200.00 },
      { name: "Prueba de Esfuerzo", quantity: 1, unitPrice: 180.00, total: 180.00 }
    ]
  },
  {
    id: "INV004",
    patientName: "Luis Mendoza",
    patientEmail: "luis.mendoza@email.com",
    patientPhone: "+51 999 456 789",
    invoiceNumber: "F-2025-004",
    issueDate: "2025-01-18",
    dueDate: "2025-02-18",
    totalAmount: 165.00,
    paidAmount: 0.00,
    status: "overdue",
    services: [
      { name: "Hemograma Completo", quantity: 2, unitPrice: 45.00, total: 90.00 },
      { name: "Glucosa en Ayunas", quantity: 1, unitPrice: 35.00, total: 35.00 },
      { name: "Creatinina", quantity: 1, unitPrice: 40.00, total: 40.00 }
    ]
  },
  {
    id: "INV005",
    patientName: "Carmen Silva",
    patientEmail: "carmen.silva@email.com",
    patientPhone: "+51 999 567 890",
    invoiceNumber: "F-2025-005",
    issueDate: "2025-01-10",
    dueDate: "2025-02-10",
    totalAmount: 95.00,
    paidAmount: 95.00,
    status: "paid",
    paymentMethod: "cash",
    services: [
      { name: "Vacuna contra la Influenza", quantity: 1, unitPrice: 35.00, total: 35.00 },
      { name: "Consulta de Control", quantity: 1, unitPrice: 60.00, total: 60.00 }
    ]
  }
];

export default function FacturacionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchesDate = !filterDate || invoice.issueDate === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleInvoiceAdded = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const handleInvoiceUpdated = (updatedInvoice: Invoice) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
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
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "card":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case "transfer":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case "insurance":
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((acc, i) => acc + i.paidAmount, 0);
  const pendingAmount = invoices
    .filter(i => i.status !== "paid" && i.status !== "cancelled")
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Facturación</h1>
          <p className="text-gray-600 mt-2">Administra facturas y cobros médicos</p>
        </div>
        <AddInvoiceModal onInvoiceAdded={handleInvoiceAdded} />
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
                <p className="text-sm font-medium text-gray-600">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
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
                <p className="text-sm font-medium text-gray-600">Pagadas</p>
                <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
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
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
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
                <p className="text-sm font-medium text-gray-600">Pendiente</p>
                <p className="text-2xl font-bold text-gray-900">S/ {pendingAmount.toFixed(2)}</p>
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
                placeholder="Buscar facturas por paciente, número o ID..."
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
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">ID: {invoice.id}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.patientName}</p>
                      <p className="text-sm text-gray-500">{invoice.patientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {invoice.services.map((service, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-gray-500 ml-2">
                            x{service.quantity} - S/ {service.unitPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">S/ {invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(invoice.paymentMethod)}
                      <span className="font-medium">S/ {invoice.paidAmount.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invoice.status)}
                      {getStatusBadge(invoice.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex space-x-2">
                      <ViewInvoiceModal invoice={invoice} />
                      <EditInvoiceModal 
                        invoice={invoice} 
                        onInvoiceUpdated={handleInvoiceUpdated} 
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
