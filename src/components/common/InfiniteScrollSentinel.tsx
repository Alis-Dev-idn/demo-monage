import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollSentinelProps {
  /** Apakah masih ada data untuk dimuat. Sentinel hidden saat false. */
  hasMore: boolean;
  /** Sedang loading batch berikutnya. Tampilkan spinner; jangan trigger lagi. */
  isLoading: boolean;
  /** Dipanggil saat sentinel masuk viewport. */
  onLoadMore: () => void;
  /** Root margin IntersectionObserver — default "200px" agar prefetch sebelum sentinel benar-benar terlihat. */
  rootMargin?: string;
  /** Label tombol fallback manual (kalau auto-trigger gagal / user keyboard-only). */
  manualLabel?: string;
}

/**
 * Sentinel infinite scroll yang otomatis memanggil `onLoadMore` saat masuk
 * viewport. Pakai IntersectionObserver — efisien, tidak butuh listener scroll.
 *
 * Tambahan: fallback button manual untuk aksesibilitas (user yang tidak
 * scroll dengan mouse/touch, atau kalau JS observer gagal di browser lama).
 */
export function InfiniteScrollSentinel({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "200px",
  manualLabel = "Muat lebih banyak",
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex flex-col items-center justify-center gap-2 py-4">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 size={14} className="animate-spin" />
          Memuat data berikutnya…
        </div>
      ) : (
        <button
          type="button"
          onClick={onLoadMore}
          className="rounded-md px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        >
          {manualLabel}
        </button>
      )}
    </div>
  );
}
