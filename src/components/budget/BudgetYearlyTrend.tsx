import { useMemo, useState } from "react";
import { Chart } from "@dep/ui/chart";
import { LoadingSpinner } from "@dep/ui/loading";
import { useTransactionList } from "@/hooks/useTransactions";
import { formatCurrency, formatMonthLabel } from "@/utils/format";
import { CurrencyText } from "@/components/common/CurrencyText";

interface BudgetYearlyTrendProps {
  year: number;
  onSelectMonth: (year: number, month: number) => void;
}

interface MonthRow {
  label: string;
  month: number;
  expense: number;
  income: number;
  [key: string]: unknown;
}

export function BudgetYearlyTrend({ year, onSelectMonth }: BudgetYearlyTrendProps) {
  const [hovered, setHovered] = useState<MonthRow | null>(null);

  const fromIso = `${year}-01-01T00:00:00.000Z`;
  const toIso = `${year}-12-31T23:59:59.999Z`;

  const { data: transactions, isLoading } = useTransactionList({
    from: fromIso,
    to: toIso,
    size: 500,
  });

  const rows = useMemo<MonthRow[]>(() => {
    const map = new Map<number, MonthRow>();
    for (let m = 1; m <= 12; m++) {
      map.set(m, {
        label: formatMonthLabel(year, m).split(" ")[0].slice(0, 3),
        month: m,
        expense: 0,
        income: 0,
      });
    }
    for (const t of transactions) {
      const d = new Date(t.occurredAt);
      if (d.getFullYear() !== year) continue;
      const slot = map.get(d.getMonth() + 1);
      if (!slot) continue;
      if (t.type === "in") slot.income += t.amount;
      else if (t.type === "out") slot.expense += t.amount;
    }
    return Array.from(map.values());
  }, [transactions, year]);

  const max = useMemo(
    () => rows.reduce((m, r) => (r.expense > m ? r.expense : m), 0),
    [rows],
  );
  const topMonth = useMemo(
    () => rows.reduce((m, r) => (r.expense > m.expense ? r : m), rows[0]),
    [rows],
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-800">
            Tren Pengeluaran {year}
          </h2>
          <p className="text-xs text-neutral-500">
            Klik bulan untuk lihat anggaran & transaksi.
          </p>
        </div>
        {topMonth && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Pengeluaran tertinggi</p>
            <p className="text-sm font-semibold text-rose-600">
              {formatMonthLabel(year, topMonth.month)} — {formatCurrency(topMonth.expense)}
            </p>
          </div>
        )}
      </header>

      {isLoading && transactions.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <Chart
            type="bar"
            data={rows}
            xKey="label"
            height={240}
            series={[
              { key: "expense", name: "Keluar", color: "#f97316" },
              { key: "income", name: "Masuk", color: "#10b981" },
            ]}
            valueFormatter={(value) => formatCurrency(value)}
          />
          <div className="mt-3 grid grid-cols-6 gap-1 sm:grid-cols-12">
            {rows.map((r) => {
              const ratio = max > 0 ? r.expense / max : 0;
              const intensity = Math.round(20 + ratio * 60);
              return (
                <button
                  key={r.month}
                  type="button"
                  onClick={() => onSelectMonth(year, r.month)}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(null)}
                  className="rounded-md px-1 py-1.5 text-center text-[10px] font-medium text-neutral-700 transition hover:bg-orange-100"
                  style={{ background: `rgba(249, 115, 22, ${intensity / 100})` }}
                  title={`${formatMonthLabel(year, r.month)} — ${formatCurrency(r.expense)}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {hovered && (
            <div className="mt-2 text-xs text-neutral-500">
              {formatMonthLabel(year, hovered.month)}:{" "}
              <CurrencyText amount={hovered.expense} type="out" size="sm" showSign={false} />{" "}
              keluar ·{" "}
              <CurrencyText amount={hovered.income} type="in" size="sm" showSign={false} /> masuk
            </div>
          )}
        </>
      )}
    </section>
  );
}
