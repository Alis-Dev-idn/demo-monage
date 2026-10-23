import { useCallback, useMemo, useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox, ListBox, GroupRow } from "@dep/ui/card";
import { useTransactionList } from "@/hooks/useTransactions";
import { useBookPermission } from "@/hooks/useBookPermission";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { FilterChips } from "@/components/transactions/FilterChips";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { EmptyState } from "@/components/common/EmptyState";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { ReadOnlyBanner } from "@/components/common/ReadOnlyBanner";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { GroupTotalsBadge } from "@/components/transactions/GroupTotalsBadge";
import { formatDate } from "@/utils/format";
import { groupTotals } from "@/utils/transactionTotals";
import type { Transaction, TransactionFilter, TransactionType } from "@/types";

/**
 * Batch size kecil agar awal page load ringan & bertahap.
 * Backend tetap support `?size=...` untuk override.
 */
const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "in", label: "Masuk" },
  { value: "out", label: "Keluar" },
  { value: "transfer", label: "Transfer" },
];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Pisahkan transaksi satuan (manual) dari transaksi otomatis Perencanaan (#1.2).
 * Transaksi `source==="plan"` dikelompokkan per perencanaan (planId) agar tidak
 * bercampur dengan transaksi yang diinput user.
 */
function splitByPlan(list: Transaction[]): {
  manual: Transaction[];
  plans: Array<{ planId: string; planName: string; txs: Transaction[] }>;
} {
  const manual: Transaction[] = [];
  const byPlan = new Map<string, { planName: string; txs: Transaction[] }>();
  for (const tx of list) {
    const ref = tx.source === "plan" ? tx.planRef : undefined;
    if (ref) {
      const entry = byPlan.get(ref.planId) ?? { planName: ref.planName, txs: [] };
      entry.txs.push(tx);
      byPlan.set(ref.planId, entry);
    } else {
      manual.push(tx);
    }
  }
  return {
    manual,
    plans: Array.from(byPlan.entries()).map(([planId, v]) => ({
      planId,
      planName: v.planName,
      txs: v.txs,
    })),
  };
}

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { canWrite } = useBookPermission();
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  // Default: hanya grup tanggal teratas yang terbuka, sisanya tertutup (#M2).
  // `openOverride` menyimpan keputusan manual user per grup; bila tidak ada,
  // pakai default (grup pertama = terbuka). Baris transaksi hanya dirender saat
  // grupnya terbuka, jadi data baru "dimuat" ke DOM ketika dibuka.
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((key: string, defaultOpen: boolean) => {
    setOpenOverride((prev) => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) }));
  }, []);

  const filter: TransactionFilter = useMemo(
    () => ({
      type: typeFilter || undefined,
      search: search || undefined,
      size: PAGE_SIZE,
    }),
    [typeFilter, search],
  );

  const { data, meta, isLoading, isFetchingMore, error, refetch, loadMore, hasMore } =
    useTransactionList(filter);

  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  // Setor/tarik tabungan kini transaksi nyata (ber-`savingId`) — sudah ikut di
  // `data`, jadi tak perlu merge entri virtual lagi.
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of data) {
      const key = dayKey(tx.occurredAt);
      const list = map.get(key) ?? [];
      list.push(tx);
      map.set(key, list);
    }
    // Dalam satu hari: terbaru → terlama (berdasarkan waktu dibuat). `occurredAt`
    // kini date-only (UTC midnight) jadi pakai `createdAt` untuk urutan.
    for (const list of map.values()) {
      list.sort((a, b) =>
        (b.createdAt ?? b.occurredAt).localeCompare(a.createdAt ?? a.occurredAt),
      );
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [data]);

  return (
    <div className="space-y-5 p-4 pb-32 sm:p-6">
      <ReadOnlyBanner />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Riwayat Transaksi</h1>
          <p className="text-sm text-neutral-500">
            Semua pemasukan, pengeluaran, dan transfer Anda di satu tempat.
          </p>
        </div>
        {canWrite && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate("/dashboard/transactions/new")}
          >
            Catat Transaksi
          </Button>
        )}
      </header>

      <div className="space-y-2">
        <DebouncedSearch
          value={search}
          onChange={setSearch}
          placeholder="Cari catatan transaksi…"
        />
        <FilterChips
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as "" | TransactionType)}
        />
      </div>

      {isLoading && data.length === 0 && (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {error && data.length === 0 && (
        <InfoBox
          variant="error"
          title="Gagal memuat transaksi"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetch() }}
        />
      )}

      {!isLoading && data.length === 0 && !error && (
        <EmptyState
          icon="ReceiptText"
          title="Belum ada transaksi"
          description="Catat transaksi pertama Anda untuk mulai melihat ringkasan keuangan."
          actionLabel="Catat Transaksi"
          onAction={() => navigate("/dashboard/transactions/new")}
        />
      )}

      {grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(([key, list], index) => {
            const defaultOpen = index === 0;
            const isCollapsed = !(openOverride[key] ?? defaultOpen);
            const totals = groupTotals(list);
            return (
              <ListBox key={key} variant="outlined" pad="none">
                <GroupRow
                  title={formatDate(`${key}T00:00:00.000Z`, "long")}
                  meta={`${list.length} transaksi`}
                  trailing={<GroupTotalsBadge {...totals} />}
                  onClick={() => toggleGroup(key, defaultOpen)}
                  className={`[&_svg]:transition-transform [&_svg]:duration-200 ${
                    isCollapsed ? "" : "[&_svg]:rotate-90"
                  }`}
                />
                {!isCollapsed && (() => {
                  const { manual, plans } = splitByPlan(list);
                  return (
                    <div className="divide-y divide-neutral-100">
                      {manual.map((tx) => (
                        <TransactionRow
                          key={tx._id}
                          transaction={tx}
                          onClick={setSelected}
                        />
                      ))}
                      {plans.map((p) => (
                        <div key={p.planId}>
                          <div className="flex items-center gap-2 bg-emerald-50/60 px-4 py-1.5">
                            <CalendarRange size={13} className="text-emerald-600" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              Perencanaan · {p.planName}
                            </span>
                            <span className="ml-auto text-[11px] text-emerald-700/70">
                              {p.txs.length} transaksi
                            </span>
                          </div>
                          <div className="divide-y divide-neutral-100">
                            {p.txs.map((tx) => (
                              <TransactionRow
                                key={tx._id}
                                transaction={tx}
                                onClick={setSelected}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </ListBox>
            );
          })}

          <InfiniteScrollSentinel
            hasMore={hasMore}
            isLoading={isFetchingMore}
            onLoadMore={handleLoadMore}
          />

          {meta && (
            <p className="text-center text-xs text-neutral-400">
              Menampilkan {data.length} dari {meta.total} transaksi
            </p>
          )}
        </div>
      )}

      {canWrite && <FloatingActionButton
        onClick={() => navigate("/dashboard/transactions/new")}
        label="Catat transaksi"
        menuItems={[
          {
            label: "Uang Keluar",
            icon: <Plus size={16} className="text-orange-500" />,
            onClick: () => navigate("/dashboard/transactions/new?type=out"),
          },
          {
            label: "Uang Masuk",
            icon: <Plus size={16} className="text-emerald-500" />,
            onClick: () => navigate("/dashboard/transactions/new?type=in"),
          },
          {
            label: "Transfer",
            icon: <Plus size={16} className="text-blue-500" />,
            onClick: () => navigate("/dashboard/transactions/new?type=transfer"),
          },
        ]}
      />}

      <TransactionDetailModal
        transaction={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default TransactionsPage;
