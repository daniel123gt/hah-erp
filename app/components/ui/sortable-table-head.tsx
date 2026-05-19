import { ArrowDown, ArrowUp } from "lucide-react";
import { TableHead } from "~/components/ui/table";
import { cn } from "~/lib/utils";

export type SortDirection = "asc" | "desc";

interface SortableTableHeadProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}

export function SortableTableHead({
  label,
  active,
  direction,
  onSort,
  className,
}: SortableTableHeadProps) {
  return (
    <TableHead className={cn("select-none", className)}>
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue rounded px-1 -mx-1"
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {active &&
          (direction === "asc" ? (
            <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
          ))}
      </button>
    </TableHead>
  );
}
