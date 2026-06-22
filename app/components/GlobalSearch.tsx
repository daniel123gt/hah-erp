"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  FileText,
  Home,
  Calendar,
  CalendarPlus,
  FlaskConical,
  Building2,
  Clock,
  Package,
  BarChart3,
  ClipboardList,
  History,
  ChevronLeft,
} from "lucide-react";
import { patientsService } from "~/services/patientsService";
import { staffService } from "~/services/staffService";
import labOrderService from "~/services/labOrderService";
import { procedureService } from "~/services/procedureService";
import { homeCareService } from "~/services/homeCareService";
import { normalizeSearchText, formatDateOnly } from "~/lib/utils";

type Icon = typeof Home;
type PatientLite = { id: string; name: string; dni?: string; district?: string };
type StaffLite = { id: string; name: string; position: string; department?: string };
type OrderLite = { id: string; order_date: string; sample_date?: string | null; status: string; physician_name?: string | null };
type ProcLite = { id: string; fecha: string; patient_name?: string | null; procedure_name?: string | null };
type ContractLite = { patient_id: string; name: string; plan?: string | null };
type LinkItem = { label: string; to: string; icon: Icon };
type RecentItem = { to: string; label: string; kind: "patient" | "order" | "proc" | "contract" };

const RECENTS_KEY = "hah-recent-search";
const RECENT_ICON: Record<RecentItem["kind"], Icon> = {
  patient: Users,
  order: FileText,
  proc: ClipboardList,
  contract: Building2,
};

const ACTIONS: LinkItem[] = [
  { label: "Nuevo paciente", to: "/pacientes?nuevo=1", icon: UserPlus },
  { label: "Nueva cita médica", to: "/citas/medicina?nuevo=1", icon: CalendarPlus },
  { label: "Nueva cita de procedimiento", to: "/citas/procedimientos?nuevo=1", icon: CalendarPlus },
  { label: "Nueva cita de RX / Ecografía", to: "/citas/rx-ecografias?nuevo=1", icon: CalendarPlus },
  { label: "Nueva orden de laboratorio", to: "/laboratorio/seleccionar", icon: FlaskConical },
  { label: "Registrar turno", to: "/cuidados-por-turnos?nuevo=1", icon: Clock },
  { label: "Nuevo empleado", to: "/personal?nuevo=1", icon: UserPlus },
];

const QUICK_LINKS: LinkItem[] = [
  { label: "Inicio", to: "/", icon: Home },
  { label: "Pacientes", to: "/pacientes", icon: Users },
  { label: "Citas", to: "/citas", icon: Calendar },
  { label: "Laboratorio · Órdenes", to: "/laboratorio/ordenes", icon: FlaskConical },
  { label: "Procedimientos", to: "/procedimientos/listado", icon: ClipboardList },
  { label: "Cuidados en casa", to: "/cuidados-en-casa", icon: Building2 },
  { label: "Cuidados por turnos", to: "/cuidados-por-turnos", icon: Clock },
  { label: "Personal", to: "/personal", icon: UserCheck },
  { label: "Inventario", to: "/inventario", icon: Package },
  { label: "Reportes", to: "/reportes", icon: BarChart3 },
];

function staffDestination(department?: string): string {
  const dep = (department ?? "").toLowerCase();
  if (dep.includes("enfermer")) return "/personal/enfermeria";
  if (dep.includes("medic")) return "/personal/medicina";
  if (dep.includes("admin")) return "/personal/administracion";
  return "/personal";
}

function loadRecents(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [procs, setProcs] = useState<ProcLite[]>([]);
  const [contracts, setContracts] = useState<ContractLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  /** Drill-down: si está set, se muestran las sub-acciones de ese paciente. */
  const [patientPage, setPatientPage] = useState<PatientLite | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Al abrir, cargar recientes y limpiar estado de navegación interna.
  useEffect(() => {
    if (open) {
      setRecents(loadRecents());
      setPatientPage(null);
      setQuery("");
    }
  }, [open]);

  // Búsqueda en servidor (con debounce).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setPatients([]);
      setStaff([]);
      setOrders([]);
      setProcs([]);
      setContracts([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const nq = normalizeSearchText(q);
    const t = setTimeout(() => {
      Promise.all([
        patientsService.getPatients({ search: q, limit: 6 }).catch(() => ({ data: [] })),
        staffService.getStaff({ search: q, limit: 6 }).catch(() => ({ data: [] })),
        labOrderService.getAllOrders({ search: q, limit: 6 }).catch(() => ({ data: [] })),
        procedureService.getRecords({ search: q, limit: 6 }).catch(() => ({ data: [] })),
        homeCareService.getContracts().catch(() => []),
      ])
        .then(([p, s, o, pr, ct]) => {
          if (!active) return;
          setPatients((p?.data ?? []) as PatientLite[]);
          setStaff((s?.data ?? []) as StaffLite[]);
          setOrders((o?.data ?? []) as OrderLite[]);
          setProcs((pr?.data ?? []) as ProcLite[]);
          const matchedContracts = (ct ?? [])
            .filter((c) => {
              const name = Array.isArray(c.patient) ? c.patient[0]?.name : c.patient?.name;
              return name && normalizeSearchText(name).includes(nq);
            })
            .slice(0, 6)
            .map((c) => {
              const name = Array.isArray(c.patient) ? c.patient[0]?.name : c.patient?.name;
              return { patient_id: c.patient_id, name: name ?? "—", plan: c.plan_nombre };
            });
          setContracts(matchedContracts as ContractLite[]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const pushRecent = useCallback((item: RecentItem) => {
    if (typeof window === "undefined") return;
    try {
      const cur = loadRecents().filter((r) => r.to !== item.to);
      const next = [item, ...cur].slice(0, 8);
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const go = useCallback(
    (to: string, recent?: RecentItem) => {
      if (recent) pushRecent(recent);
      setOpen(false);
      setQuery("");
      setPatientPage(null);
      navigate(to);
    },
    [navigate, pushRecent]
  );

  const q = query.trim();
  const nq = normalizeSearchText(q);
  const matchLabel = useCallback((label: string) => !nq || normalizeSearchText(label).includes(nq), [nq]);
  const filteredActions = useMemo(() => ACTIONS.filter((a) => matchLabel(a.label)), [matchLabel]);
  const filteredLinks = useMemo(() => QUICK_LINKS.filter((l) => matchLabel(l.label)), [matchLabel]);

  const showRecents = q.length < 2 && recents.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full max-w-xs"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Buscar o ir a…</span>
        <kbd className="hidden sm:inline-flex items-center rounded border bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Búsqueda</DialogTitle>
          </DialogHeader>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5"
          >
            <CommandInput
              placeholder={patientPage ? `Acciones para ${patientPage.name}…` : "Buscar paciente, personal, orden, procedimiento… o una acción"}
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && query === "" && patientPage) {
                  e.preventDefault();
                  setPatientPage(null);
                }
              }}
            />
            <CommandList className="max-h-[440px]">
              {/* ===== Drill-down: sub-acciones de un paciente ===== */}
              {patientPage ? (
                <CommandGroup heading={patientPage.name}>
                  <CommandItem value="back" onSelect={() => setPatientPage(null)}>
                    <ChevronLeft className="mr-2 h-4 w-4 text-gray-500" />
                    Volver
                  </CommandItem>
                  <CommandItem
                    value="ver-ficha"
                    onSelect={() => go(`/pacientes/${patientPage.id}`, { to: `/pacientes/${patientPage.id}`, label: patientPage.name, kind: "patient" })}
                  >
                    <Users className="mr-2 h-4 w-4 text-primary-blue" />
                    Ver ficha del paciente
                  </CommandItem>
                  <CommandItem value="cuidado-casa" onSelect={() => go(`/cuidados-en-casa/${patientPage.id}`)}>
                    <Building2 className="mr-2 h-4 w-4 text-purple-500" />
                    Cuidado en casa
                  </CommandItem>
                  <CommandItem value="nueva-orden" onSelect={() => go(`/laboratorio/seleccionar`)}>
                    <FlaskConical className="mr-2 h-4 w-4 text-cyan-600" />
                    Nueva orden de laboratorio
                  </CommandItem>
                  <CommandItem value="nueva-cita" onSelect={() => go(`/citas/medicina?nuevo=1`)}>
                    <CalendarPlus className="mr-2 h-4 w-4 text-blue-600" />
                    Nueva cita médica
                  </CommandItem>
                </CommandGroup>
              ) : (
                <>
                  {!loading &&
                    q.length >= 2 &&
                    patients.length === 0 &&
                    staff.length === 0 &&
                    orders.length === 0 &&
                    procs.length === 0 &&
                    contracts.length === 0 &&
                    filteredActions.length === 0 &&
                    filteredLinks.length === 0 && <CommandEmpty>Sin resultados.</CommandEmpty>}

                  {loading && q.length >= 2 && (
                    <div className="px-3 py-3 text-sm text-muted-foreground">Buscando…</div>
                  )}

                  {showRecents && (
                    <CommandGroup heading="Recientes">
                      {recents.map((r) => {
                        const RIcon = RECENT_ICON[r.kind];
                        return (
                          <CommandItem key={`rec-${r.to}`} value={`rec-${r.to}`} onSelect={() => go(r.to)}>
                            <History className="mr-2 h-4 w-4 text-gray-400" />
                            <RIcon className="mr-2 h-4 w-4 text-gray-500" />
                            <span className="uppercase">{r.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}

                  {patients.length > 0 && (
                    <CommandGroup heading="Pacientes">
                      {patients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`pac-${p.id}`}
                          onSelect={() => {
                            setPatientPage(p);
                            setQuery("");
                          }}
                        >
                          <Users className="mr-2 h-4 w-4 text-primary-blue" />
                          <span className="uppercase">{p.name}</span>
                          {p.dni && <span className="ml-2 text-xs text-muted-foreground">DNI {p.dni}</span>}
                          <ChevronLeft className="ml-auto h-4 w-4 rotate-180 text-gray-300" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {staff.length > 0 && (
                    <CommandGroup heading="Personal">
                      {staff.map((s) => (
                        <CommandItem key={s.id} value={`stf-${s.id}`} onSelect={() => go(staffDestination(s.department))}>
                          <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                          <span className="uppercase">{s.name}</span>
                          {s.position && <span className="ml-2 text-xs text-muted-foreground">{s.position}</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {orders.length > 0 && (
                    <CommandGroup heading="Órdenes de laboratorio">
                      {orders.map((o) => (
                        <CommandItem
                          key={o.id}
                          value={`ord-${o.id}`}
                          onSelect={() =>
                            go(`/laboratorio/ordenes/${o.id}`, { to: `/laboratorio/ordenes/${o.id}`, label: `Orden ${o.id.slice(0, 8)}`, kind: "order" })
                          }
                        >
                          <FileText className="mr-2 h-4 w-4 text-cyan-600" />
                          <span>Orden {o.id.slice(0, 8)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatDateOnly(o.order_date)} · {o.status}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {procs.length > 0 && (
                    <CommandGroup heading="Procedimientos">
                      {procs.map((pr) => (
                        <CommandItem
                          key={pr.id}
                          value={`prc-${pr.id}`}
                          onSelect={() =>
                            go(`/procedimientos/listado/${pr.id}`, {
                              to: `/procedimientos/listado/${pr.id}`,
                              label: `${pr.procedure_name ?? "Procedimiento"} · ${pr.patient_name ?? ""}`.trim(),
                              kind: "proc",
                            })
                          }
                        >
                          <ClipboardList className="mr-2 h-4 w-4 text-green-600" />
                          <span>{pr.procedure_name ?? "Procedimiento"}</span>
                          {pr.patient_name && <span className="ml-2 text-xs text-muted-foreground uppercase">{pr.patient_name}</span>}
                          <span className="ml-auto text-xs text-muted-foreground">{formatDateOnly(pr.fecha)}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {contracts.length > 0 && (
                    <CommandGroup heading="Cuidado en casa">
                      {contracts.map((c) => (
                        <CommandItem
                          key={`ct-${c.patient_id}`}
                          value={`ct-${c.patient_id}`}
                          onSelect={() =>
                            go(`/cuidados-en-casa/${c.patient_id}`, { to: `/cuidados-en-casa/${c.patient_id}`, label: c.name, kind: "contract" })
                          }
                        >
                          <Building2 className="mr-2 h-4 w-4 text-purple-500" />
                          <span className="uppercase">{c.name}</span>
                          {c.plan && <span className="ml-2 text-xs text-muted-foreground">{c.plan}</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredActions.length > 0 && (
                    <CommandGroup heading="Acciones">
                      {filteredActions.map((a) => (
                        <CommandItem key={a.to + a.label} value={`act-${a.label}`} onSelect={() => go(a.to)}>
                          <a.icon className="mr-2 h-4 w-4 text-gray-500" />
                          {a.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredLinks.length > 0 && (
                    <CommandGroup heading="Ir a">
                      {filteredLinks.map((l) => (
                        <CommandItem key={l.to} value={`lnk-${l.to}`} onSelect={() => go(l.to)}>
                          <l.icon className="mr-2 h-4 w-4 text-gray-500" />
                          {l.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
