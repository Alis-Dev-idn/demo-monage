import { useMemo, useState } from "react";
import { Plus, Target, TrendingUp, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { ProgressBar } from "@dep/ui/progress";
import { useSavingList, useSavingsSummary } from "@/hooks/useSavings";
import { SavingCard } from "@/components/savings/SavingCard";
import { SavingFormModal } from "@/components/savings/SavingFormModal";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { CurrencyText } from "@/components/common/CurrencyText";
import { QuotaBanner } from "@/components/common/QuotaBanner";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { useSavingQuota } from "@/hooks/useSubscription";
import { useBooks } from "@/hooks/useBooks";

const now = new Date();
const currentPeriod = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
};

const SavingsPage = () => {
  const navigate = useNavigate();
  const { data: savings, isLoading, error, refetch } = useSavingList();
  const { data: summary } = useSavingsSummary(currentPeriod);
  const { activeBook } = useBooks();
  const savingQuota = useSavingQuota(activeBook?._id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleSavings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savings;
    return savings.filter((s) => s.name.toLowerCase().includes(q));
  }, [savings, search]);

  const handleNewClick = () => {
    if (savingQuota.isAtLimit) {
      setUpgradeMsg(
        `Pembukuan ini sudah mencapai batas ${savingQuota.limit} tabungan aktif. Arsipkan tabungan yang sudah selesai atau upgrade paket.`,
      );
      return;
    }
    setShowForm(true);
  };

  const monthlyTargetPercent = useMemo(() => {
    if (!summary || summary.totalMonthlyDepositTarget <= 0) return 0;
    return Math.min(
      999,
      Math.round((summary.totalDepositedThisMonth / summary.totalMonthlyDepositTarget) * 100),
    );
  }, [summary]);

  const overallProgressPercent = useMemo(() => {
    if (!summary || summary.totalGoal <= 0) return 0;
    return Math.min(100, Math.round((summary.totalCurrent / summary.totalGoal) * 100));
  }, [summary]);

  if (isLoading && savings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && savings.length === 0) {
    return (
      <div className="p-4">
        <InfoBox
          variant="error"
          title="Gagal memuat tabungan"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetch() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tabungan</h1>
          <p className="text-sm text-neutral-500">
            Pisahkan dana sesuai tujuan — terpisah dari dompet harian.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={handleNewClick}
        >
          Tambah Tabungan
        </Button>
      </header>

      <QuotaBanner kind="savings" />

      {savings.length > 0 && summary && (
        // 3 kartu menyamping dengan scroll horizontal (#Q1) — nominal penuh
        // (tidak compact), persis pola "Dompet Saya" di dashboard.
        <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="min-w-[230px] flex-shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <header className="flex items-center justify-between text-emerald-700">
              <p className="text-xs font-medium uppercase tracking-wide">
                Setoran Bulan Ini
              </p>
              <TrendingUp size={16} />
            </header>
            <div className="mt-2">
              <CurrencyText
                amount={summary.totalDepositedThisMonth}
                type="in"
                size="lg"
                showSign={false}
                className="text-emerald-900"
              />
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">
              {summary.totalMonthlyDepositTarget > 0 ? (
                <>
                  Target{" "}
                  <CurrencyText
                    amount={summary.totalMonthlyDepositTarget}
                    type="neutral"
                    size="sm"
                  />{" "}
                  · {monthlyTargetPercent}% tercapai
                </>
              ) : (
                "Belum ada target setoran bulanan. Atur di tiap tabungan."
              )}
            </p>
            {summary.totalMonthlyDepositTarget > 0 && (
              <div className="mt-2">
                <ProgressBar
                  value={Math.min(100, monthlyTargetPercent)}
                  variant={
                    monthlyTargetPercent >= 100
                      ? "success"
                      : monthlyTargetPercent >= 50
                      ? "info"
                      : "default"
                  }
                  size="sm"
                />
              </div>
            )}
          </div>

          <div className="min-w-[230px] flex-shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <header className="flex items-center justify-between text-blue-700">
              <p className="text-xs font-medium uppercase tracking-wide">
                Total Terkumpul
              </p>
              <Wallet size={16} />
            </header>
            <div className="mt-2">
              <CurrencyText
                amount={summary.totalCurrent}
                type="neutral"
                size="lg"
                className="text-blue-900"
              />
            </div>
            <p className="mt-1 text-xs text-blue-700/80">
              {overallProgressPercent}% dari total target.
            </p>
            <div className="mt-2">
              <ProgressBar
                value={overallProgressPercent}
                variant="info"
                size="sm"
              />
            </div>
          </div>

          <div className="min-w-[230px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-white p-4">
            <header className="flex items-center justify-between text-neutral-500">
              <p className="text-xs font-medium uppercase tracking-wide">
                Total Target
              </p>
              <Target size={16} />
            </header>
            <div className="mt-2">
              <CurrencyText
                amount={summary.totalGoal}
                type="neutral"
                size="lg"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Akumulasi target semua tabungan ({savings.length} tujuan).
            </p>
          </div>
        </section>
      )}

      {savings.length === 0 ? (
        <EmptyState
          icon="PiggyBank"
          title="Belum ada tabungan"
          description="Tetapkan tujuan tabungan pertama Anda — dana darurat, liburan, hadiah."
          actionLabel="Tambah Tabungan"
          onAction={handleNewClick}
        />
      ) : (
        <>
          <DebouncedSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari tabungan…"
          />
          {visibleSavings.length === 0 ? (
            <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
              Tidak ada tabungan cocok dengan "{search}".
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSavings.map((saving) => (
                <SavingCard
                  key={saving._id}
                  saving={saving}
                  onClick={(s) => navigate(`/dashboard/savings/${s._id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SavingFormModal isOpen={showForm} onClose={() => setShowForm(false)} />

      <UpgradeModal
        isOpen={!!upgradeMsg}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? undefined}
        title="Tidak bisa menambah tabungan"
      />
    </div>
  );
};

export default SavingsPage;
