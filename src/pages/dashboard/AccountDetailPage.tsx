import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox, ListBox, GroupRow } from "@dep/ui/card";
import { Button } from "@dep/ui/button";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAccountById } from "@/hooks/useLookup";
import { useTransactionList } from "@/hooks/useTransactions";
import { deleteAccount } from "@/hooks/useAccounts";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { AccountBalanceChart } from "@/components/charts/AccountBalanceChart";
import { CurrencyText } from "@/components/common/CurrencyText";
import { EmptyState } from "@/components/common/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { GroupTotalsBadge } from "@/components/transactions/GroupTotalsBadge";
import { formatDate } from "@/utils/format";
import { groupTotals } from "@/utils/transactionTotals";
import { ACCOUNT_TYPE_LABEL } from "@/constants/accountTypes";
import type { Transaction, TransactionType } from "@/types";

const TX_PAGE_SIZE = 10;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

const TYPE_LABEL: Record<TransactionType, string> = {
  in: "Pemasukan",
  out: "Pengeluaran",
  transfer: "Transfer",
};

function parseFilter(value: string | null): TransactionType | undefined {
  if (value === "in" || value === "out" || value === "transfer") return value;
  return undefined;
}

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const account = useAccountById(id);
  const typeFilter = parseFilter(searchParams.get("type"));
  const [search, setSearch] = useState("");
  const {
    data: transactions,
    isLoading,
    isFetchingMore,
    error,
    refetch,
    loadMore,
    hasMore,
  } = useTransactionList({
    accountId: id,
    type: typeFilter,
    search: search || undefined,
    size: TX_PAGE_SIZE,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  // Grup tanggal: default hanya teratas terbuka, sisanya tertutup (#Q2).
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});
  const toggleGroup = useCallback((key: string, defaultOpen: boolean) => {
    setOpenOverride((prev) => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) }));
  }, []);

  // Urutkan terbaru → terlama: occurredAt desc, lalu createdAt desc (occurredAt
  // kini date-only sehingga butuh kunci sekunder agar urutan dalam hari benar).
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const byDate = b.occurredAt.localeCompare(a.occurredAt);
        return byDate !== 0 ? byDate : (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }),
    [transactions],
  );

  // Kelompokkan per hari (terbaru dulu) agar urutan jelas & konsisten dgn
  // halaman Riwayat Transaksi (#P5).
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of sortedTransactions) {
      const k = dayKey(tx.occurredAt);
      const list = map.get(k) ?? [];
      list.push(tx);
      map.set(k, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [sortedTransactions]);

  const clearFilter = () => {
    searchParams.delete("type");
    setSearchParams(searchParams, { replace: true });
  };

  const balanceTrend = useMemo(() => {
    if (!account) return [];
    const sorted = [...transactions].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt),
    );
    let running = account.initialBalance;
    return sorted.map((tx) => {
      if (tx.type === "in" && tx.accountId === account._id) running += tx.amount;
      else if (tx.type === "out" && tx.accountId === account._id) running -= tx.amount;
      else if (tx.type === "transfer") {
        if (tx.fromAccountId === account._id) running -= tx.amount;
        if (tx.toAccountId === account._id) running += tx.amount;
      }
      return { date: tx.occurredAt, balance: running };
    });
  }, [transactions, account]);

  if (!account) {
    return (
      <div className="p-4">
        <InfoBox
          variant="warning"
          title="Dompet tidak ditemukan"
          description="Mungkin sudah dihapus atau tautan tidak valid."
          action={{ label: "Kembali ke daftar", onClick: () => navigate("/dashboard/accounts") }}
        />
      </div>
    );
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Hapus "${account.name}"?`,
      message: "Transaksi terkait juga akan terdampak.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(deleteAccount(account._id), {
        loading: "Menghapus dompet…",
        success: "Dompet dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      navigate("/dashboard/accounts");
    } catch {
      // surfaced via notify
    }
  };

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/accounts")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Semua Dompet
      </button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">{ACCOUNT_TYPE_LABEL[account.type]}</p>
          <h1 className="text-2xl font-semibold text-neutral-900">{account.name}</h1>
          <div className="mt-2">
            <CurrencyText
              amount={account.currentBalance}
              type="neutral"
              size="lg"
              className="text-2xl"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Pencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            variant="danger-outline"
            leftIcon={<Trash2 size={14} />}
            onClick={() => void handleDelete()}
          >
            Hapus
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-neutral-800">Tren Saldo</h2>
        {balanceTrend.length > 0 ? (
          <AccountBalanceChart data={balanceTrend} />
        ) : (
          <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
            Belum ada transaksi pada dompet ini.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">
            Riwayat Transaksi
            {typeFilter && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Filter: {TYPE_LABEL[typeFilter]}
              </span>
            )}
          </h2>
          {typeFilter && (
            <Button size="sm" variant="ghost" onClick={clearFilter}>
              Hapus Filter
            </Button>
          )}
        </div>
        <div className="mb-3">
          <DebouncedSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari transaksi di dompet ini…"
          />
        </div>
        {isLoading && transactions.length === 0 && (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        {error && transactions.length === 0 && (
          <InfoBox
            variant="error"
            title="Gagal memuat transaksi"
            description={error.message}
            action={{ label: "Coba lagi", onClick: () => void refetch() }}
          />
        )}
        {!isLoading && transactions.length === 0 && !error && (
          <EmptyState
            icon="ReceiptText"
            title="Belum ada transaksi"
            description="Catat transaksi pertama untuk dompet ini."
            actionLabel="Catat Transaksi"
            onAction={() => navigate("/dashboard/transactions/new")}
          />
        )}
        {transactions.length > 0 && (
          <>
            <div className="space-y-4">
              {grouped.map(([key, list], index) => {
                const defaultOpen = index === 0;
                const isCollapsed = !(openOverride[key] ?? defaultOpen);
                const totals = groupTotals(list, account._id);
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
                    {!isCollapsed && (
                      <div className="divide-y divide-neutral-100">
                        {list.map((tx) => (
                          <TransactionRow
                            key={tx._id}
                            transaction={tx}
                            showAccount={false}
                            onClick={setSelected}
                          />
                        ))}
                      </div>
                    )}
                  </ListBox>
                );
              })}
            </div>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              isLoading={isFetchingMore}
              onLoadMore={() => void loadMore()}
            />
          </>
        )}
      </section>

      <AccountFormModal
        account={account}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <TransactionDetailModal
        transaction={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default AccountDetailPage;
