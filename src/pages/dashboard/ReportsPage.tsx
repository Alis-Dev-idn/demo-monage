import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { exportCsv } from "@dep/ui/table";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { exportReportXlsx } from "@/services/report.service";
import { useReports } from "@/hooks/useReports";
import { useLookup } from "@/hooks/useLookup";
import { usePreferences } from "@/hooks/usePreferences";
import {
  PeriodSelector,
  type PeriodValue,
} from "@/components/charts/PeriodSelector";
import { CashflowAreaChart } from "@/components/charts/CashflowAreaChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { TopExpensesList } from "@/components/charts/TopExpensesList";
import { BudgetMonthlyComparisonTable } from "@/components/budget/BudgetMonthlyComparisonTable";
import { useBudgetComparison } from "@/hooks/useBudgetComparison";
import { CurrencyText } from "@/components/common/CurrencyText";
import { formatDate } from "@/utils/format";
import type { Tone } from "@/types";

function initialPeriod(): PeriodValue {
  // Default: rentang tahun penuh berjalan (Jan–Des) supaya tabel perbandingan
  // anggaran langsung menampilkan 12 bulan tanpa user harus pindah ke
  // preset "Tahun" secara manual.
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { type: "year", from, to };
}

const ReportsPage = () => {
  const [period, setPeriod] = useState<PeriodValue>(initialPeriod);
  const { categories } = useLookup();
  const { preferences } = usePreferences();
  const cycleStartDay = preferences.budgetCycleStartDay ?? 1;

  const params = useMemo(
    () => ({
      from: (period.from ?? new Date()).toISOString(),
      to: (period.to ?? new Date()).toISOString(),
      groupBy: "day" as const,
    }),
    [period],
  );

  const { data, isLoading, error, refetch } = useReports(params);

  const comparisonRange = useMemo(() => {
    const ym = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    // `period.from`/`period.to` selalu terisi oleh PeriodSelector (lihat
    // initialPeriod & semua preset). Fallback ke string default.
    return {
      from: period.from ? ym(period.from) : "2026-01",
      to: period.to ? ym(period.to) : "2026-12",
    };
  }, [period]);
  const { data: comparison } = useBudgetComparison(
    comparisonRange.from,
    comparisonRange.to,
  );

  const categoryDonutData = useMemo(() => {
    if (!data) return [];
    return data.expenseByCategory.map((c) => {
      const cat = categories.find((x) => x._id === c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryName: cat?.name ?? "Tanpa kategori",
        icon: cat?.icon ?? "Tag",
        tone: (cat?.tone ?? "neutral") as Tone,
        amount: c.amount,
        percent: c.percent,
      };
    });
  }, [data, categories]);

  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const handleExport = async (kind: "csv" | "xlsx") => {
    if (!data) return;
    const filenameBase = `monage-laporan-${params.from.slice(0, 10)}_${params.to.slice(0, 10)}`;

    // CSV stays client-side for now — it's a flat list of top expenses
    // (what the FE table already shows), zero round-trip, instant download.
    if (kind === "csv") {
      type Row = { tanggal: string; jenis: string; nominal: number; catatan: string };
      const rows: Row[] = data.topExpenses.map((t) => ({
        tanggal: formatDate(t.occurredAt),
        jenis: t.type === "in" ? "Masuk" : t.type === "out" ? "Keluar" : "Transfer",
        nominal: t.amount,
        catatan: t.note ?? "",
      }));
      const columns = [
        { key: "tanggal", label: "Tanggal" },
        { key: "jenis", label: "Jenis" },
        { key: "nominal", label: "Nominal" },
        { key: "catatan", label: "Catatan" },
      ];
      exportCsv(rows, columns, `${filenameBase}.csv`);
      return;
    }

    // XLSX: streamed by the BE so the file has one sheet per section
    // (Ringkasan, Arus Uang, Kategori, Tren Bulanan, Pengeluaran Terbesar,
    // Perbandingan Anggaran) — much more useful than the topExpenses-only
    // flat file the FE used to generate.
    setExporting("xlsx");
    try {
      await exportReportXlsx(
        {
          from: params.from,
          to: params.to,
          groupBy: params.groupBy,
          comparisonFrom: comparisonRange.from,
          comparisonTo: comparisonRange.to,
        },
        `${filenameBase}.xlsx`,
      );
      notify.success("Laporan berhasil di-export ✓");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal export laporan.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Laporan</h1>
          <p className="text-sm text-neutral-500">
            Pantau tren keuangan Anda dari waktu ke waktu.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => void handleExport("csv")}
            disabled={!data}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => void handleExport("xlsx")}
            disabled={!data || exporting === "xlsx"}
            isLoading={exporting === "xlsx"}
          >
            Excel
          </Button>
        </div>
      </header>

      <PeriodSelector value={period} onChange={setPeriod} cycleStartDay={cycleStartDay} />

      {isLoading && !data && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {error && !data && (
        <InfoBox
          variant="error"
          title="Gagal memuat laporan"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetch() }}
        />
      )}

      {data && (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Total Masuk"
              amount={data.cashflow.reduce((s, d) => s + d.income, 0)}
              type="in"
            />
            <SummaryCard
              label="Total Keluar"
              amount={data.cashflow.reduce((s, d) => s + d.expense, 0)}
              type="out"
            />
            <SummaryCard
              label="Selisih"
              amount={data.cashflow.reduce((s, d) => s + d.income - d.expense, 0)}
              type="net"
            />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-base font-semibold text-neutral-800">Arus Uang</h2>
            <CashflowAreaChart data={data.cashflow} />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-neutral-800">
                Pengeluaran per Kategori
              </h2>
              <CategoryDonutChart data={categoryDonutData} />
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-neutral-800">
                Tren Bulanan
              </h2>
              <MonthlyTrendChart data={data.monthlyTrend} />
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-800">
              5 Pengeluaran Terbesar
            </h2>
            <TopExpensesList transactions={data.topExpenses} />
          </section>

          <section>
            <header className="mb-3 flex items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-neutral-800">
                  Perbandingan Anggaran per Bulan
                </h2>
                <p className="text-xs text-neutral-500">
                  Realisasi vs anggaran per kategori sepanjang rentang. Hijau =
                  aman, kuning = waspada, merah = melebihi.
                </p>
              </div>
            </header>
            {comparison ? (
              <BudgetMonthlyComparisonTable data={comparison} />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-neutral-200">
                <LoadingSpinner />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  amount: number;
  type: "in" | "out" | "net";
}

function SummaryCard({ label, amount, type }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-2">
        <CurrencyText
          amount={Math.abs(amount)}
          type={type === "net" ? (amount >= 0 ? "in" : "out") : type}
          size="lg"
          showSign={false}
        />
      </div>
    </div>
  );
}

export default ReportsPage;
