import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Boxes,
  PackageMinus,
  PackagePlus,
  Receipt,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { notify } from "@dep/notify";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { fetchBusinessAudit } from "@/services/business.service";
import type { BusinessAudit } from "@/types";

interface ActionMeta {
  label: string;
  icon: LucideIcon;
  className: string;
}

const ACTION_META: Record<string, ActionMeta> = {
  "sale.paid": { label: "Penjualan lunas", icon: Receipt, className: "bg-emerald-50 text-emerald-600" },
  "sale.void": { label: "Penjualan dibatalkan", icon: Undo2, className: "bg-rose-50 text-rose-600" },
  "stock.in": { label: "Stok masuk", icon: PackagePlus, className: "bg-emerald-50 text-emerald-600" },
  "stock.return": { label: "Retur stok", icon: PackagePlus, className: "bg-emerald-50 text-emerald-600" },
  "stock.out": { label: "Stok keluar", icon: PackageMinus, className: "bg-rose-50 text-rose-600" },
  "stock.adjust": { label: "Penyesuaian stok", icon: Boxes, className: "bg-neutral-100 text-neutral-600" },
  "transfer.create": { label: "Transfer dana", icon: ArrowLeftRight, className: "bg-blue-50 text-blue-600" },
  "transfer.reverse": { label: "Transfer dibatalkan", icon: Undo2, className: "bg-rose-50 text-rose-600" },
};

function metaFor(action: string): ActionMeta {
  if (ACTION_META[action]) return ACTION_META[action];
  // Fallback: ubah "domain.aksi" → "Domain aksi".
  const pretty = action.replace(/[._]/g, " ");
  return {
    label: pretty.charAt(0).toUpperCase() + pretty.slice(1),
    icon: ShieldCheck,
    className: "bg-neutral-100 text-neutral-600",
  };
}

const AuditPage = () => {
  const [search, setSearch] = useState("");

  const fetchPage = useCallback(
    (opts: { limit: number; offset: number }) => fetchBusinessAudit(opts),
    [],
  );
  const { items, loading, loadingMore, hasMore, error, loadMore } =
    usePaginatedList<BusinessAudit>(fetchPage);

  useEffect(() => {
    if (error) notify.error(error.message);
  }, [error]);

  // Filter (label/ringkasan) + grup per tanggal (#H).
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (a) =>
            a.summary.toLowerCase().includes(q) ||
            metaFor(a.action).label.toLowerCase().includes(q),
        )
      : items;
    const map = new Map<string, BusinessAudit[]>();
    for (const a of filtered) {
      const key = a.createdAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [items, search]);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Audit</h1>
        <p className="text-sm text-neutral-500">Catatan aksi penting di pembukuan bisnis.</p>
      </header>

      <DebouncedSearch value={search} onChange={setSearch} placeholder="Cari aktivitas…" />

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat…</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="ShieldCheck"
          title={search ? "Tidak ada hasil" : "Belum ada aktivitas"}
          description={search ? "Coba kata kunci lain." : "Penjualan, void, transfer & perubahan stok tercatat di sini."}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([day, list]) => (
            <div key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {formatDate(`${day}T00:00:00.000Z`, "long")}
              </h2>
              <div className="space-y-2">
                {list.map((a) => {
                  const m = metaFor(a.action);
                  const Icon = m.icon;
                  return (
                    <div key={a._id} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.className}`}>
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900">{m.label}</div>
                        <div className="text-xs text-neutral-500">{a.summary}</div>
                      </div>
                      <div className="shrink-0 text-[11px] text-neutral-400">{formatRelativeTime(a.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <InfiniteScrollSentinel
            hasMore={hasMore && !search}
            isLoading={loadingMore}
            onLoadMore={() => void loadMore()}
          />
        </div>
      )}
    </div>
  );
};

export default AuditPage;
