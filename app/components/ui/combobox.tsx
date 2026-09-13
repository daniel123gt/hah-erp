"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Opción especial para "ninguno" o "seleccionar" (ej. value: "__none__", label: "Ninguno") */
  emptyOption?: ComboboxOption;
  id?: string;
  className?: string;
  /** Texto cuando no hay resultados al filtrar */
  emptySearchText?: string;
  /** Muestra el valor y las opciones en MAYÚSCULAS (para nombres de pacientes/personal) */
  uppercase?: boolean;
  /**
   * Si se pasa, la búsqueda se delega al padre (server-side): se desactiva el filtrado
   * en cliente y el padre debe proveer las `options` ya filtradas. Útil cuando hay más
   * registros de los que se cargan en memoria.
   */
  onSearchChange?: (search: string) => void;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  disabled = false,
  emptyOption,
  id,
  className,
  emptySearchText = "Sin resultados.",
  uppercase = false,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(() => {
    if (emptyOption) return [emptyOption, ...options];
    return options;
  }, [emptyOption, options]);

  const selectedLabel = React.useMemo(() => {
    if (!value) return null;
    const opt = allOptions.find((o) => o.value === value);
    return opt?.label ?? value;
  }, [value, allOptions]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
            !selectedLabel && "text-muted-foreground",
            className
          )}
        >
          <span className={cn("truncate", uppercase && selectedLabel && "uppercase")}>
            {selectedLabel ?? placeholder}
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
        <Command shouldFilter={!onSearchChange}>
          <CommandInput placeholder={placeholder} onValueChange={onSearchChange} />
          <CommandList>
            <CommandEmpty>{emptySearchText}</CommandEmpty>
            <CommandGroup>
              {allOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${normalizeSearchText(opt.label)}`}
                  onSelect={() => handleSelect(opt.value)}
                  className={cn(uppercase && opt.value !== emptyOption?.value && "uppercase")}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
