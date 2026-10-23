import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useLookup } from "@/hooks/useLookup";
import { useBookPermission } from "@/hooks/useBookPermission";
import { deleteAccount } from "@/hooks/useAccounts";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { ReadOnlyBanner } from "@/components/common/ReadOnlyBanner";
import { QuotaBanner } from "@/components/common/QuotaBanner";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { CurrencyText } from "@/components/common/CurrencyText";
import { useAccountQuota } from "@/hooks/useSubscription";
import { useBooks } from "@/hooks/useBooks";
import * as accountService from "@/services/account.service";
import { eventBus } from "@/utils/eventBus";
import type { Account, AccountMonthlySummary } from "@/types";

const AccountsPage = () => {
  const navigate = useNavigate();
  const { accounts, isLoading, error, refetchAccounts } = useLookup();
  const { activeBook } = useBooks();
  const { canWrite } = useBookPermission();
  const accountQuota = useAccountQuota(activeBook?._id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<AccountMonthlySummary[]>([]);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await accountService.fetchAccountsSummary();
      setSummary(data);
    } catch {
      // Silent fail — kartu tetap render tanpa chip ringkasan.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
    const offTx = eventBus.on("transaction:changed", () => void loadSummary());
    const offAcc = eventBus.on("account:changed", () => void loadSummary());
    return () => {
      offTx();
      offAcc();
    };
  }, [loadSummary]);

  const summaryByAccount = useMemo(() => {
    const map = new Map<string, AccountMonthlySummary>();
    for (const s of summary) map.set(s.accountId, s);
    return map;
  }, [summary]);

  const biggestExpenseAccountId = useMemo(() => {
    let topId: string | null = null;
    let topExpense = 0;
    for (const s of summary) {
      if (s.expense > topExpense) {
        topExpense = s.expense;
        topId = s.accountId;
      }
    }
    return topExpense > 0 ? topId : null;
  }, [summary]);

  const totalBalance = useMemo(
    () =>
      accounts
        .filter((a) => !a.archived)
        .reduce((sum, a) => sum + a.currentBalance, 0),
    [accounts],
  );

  const visibleAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => a.name.toLowerCase().includes(q));
  }, [accounts, search]);

  /*======= biarkan comment karena sudah ada di beranda =======*/
  // const totalIncome = useMemo(
  //   () => summary.reduce((s, x) => s + x.income, 0),
  //   [summary],
  // );
  // const totalExpense = useMemo(
  //   () => summary.reduce((s, x) => s + x.expense, 0),
  //   [summary],
  // );

  const handleNewClick = () => {
    if (accountQuota.isAtLimit) {
      setUpgradeMsg(
        `Pembukuan ini sudah mencapai batas ${accountQuota.limit} dompet aktif. Arsipkan dompet yang tidak terpakai atau upgrade paket.`,
      );
      return;
    }
    setEditing(undefined);
    setShowForm(true);
  };

  const handleEdit = (account: Account) => {
    setEditing(account);
    setShowForm(true);
  };

  const handleDelete = async (account: Account) => {
    const ok = await confirm({
      title: `Hapus "${account.name}"?`,
      message: "Transaksi terkait dompet ini juga akan terdampak. Tindakan tidak bisa dibatalkan.",
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
    } catch {
      // notify sudah surface ke user
    }
  };

  const goToDetail = (account: Account, type?: "in" | "out") => {
    const qs = type ? `?type=${type}` : "";
    navigate(`/dashboard/accounts/${account._id}${qs}`);
  };

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="p-4">
        <InfoBox
          variant="error"
          title="Gagal memuat dompet"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetchAccounts() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dompet Saya</h1>
          <p className="text-sm text-neutral-500">
            Kelola sumber uang Anda dan pantau arus per dompet bulan ini.
          </p>
        </div>
        {canWrite && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={handleNewClick}
          >
            Tambah Dompet
          </Button>
        )}
      </header>

      <ReadOnlyBanner />
      <QuotaBanner kind="accounts" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Total Saldo
          </p>
          <div className="mt-1">
            <CurrencyText
              amount={totalBalance}
              type="neutral"
              size="lg"
              className="text-emerald-900"
            />
          </div>
        </div>
        {/*======= biarkan comment karena sudah ada di beranda =======*/}
        {/*<div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4">*/}
        {/*  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">*/}
        {/*    Masuk Bulan Ini*/}
        {/*  </p>*/}
        {/*  <div className="mt-1">*/}
        {/*    <CurrencyText*/}
        {/*      amount={totalIncome}*/}
        {/*      type="neutral"*/}
        {/*      size="lg"*/}
        {/*      className="text-emerald-700"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}
        {/*<div className="rounded-2xl border border-orange-100 bg-white px-5 py-4">*/}
        {/*  <p className="text-xs font-medium uppercase tracking-wide text-orange-700">*/}
        {/*    Keluar Bulan Ini*/}
        {/*  </p>*/}
        {/*  <div className="mt-1">*/}
        {/*    <CurrencyText*/}
        {/*      amount={totalExpense}*/}
        {/*      type="neutral"*/}
        {/*      size="lg"*/}
        {/*      className="text-orange-700"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon="Wallet"
          title="Belum ada dompet"
          description="Buat dompet pertama untuk mulai mencatat keuangan harian Anda."
          actionLabel="Buat Dompet"
          onAction={handleNewClick}
        />
      ) : (
        <>
          <DebouncedSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari dompet…"
          />
          {visibleAccounts.length === 0 ? (
            <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
              Tidak ada dompet cocok dengan "{search}".
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleAccounts.map((account) => (
            <div key={account._id} className="group relative">
              <AccountCard
                account={account}
                onClick={(a) => goToDetail(a)}
                summary={summaryByAccount.get(account._id)}
                highlight={biggestExpenseAccountId === account._id}
                onIncomeClick={(a) => goToDetail(a, "in")}
                onExpenseClick={(a) => goToDetail(a, "out")}
              />
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={`Edit ${account.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(account);
                  }}
                  className="rounded-md bg-white p-1 text-neutral-500 shadow-sm hover:text-emerald-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Hapus ${account.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(account);
                  }}
                  className="rounded-md bg-white p-1 text-neutral-500 shadow-sm hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
              </div>
            )}
          </>
      )}

      <AccountFormModal
        account={editing}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(undefined);
        }}
      />

      <UpgradeModal
        isOpen={!!upgradeMsg}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? undefined}
        title="Tidak bisa menambah dompet"
      />
    </div>
  );
};

export default AccountsPage;
