import { Skeleton } from "~/components/ui/skeleton";

/** Placeholder de carga para tablas/listas (en vez de un spinner). */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={c === 0 ? "h-5 flex-1" : "h-5 w-24 shrink-0"} />
          ))}
        </div>
      ))}
    </div>
  );
}
