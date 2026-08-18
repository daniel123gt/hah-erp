import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Observa un elemento centinela y llama `onLoadMore` cuando entra al viewport
 * (siempre que haya más y no se esté cargando). El observer se re-arma cuando
 * cambia cualquier valor en `deps` (p. ej. el número de elementos visibles), lo
 * que permite seguir cargando si el centinela sigue visible tras cargar un lote.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  { hasMore, loading = false, deps = [] as unknown[] }: { hasMore: boolean; loading?: boolean; deps?: unknown[] }
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onLoadMore);
  cb.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    // IntersectionObserver solo existe en el cliente (no en SSR); useEffect no corre en el server.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) cb.current();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, ...deps]);

  return sentinelRef;
}

/**
 * Renderiza progresivamente un array YA cargado en memoria, de `step` en `step`,
 * con scroll infinito. Para listas server-side (que traen páginas de la BD) usar
 * `useInfiniteScroll` directamente con la lógica de anexado propia.
 *
 * `resetKey` debe cambiar cuando cambian filtros/búsqueda para volver a mostrar
 * los primeros `step`.
 */
export function useProgressiveList<T>(items: T[], step = 20, resetKey?: unknown) {
  const [visibleCount, setVisibleCount] = useState(step);

  useEffect(() => {
    setVisibleCount(step);
  }, [resetKey, step]);

  const total = items.length;
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < total;
  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + step, Math.max(c, total)));
  }, [step, total]);

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, deps: [visibleCount, total] });

  return { visibleItems, hasMore, loadMore, sentinelRef, total, shown: visibleItems.length };
}

export interface InfiniteScrollFooterProps {
  /** Ref al centinela (de `useInfiniteScroll`/`useProgressiveList`). */
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  /** Cargando el siguiente lote (muestra spinner en vez del botón). */
  loading?: boolean;
  onLoadMore: () => void;
  /** Cantidad actualmente mostrada. */
  shown: number;
  /** Total disponible. */
  total: number;
  itemLabel?: string;
}

/** Pie estándar de scroll infinito: centinela + spinner/botón "Cargar más" + conteo. */
export function InfiniteScrollFooter({
  sentinelRef,
  hasMore,
  loading = false,
  onLoadMore,
  shown,
  total,
  itemLabel = "registros",
}: InfiniteScrollFooterProps) {
  if (total === 0) return null;
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex flex-col items-center gap-2">
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {hasMore &&
        (loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando más...
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            Cargar más
          </Button>
        ))}
      <div className="text-sm text-gray-600">
        Mostrando {shown} de {total} {itemLabel}
      </div>
    </div>
  );
}
