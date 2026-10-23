import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Boxes, History, Package, Pencil, Plus } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { confirm } from "@dep/ui/confirm";
import { ModalShell } from "@/components/common/ModalShell";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatCurrency, formatDate } from "@/utils/format";
import { archiveProduct, fetchMovements, fetchProducts } from "@/services/business.service";
import type { Product, StockMovement } from "@/types";

const ProductsPage = () => {
  const navigate = useNavigate();
  const [historyOf, setHistoryOf] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  // Search server-side + paginasi (#J): fetcher berubah saat search → reset.
  const fetchPage = useCallback(
    (opts: { limit: number; offset: number }) =>
      fetchProducts({ search: search || undefined, ...opts }),
    [search],
  );
  const { items: products, loading, loadingMore, hasMore, error, loadMore, reset } =
    usePaginatedList<Product>(fetchPage);

  useEffect(() => {
    if (error) notify.error(error.message);
  }, [error]);
  const load = reset;

  const handleArchive = async (p: Product) => {
    const ok = await confirm({
      title: `Arsipkan "${p.name}"?`,
      message: "Produk diarsipkan; data penjualan historis tetap utuh.",
      confirmLabel: "Arsipkan",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await archiveProduct(p._id);
      notify.success("Produk diarsipkan.");
      void load();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    }
  };

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Produk & Stok</h1>
          <p className="text-sm text-neutral-500">Kelola produk, harga, dan stok (barang masuk/keluar).</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => navigate("/dashboard/products/new")}>
          Produk Baru
        </Button>
      </header>

      <DebouncedSearch value={search} onChange={setSearch} placeholder="Cari produk / SKU…" />

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat…</p>
      ) : products.length === 0 ? (
        <EmptyState
          icon="Package"
          title="Belum ada produk"
          description="Tambahkan produk pertama untuk mulai berjualan."
          actionLabel="Produk Baru"
          onAction={() => navigate("/dashboard/products/new")}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <tr>
                <th className="p-3">Produk</th>
                <th className="p-3 text-right">Harga Jual</th>
                <th className="p-3 text-right">HPP</th>
                <th className="p-3 text-right">Stok</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-300">
                          <Package size={16} />
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-neutral-900">{p.name}</div>
                        {p.sku && <div className="text-xs text-neutral-400">{p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">{formatCurrency(p.sellPrice)}</td>
                  <td className="p-3 text-right text-neutral-500">{formatCurrency(p.costPrice)}</td>
                  <td className="p-3 text-right">
                    {p.trackStock ? (
                      <span className={p.stockQty <= 5 ? "font-semibold text-rose-600" : ""}>
                        {p.stockQty} {p.unit}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">non-stok</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {p.trackStock && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Boxes size={12} />}
                          onClick={() => navigate(`/dashboard/products/${p._id}/stock`)}
                        >
                          Stok
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" leftIcon={<History size={12} />} onClick={() => setHistoryOf(p)}>
                        Riwayat
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Pencil size={12} />}
                        onClick={() => navigate(`/dashboard/products/${p._id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" leftIcon={<Archive size={12} />} onClick={() => void handleArchive(p)}>
                        Arsip
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InfiniteScrollSentinel hasMore={hasMore} isLoading={loadingMore} onLoadMore={() => void loadMore()} />
        </div>
      )}

      {historyOf && <HistoryModal product={historyOf} onClose={() => setHistoryOf(null)} />}
    </div>
  );
};

const MOVE_LABEL: Record<string, string> = {
  in: "Masuk",
  out: "Keluar",
  adjust: "Set stok",
  sale: "Terjual",
  return: "Retur",
};
const MOVE_STYLE: Record<string, string> = {
  in: "text-emerald-700",
  return: "text-emerald-700",
  out: "text-rose-600",
  sale: "text-rose-600",
  adjust: "text-neutral-600",
};

function HistoryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [moves, setMoves] = useState<StockMovement[] | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchMovements(product._id)
      .then((m) => alive && setMoves(m))
      .catch(() => alive && setMoves([]));
    return () => {
      alive = false;
    };
  }, [product._id]);

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalShell icon={<History size={20} />} title={`Riwayat Stok — ${product.name}`}>
        {!moves ? (
          <p className="py-6 text-center text-sm text-neutral-500">Memuat…</p>
        ) : moves.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">Belum ada pergerakan stok.</p>
        ) : (
          <div className="max-h-96 divide-y divide-neutral-100 overflow-y-auto">
            {moves.map((m) => (
              <div key={m._id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className={`text-sm font-medium ${MOVE_STYLE[m.type] ?? "text-neutral-700"}`}>
                    {MOVE_LABEL[m.type] ?? m.type}
                    {m.type === "adjust" ? ` → ${m.qty}` : ` ${m.qty} ${product.unit}`}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {formatDate(m.occurredAt, "long")}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </div>
                </div>
                {m.unitCost != null && m.unitCost > 0 && (
                  <div className="text-right text-xs text-neutral-500">@ {formatCurrency(m.unitCost)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </ModalShell>
    </Modal>
  );
}

export default ProductsPage;
