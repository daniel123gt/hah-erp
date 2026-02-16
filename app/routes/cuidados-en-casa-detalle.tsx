import CuidadosEnCasaDetalle from "~/dashboard/cuidados-en-casa/Detalle";

export function meta() {
  return [
    { title: "Detalle cuidado en casa - Health At Home ERP" },
    { name: "description", content: "Detalle del servicio de cuidado en casa del paciente" },
  ];
}

export default function CuidadosEnCasaDetalleRoute() {
  return <CuidadosEnCasaDetalle />;
}
