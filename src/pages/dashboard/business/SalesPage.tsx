import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Printer, Receipt, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { confirm } from "@dep/ui/confirm";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatCurrency, formatDate } from "@/utils/format";
import { fetchReceipt, fetchSales, voidSale } from "@/services/business.service";
import { ReceiptView, type ReceiptMeta } from "@/components/business/Receipt";
import { printReceipt } from "@/components/business/printReceipt";
import type { Sale } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  void: "bg-neutral-200 text-neutral-600",
  failed: "bg-rose-100 text-rose-700",
  draft: "bg-neutral-100 text-neutral-500",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  pending: "Menunggu",
  void: "Dibatalkan",
  failed: "Gagal",
  draft: "Draft",
};

const SalesPage = () => {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  const fetchPage = useCallback(
    (opts: { limit: number; offset: number }) => fetchSales(opts),
    [],
  );
  const { items: sales, loading, loadingMore, hasMore, error, loadMore, reset } =
    usePaginatedList<Sale>(fetchPage);

  useEffect(() => {
    if (error) notify.error(error.message);
  }, [error]);

  const handleVoid = async (s: Sale) => {
    const ok = await confirm({
      title: `Void penjualan ${s.code}?`,
      message: "Stok dikembalikan & pemasukan dibatalkan.",
      confirmLabel: "Void",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await voidSale(s._id);
      notify.success("Penjualan di-void.");
      setDetail(null);
      void reset();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    }
  };

  // Filter (search: kode / nama pelanggan) lalu grup per tanggal (#D).
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? sales.filter(
          (s) =>
            s.code.toLowerCase().includes(q) ||
            (s.customerName ?? "").toLowerCase().includes(q),
        )
      : sales;
    const map = new Map<string, Sale[]>();
    for (const s of filtered) {
      const key = s.occurredAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [sales, search]);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Penjualan</h1>
        <p className="text-sm text-neutral-500">Riwayat order & struk.</p>
      </header>

      <DebouncedSearch value={search} onChange={setSearch} placeholder="Cari kode / nama pelanggan…" />

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat…</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title={search ? "Tidak ada hasil" : "Belum ada penjualan"}
          description={search ? "Coba kata kunci lain." : "Order dari menu Kasir akan muncul di sini."}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([day, list], index) => {
            const open = openDays[day] ?? index === 0;
            const dayTotal = list
              .filter((s) => s.paymentStatus === "paid")
              .reduce((sum, s) => sum + s.total, 0);
            return (
              <div key={day} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenDays((p) => ({ ...p, [day]: !open }))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      size={16}
                      className={`text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`}
                    />
                    <div>
                      <div className="font-medium text-neutral-900">
                        {formatDate(`${day}T00:00:00.000Z`, "long")}
                      </div>
                      <div className="text-xs text-neutral-500">{list.length} order</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">{formatCurrency(dayTotal)}</span>
                </button>
                {open && (
                  <div className="divide-y divide-neutral-100">
                    {list.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => setDetail(s)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-neutral-50"
                      >
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{s.code}</div>
                          <div className="text-xs text-neutral-500">
                            {s.customerName || "—"} · {s.paymentMethod.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[s.paymentStatus] ?? ""}`}>
                            {STATUS_LABEL[s.paymentStatus] ?? s.paymentStatus}
                          </span>
                          <span className="text-sm text-neutral-700">{formatCurrency(s.total)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <InfiniteScrollSentinel
            hasMore={hasMore && !search}
            isLoading={loadingMore}
            onLoadMore={() => void loadMore()}
          />
        </div>
      )}

      {detail && (
        <SaleDetailModal sale={detail} onClose={() => setDetail(null)} onVoid={() => void handleVoid(detail)} />
      )}
    </div>
  );
};

function SaleDetailModal({
  sale,
  onClose,
  onVoid,
}: {
  sale: Sale;
  onClose: () => void;
  onVoid: () => void;
}) {
  const [meta, setMeta] = useState<ReceiptMeta | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchReceipt(sale._id)
      .then((r) => alive && setMeta(r.receipt))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sale._id]);

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <div className="relative p-5">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-neutral-400">
          <X size={18} />
        </button>
        {meta ? (
          <ReceiptView sale={sale} meta={meta} />
        ) : (
          <p className="py-6 text-center text-sm text-neutral-500">Memuat struk…</p>
        )}
        <div className="mt-5 flex gap-2">
          {meta && (
            <Button variant="outline" leftIcon={<Printer size={14} />} onClick={() => printReceipt(sale, meta)}>
              Cetak / Unduh
            </Button>
          )}
          {sale.paymentStatus === "paid" && (
            <Button className="flex-1" variant="danger-outline" leftIcon={<Receipt size={14} />} onClick={onVoid}>
              Void
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default SalesPage;
