import { useState } from "react";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox, ListBox } from "@dep/ui/card";
import { Button } from "@dep/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { CurrencyText } from "@/components/common/CurrencyText";
import { TrendArrow } from "@/components/common/TrendArrow";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { AccountCard } from "@/components/accounts/AccountCard";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { CashflowAreaChart } from "@/components/charts/CashflowAreaChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { EmptyState } from "@/components/common/EmptyState";
import { QuotaBanner } from "@/components/common/QuotaBanner";
import { EmailVerificationBanner } from "@/components/common/EmailVerificationBanner";
import type { Transaction } from "@/types";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();
  const [selected, setSelected] = useState<Transaction | null>(null);

  if (isLoading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4">
        <InfoBox
          variant="error"
          title="Gagal memuat dashboard"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetch() }}
        />
      </div>
    );
  }

  if (!data) return null;

  const { totalBalance, monthSummary, cashflowDaily, expenseByCategory, recentTransactions, accounts } = data;
  const incomeRatio =
    monthSummary.income > 0 ? ((monthSummary.net / monthSummary.income) * 100) : 0;

  return (
    <div className="space-y-6 p-4 pb-32 sm:p-6">
      <header>
        <p className="text-sm text-neutral-500">Halo,</p>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {user?.name?.split(" ")[0] ?? "Pengguna"} 👋
        </h1>
      </header>

      <EmailVerificationBanner />
      <QuotaBanner kind="transactions" />
      <QuotaBanner kind="books" />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Total Saldo
          </p>
          <div className="mt-2 min-w-0">
            <CurrencyText
              amount={totalBalance}
              type="neutral"
              size="lg"
              className="block truncate text-2xl text-emerald-900"
            />
          </div>
          <p className="mt-1 text-xs text-emerald-700/80">
            Dari {accounts.filter((a) => !a.archived).length} dompet aktif
          </p>
        </div>

        <StatCard
          label="Uang Masuk"
          amount={monthSummary.income}
          type="in"
          icon={<TrendingUp size={16} aria-hidden />}
        />
        <StatCard
          label="Uang Keluar"
          amount={monthSummary.expense}
          type="out"
          icon={<TrendingDown size={16} aria-hidden />}
        />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Selisih Bulan Ini
            </p>
            <TrendArrow delta={Number.isFinite(incomeRatio) ? incomeRatio : 0} />
          </div>
          <div className="mt-2 min-w-0">
            <CurrencyText
              amount={Math.abs(monthSummary.net)}
              type={monthSummary.net >= 0 ? "in" : "out"}
              size="lg"
              showSign={false}
              className="block truncate"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {monthSummary.net >= 0
              ? "Sisa setelah pengeluaran 🎉"
              : "Pengeluaran melebihi pemasukan"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Arus Uang Bulan Ini</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/reports")}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Laporan lengkap →
          </button>
        </header>
        {cashflowDaily.length > 0 ? (
          <CashflowAreaChart data={cashflowDaily} />
        ) : (
          <EmptyState
            icon="LineChart"
            title="Belum ada arus uang"
            description="Catat transaksi untuk mulai melihat grafik."
          />
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-neutral-800">
          Pengeluaran per Kategori
        </h2>
        <CategoryDonutChart data={expenseByCategory} />
      </section>

      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Dompet Saya</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/accounts")}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Kelola →
          </button>
        </header>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {accounts.map((account) => (
            <div key={account._id} className="min-w-[220px] flex-shrink-0">
              <AccountCard
                account={account}
                variant="horizontal"
                onClick={() => navigate(`/dashboard/accounts/${account._id}`)}
              />
            </div>
          ))}
          {accounts.length === 0 && (
            <Button
              variant="outline"
              leftIcon={<Wallet size={14} />}
              onClick={() => navigate("/dashboard/accounts")}
            >
              Tambah Dompet
            </Button>
          )}
        </div>
      </section>

      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Transaksi Terakhir</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/transactions")}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Lihat semua →
          </button>
        </header>
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon="ReceiptText"
            title="Belum ada transaksi"
            description="Catat transaksi pertama Anda."
            actionLabel="Catat Sekarang"
            onAction={() => navigate("/dashboard/transactions/new")}
          />
        ) : (
          <ListBox variant="outlined" pad="none">
            <div className="divide-y divide-neutral-100">
              {recentTransactions.map((tx) => (
                <TransactionRow
                  key={tx._id}
                  transaction={tx}
                  onClick={setSelected}
                />
              ))}
            </div>
          </ListBox>
        )}
      </section>

      <FloatingActionButton
        onClick={() => navigate("/dashboard/transactions/new")}
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
      />

      <TransactionDetailModal
        transaction={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  amount: number;
  type: "in" | "out";
  icon: React.ReactNode;
}

function StatCard({ label, amount, type, icon }: StatCardProps) {
  const isIn = type === "in";
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            isIn ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 min-w-0">
        <CurrencyText
          amount={amount}
          type={type}
          size="lg"
          showSign={false}
          className="block truncate"
        />
      </div>
    </div>
  );
}

export default DashboardPage;
