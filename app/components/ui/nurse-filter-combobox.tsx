"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Star } from "lucide-react";
import { cn, normalizeSearchText } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

const FAVORITES_KEY = "hah:nurse-favorites";

/** Favoritos de enfermeras (compartidos entre filtros), persistidos por usuario en el navegador. */
export function useNurseFavorites() {
  const [favorites, setFavorites] = React.useState<string[]>([]);

  // Cargar desde localStorage tras montar (evita desajustes de SSR).
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = React.useCallback((name: string) => {
    setFavorites((prev) => {
      const next = prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name];
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { favorites, toggle };
}

interface NurseFilterComboboxProps {
  /** Nombres de enfermeras seleccionables. */
  nurses: string[];
  /** Conteo de procedimientos por enfermera (para ordenar de mayor a menor). */
  counts?: Record<string, number>;
  /** Enfermera seleccionada (o `allValue` para "todas"). */
  value: string;
  onValueChange: (value: string) => void;
  /** Etiqueta de la opción "todas". */
  allLabel?: string;
  /** Valor de la opción "todas". */
  allValue?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Filtro de enfermera tipo combobox (con búsqueda) que:
 *  - ordena por cantidad de procedimientos (de mayor a menor),
 *  - permite marcar favoritas con una estrella para anclarlas arriba (varias),
 *  - comparte favoritos entre todos los filtros (localStorage).
 */
export function NurseFilterCombobox({
  nurses,
  counts = {},
  value,
  onValueChange,
  allLabel = "Todas las enfermeras",
  allValue = "",
  placeholder = "Buscar enfermera...",
  className,
}: NurseFilterComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { favorites, toggle } = useNurseFavorites();

  const ordered = React.useMemo(() => {
    const uniq = Array.from(new Set(nurses.map((n) => (n ?? "").trim()).filter(Boolean)));
    const favSet = new Set(favorites);
    return uniq.sort((a, b) => {
      const fa = favSet.has(a) ? 1 : 0;
      const fb = favSet.has(b) ? 1 : 0;
      if (fa !== fb) return fb - fa; // favoritas primero
      const ca = counts[a] ?? 0;
      const cb = counts[b] ?? 0;
      if (cb !== ca) return cb - ca; // más procedimientos primero
      return a.localeCompare(b);
    });
  }, [nurses, favorites, counts]);

  const selectedLabel = value && value !== allValue ? value : null;

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
            !selectedLabel && "text-muted-foreground",
            className
          )}
        >
          <span className={cn("truncate", selectedLabel && "uppercase")}>
            {selectedLabel ?? allLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Command shouldFilter={true}>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>Sin enfermeras.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel}
                onSelect={() => handleSelect(allValue)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === allValue ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
              {ordered.map((name) => {
                const isFav = favorites.includes(name);
                const count = counts[name] ?? 0;
                return (
                  <CommandItem
                    key={name}
                    value={`${name} ${normalizeSearchText(name)}`}
                    onSelect={() => handleSelect(name)}
                    className="uppercase"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{name}</span>
                    {count > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground tabular-nums normal-case">
                        {count}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={isFav ? "Quitar de favoritos" : "Marcar como favorito"}
                      className="ml-2 p-0.5 rounded hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(name);
                      }}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          isFav ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    </button>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
