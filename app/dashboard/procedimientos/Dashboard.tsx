import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { BookOpen, List, X, BarChart3 } from "lucide-react";

export default function ProcedimientosDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Catálogo de Procedimientos",
      description: "Ver procedimientos con costo y materiales utilizados",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      action: () => navigate("/procedimientos/catalogo"),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      title: "Listado de Procedimientos",
      description: "Registrar, editar y ver procedimientos realizados (entrada/salida y ganancias)",
      icon: <List className="w-8 h-8 text-green-500" />,
      action: () => navigate("/procedimientos/listado"),
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Reportes",
      description: "Cierre mensual: ingreso total, egresos (diezmo, materiales, movilidad, laboratorio) y saldo final",
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      action: () => navigate("/procedimientos/reportes"),
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procedimientos de Enfermería</h1>
          <p className="text-gray-600 mt-1">
            Catálogo de procedimientos y registro de atenciones
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <X className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`p-6 cursor-pointer transition-colors ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {card.icon}
              <div>
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
