import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Infinite scroll generik (#J) untuk list bisnis (penjualan/produk/transfer/
 * audit). `fetcher` menerima `{ limit, offset }` dan mengembalikan satu halaman.
 * `hasMore` ditentukan dari `page.length === limit`. `fetcher` HARUS di-memo
 * (mis. `useCallback`) — perubahan referensinya (mis. saat search berubah)
 * memicu reset ke halaman pertama.
 */
export function usePaginatedList<T>(
  fetcher: (opts: { limit: number; offset: number }) => Promise<T[]>,
  pageSize = 20,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);
  const busyRef = useRef(false);

  const reset = useCallback(async () => {
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const page = await fetcher({ limit: pageSize, offset: 0 });
      setItems(page);
      setHasMore(page.length === pageSize);
      offsetRef.current = page.length;
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Gagal memuat data."));
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [fetcher, pageSize]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetcher({ limit: pageSize, offset: offsetRef.current });
      setItems((prev) => [...prev, ...page]);
      setHasMore(page.length === pageSize);
      offsetRef.current += page.length;
    } catch {
      // diam — biarkan user coba lagi
    } finally {
      setLoadingMore(false);
      busyRef.current = false;
    }
  }, [fetcher, hasMore, pageSize]);

  useEffect(() => {
    void reset();
  }, [reset]);

  return { items, setItems, loading, loadingMore, hasMore, error, loadMore, reset };
}
