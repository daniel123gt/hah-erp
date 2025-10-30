import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // index("routes/home.tsx"),
  route("login", "routes/auth.tsx"),
  // Portal de Pacientes - RUTAS SEPARADAS DEL DASHBOARD
  route('pacientes/laboratorio', 'routes/pacientes-laboratorio.tsx', [
    route('login', 'routes/pacientes-laboratorio-login.tsx'),
    route('mis-examenes', 'routes/pacientes-laboratorio-mis-examenes.tsx'),
    route('examen/:id', 'routes/pacientes-laboratorio-examen-detalle.tsx'),
  ]),
  // Dashboard del ERP - RUTAS PROTEGIDAS PARA STAFF/ADMIN
  route('/', 'routes/dashboard.tsx', [
    index('routes/home.tsx'),
    route('pacientes', 'routes/pacientes.tsx'),
    route('pacientes/:id', 'routes/paciente-detalle.tsx'),
    route('personal', 'routes/personal.tsx'),
    route('citas', 'routes/citas.tsx'),
    route('servicios', 'routes/servicios.tsx'),
    route('cotizaciones', 'routes/cotizaciones.tsx'),
    route('laboratorio', 'routes/laboratorio.tsx'),
    route('laboratorio/seleccionar', 'routes/laboratorio-seleccionar.tsx'),
    route('laboratorio/buscar', 'routes/laboratorio-buscar.tsx'),
    route('laboratorio/reportes', 'routes/laboratorio-reportes.tsx'),
    route('laboratorio/ordenes', 'routes/laboratorio-ordenes.tsx'),
    route('laboratorio/ordenes/:id', 'routes/laboratorio-orden-detalle.tsx'),
    route('enfermeria', 'routes/enfermeria.tsx'),
    route('enfermeria/valoracion-inicial', 'routes/enfermeria-valoracion.tsx'),
    route('enfermeria/valoraciones', 'routes/enfermeria-valoraciones.tsx'),
    route('inventario', 'routes/inventario.tsx'),
    route('facturacion', 'routes/facturacion.tsx'),
    route('reportes', 'routes/reportes.tsx'),
    route('emergencias', 'routes/emergencias.tsx'),
    route('configuracion', 'routes/configuracion.tsx'),
  ]),
] satisfies RouteConfig;
