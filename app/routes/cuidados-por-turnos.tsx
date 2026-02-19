import CuidadosPorTurnosList from "~/dashboard/cuidados-por-turnos/List";

export function meta() {
  return [
    { title: "Cuidados por turnos | Health At Home ERP" },
    { name: "description", content: "Registro de turnos eventuales de cuidado por horas" },
  ];
}

export default function CuidadosPorTurnosRoute() {
  return <CuidadosPorTurnosList />;
}
