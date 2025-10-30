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
import { AddInventoryModal } from "~/components/ui/add-inventory-modal";
import { ViewInventoryModal } from "~/components/ui/view-inventory-modal";
import { EditInventoryModal } from "~/components/ui/edit-inventory-modal";
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Minus,
  Plus as PlusIcon
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | "expired";
}

const mockInventory: InventoryItem[] = [
  {
    id: "INV001",
    name: "Jeringas 10ml",
    category: "Insumos",
    description: "Jeringas estériles de 10ml con aguja",
    currentStock: 150,
    minStock: 50,
    maxStock: 500,
    unit: "unidades",
    price: 2.50,
    supplier: "MedSupply S.A.",
    lastRestocked: "2025-01-15",
    status: "in_stock"
  },
  {
    id: "INV002",
    name: "Guantes Látex M",
    category: "Protección",
    description: "Guantes de látex tamaño mediano",
    currentStock: 25,
    minStock: 100,
    maxStock: 300,
    unit: "pares",
    price: 1.80,
    supplier: "SafeGloves",
    lastRestocked: "2025-01-10",
    status: "low_stock"
  },
  {
    id: "INV003",
    name: "Paracetamol 500mg",
    category: "Medicamentos",
    description: "Tabletas de paracetamol 500mg",
    currentStock: 0,
    minStock: 200,
    maxStock: 1000,
    unit: "tabletas",
    price: 0.15,
    supplier: "PharmaCorp",
    lastRestocked: "2025-01-05",
    status: "out_of_stock"
  },
  {
    id: "INV004",
    name: "Vendas Elásticas",
    category: "Vendajes",
    description: "Vendas elásticas de 10cm x 5m",
    currentStock: 45,
    minStock: 30,
    maxStock: 150,
    unit: "rollos",
    price: 8.50,
    supplier: "BandagePro",
    lastRestocked: "2025-01-18",
    status: "in_stock"
  },
  {
    id: "INV005",
    name: "Alcohol Isopropílico",
    category: "Limpieza",
    description: "Alcohol isopropílico 70% 500ml",
    currentStock: 12,
    minStock: 20,
    maxStock: 100,
    unit: "botellas",
    price: 12.00,
    supplier: "CleanChem",
    lastRestocked: "2025-01-12",
    expiryDate: "2026-01-12",
    status: "low_stock"
  }
];

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleInventoryAdded = (newItem: InventoryItem) => {
    setInventory(prev => [newItem, ...prev]);
  };

  const handleInventoryUpdated = (updatedItem: InventoryItem) => {
    setInventory(prev => 
      prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-100 text-green-800">En Stock</Badge>;
      case "low_stock":
        return <Badge className="bg-yellow-100 text-yellow-800">Stock Bajo</Badge>;
      case "out_of_stock":
        return <Badge className="bg-red-100 text-red-800">Sin Stock</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expirado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStockIndicator = (current: number, min: number) => {
    if (current === 0) {
      return <Minus className="w-4 h-4 text-red-600" />;
    } else if (current <= min) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <Package className="w-4 h-4 text-green-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Insumos":
        return "bg-blue-100 text-blue-800";
      case "Protección":
        return "bg-green-100 text-green-800";
      case "Medicamentos":
        return "bg-purple-100 text-purple-800";
      case "Vendajes":
        return "bg-orange-100 text-orange-800";
      case "Limpieza":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalItems = inventory.length;
  const inStockItems = inventory.filter(i => i.status === "in_stock").length;
  const lowStockItems = inventory.filter(i => i.status === "low_stock").length;
  const outOfStockItems = inventory.filter(i => i.status === "out_of_stock").length;
  const totalValue = inventory.reduce((acc, item) => acc + (item.currentStock * item.price), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-2">Controla el stock de suministros médicos</p>
        </div>
        <AddInventoryModal onInventoryAdded={handleInventoryAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En Stock</p>
                <p className="text-2xl font-bold text-gray-900">{inStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
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
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">S/ {totalValue.toFixed(2)}</p>
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
                placeholder="Buscar productos por nombre, descripción o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todas las categorías</option>
              <option value="Insumos">Insumos</option>
              <option value="Protección">Protección</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Vendajes">Vendajes</option>
              <option value="Limpieza">Limpieza</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="in_stock">En Stock</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="out_of_stock">Sin Stock</option>
              <option value="expired">Expirado</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Último Restock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <p className="text-xs text-gray-400">ID: {item.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStockIndicator(item.currentStock, item.minStock)}
                      <div>
                        <p className="font-medium">{item.currentStock} {item.unit}</p>
                        <p className="text-sm text-gray-500">
                          Min: {item.minStock} | Max: {item.maxStock}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">S/ {item.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{item.supplier}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(item.lastRestocked).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <ViewInventoryModal item={item} />
                      <EditInventoryModal 
                        item={item} 
                        onInventoryUpdated={handleInventoryUpdated} 
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
