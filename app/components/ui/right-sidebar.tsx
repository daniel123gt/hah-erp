import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { ArrowUpDown, User, Calendar, Hash, DollarSign } from "lucide-react";
import { useAuthStore } from "~/store/authStore";
import { useNavigate } from "react-router";

interface Quote {
  code: string;
  amount: string;
}

const recentQuotes: Quote[] = [
  { code: "GF8934", amount: "2000s/" },
  { code: "BG1234", amount: "500s/" },
  { code: "FR12123", amount: "2400s/" },
];

export function RightSidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateQuote = () => {
    navigate('/cotizaciones');
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6">
      {/* Perfil del Usuario */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-blue">
            Perfil del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16" fallback={(user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}>
              <AvatarImage src="/avatar-placeholder.png" alt="Avatar" />
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.user_metadata?.full_name || "Usuario"}
              </h3>
              <Badge variant="secondary" className="bg-accent-blue text-white">
                Administrador
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Ingreso {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "Fecha no disponible"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Hash className="w-4 h-4" />
              <span>Código de empleado {user?.id?.slice(-8) || "N/A"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Últimas Cotizaciones */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-primary-blue">
            Últimas Cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentQuotes.map((quote, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{quote.code}</span>
              <span className="font-semibold text-primary-blue">{quote.amount}</span>
            </div>
          ))}
          
          <Button 
            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white mt-4"
            onClick={handleCreateQuote}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Realizar Cotización
          </Button>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <h4 className="font-medium text-blue-800">Health At Home ERP</h4>
            <p className="text-xs text-blue-600">v1.0.0 - Sistema de Gestión</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
