import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Car, X, Wallet } from "lucide-react";
import { expensesService } from "~/services/expensesService";

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

export default function EgresosDashboard() {
  const navigate = useNavigate();
  const [movilidadMonth, setMovilidadMonth] = useState(0);

  useEffect(() => {
    const { from, to } = getMonthRange();
    expensesService
      .getTotal({ category: "movilidad", fromDate: from, toDate: to })
      .then(setMovilidadMonth)
      .catch(() => setMovilidadMonth(0));
  }, []);

  const cards = [
    {
      title: "Movilidad",
      description: "Taxis, combustible, mantenimiento del vehículo y otros gastos de movilidad",
      icon: <Car className="w-8 h-8 text-blue-500" />,
      action: () => navigate("/egresos/movilidad"),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-blue" />
            Egresos
          </h1>
          <p className="text-gray-600 mt-1">Registro de gastos de la empresa</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <X className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Movilidad — este mes (S/.)</p>
              <p className="text-2xl font-bold text-red-600">S/ {movilidadMonth.toFixed(2)}</p>
            </div>
            <Car className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
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
