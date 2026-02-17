import CuidadosEnCasaList from "~/dashboard/cuidados-en-casa/List";

export function meta() {
  return [
    { title: "Cuidados en casa | Health At Home ERP" },
    { name: "description", content: "Pacientes con servicio de cuidado en casa" },
  ];
}

export default function CuidadosEnCasaRoute() {
  return <CuidadosEnCasaList />;
}
