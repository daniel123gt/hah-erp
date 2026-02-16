import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Calendar, Stethoscope, HeartPulse, ArrowLeft } from "lucide-react";

export default function CitasHome() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Citas Procedimientos",
      description: "Agenda de citas a domicilio con enfermeras (procedimientos de enfermería)",
      icon: <HeartPulse className="w-8 h-8 text-green-600" />,
      action: () => navigate("/citas/procedimientos"),
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Citas Medicina",
      description: "Agenda de citas a domicilio con médicos (consultas y seguimiento)",
      icon: <Stethoscope className="w-8 h-8 text-blue-600" />,
      action: () => navigate("/citas/medicina"),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Citas
          </h1>
          <p className="text-gray-600 mt-2">
            Todos los servicios son a domicilio. Elige el tipo de agenda:
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`p-8 cursor-pointer transition-colors border-2 ${card.color}`}
            onClick={card.action}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {card.icon}
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{card.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); card.action(); }}>
                Ir a agenda
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
