import { useNavigate } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PERSONAL_CATEGORIES } from "./categories";
import { HeartPulse, Stethoscope, Briefcase, X } from "lucide-react";

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
    </div>
  );
}
