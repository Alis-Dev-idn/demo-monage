import { resolveIcon } from "@/constants/iconRegistry";
import { formatCurrency, formatMonthLabel } from "@/utils/format";
import { TO_LIB_TONE } from "@/constants/tones";
import { IconChip } from "@dep/ui/card";
import type { BudgetComparison, BudgetComparisonCell } from "@/types";

interface BudgetMonthlyComparisonTableProps {
  data: BudgetComparison;
}

const STATUS_CLASS: Record<BudgetComparisonCell["status"], string> = {
  safe: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warn: "bg-amber-50 text-amber-700 border-amber-100",
  over: "bg-rose-50 text-rose-700 border-rose-100",
  none: "bg-neutral-50 text-neutral-400 border-neutral-100",
};

export function BudgetMonthlyComparisonTable({
  data,
}: BudgetMonthlyComparisonTableProps) {
  if (data.rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
        Belum ada anggaran pada rentang ini. Buat anggaran di menu Anggaran
        untuk mulai melihat perbandingan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 bg-neutral-50 px-3 py-2 text-left font-semibold text-neutral-700"
            >
              Kategori
            </th>
            {data.months.map((m) => (
              <th
                key={`${m.year}-${m.month}`}
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-center font-semibold text-neutral-600"
              >
                {formatMonthLabel(m.year, m.month).split(" ")[0].slice(0, 3)}{" "}
                <span className="font-normal text-neutral-400">'{String(m.year).slice(2)}</span>
              </th>
            ))}
            <th
              scope="col"
              className="whitespace-nowrap px-3 py-2 text-right font-semibold text-neutral-700"
            >
              Rata² /bln
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.rows.map((row) => {
            const Icon = resolveIcon(row.icon, "Tag");
            const totalSpent = row.cells.reduce((s, c) => s + c.spent, 0);
            const avgSpent = totalSpent / row.cells.length;
            return (
              <tr key={row.categoryId} className="hover:bg-neutral-50/60">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <IconChip tone={TO_LIB_TONE[row.tone]} size="sm">
                      <Icon size={14} aria-hidden />
                    </IconChip>
                    <span className="truncate">{row.categoryName}</span>
                  </div>
                </th>
                {row.cells.map((cell) => (
                  <td
                    key={`${row.categoryId}-${cell.year}-${cell.month}`}
                    className={`whitespace-nowrap border-l px-3 py-2 text-center text-xs ${STATUS_CLASS[cell.status]}`}
                  >
                    {cell.status === "none" ? (
                      <span aria-label="Tidak ada anggaran">—</span>
                    ) : (
                      <div>
                        <div className="font-semibold">{formatCurrency(cell.spent)}</div>
                        <div className="text-[10px] opacity-70">
                          / {formatCurrency(cell.amount)}
                        </div>
                      </div>
                    )}
                  </td>
                ))}
                <td className="border-l bg-neutral-50/70 px-3 py-2 text-right text-xs font-semibold text-neutral-800">
                  {formatCurrency(avgSpent)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-neutral-50">
          <tr>
            <th
              scope="row"
              className="sticky left-0 z-10 bg-neutral-50 px-3 py-2 text-left text-xs font-semibold text-neutral-700"
            >
              Total Bulanan
            </th>
            {data.months.map((m, i) => {
              const sumSpent = data.rows.reduce((s, r) => s + r.cells[i].spent, 0);
              const sumBudget = data.rows.reduce((s, r) => s + r.cells[i].amount, 0);
              return (
                <td
                  key={`total-${m.year}-${m.month}`}
                  className="border-l px-3 py-2 text-center text-xs font-medium text-neutral-700"
                >
                  <div>{formatCurrency(sumSpent)}</div>
                  <div className="text-[10px] text-neutral-400">/ {formatCurrency(sumBudget)}</div>
                </td>
              );
            })}
            <td className="border-l px-3 py-2 text-right" />
          </tr>
        </tfoot>
      </table>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">
      <span className="font-medium">Legenda:</span>
      <LegendItem dot="bg-emerald-400" label="Aman (<75%)" />
      <LegendItem dot="bg-amber-400" label="Waspada (75-99%)" />
      <LegendItem dot="bg-rose-400" label="Terlampaui (≥100%)" />
      <LegendItem dot="bg-neutral-300" label="Tidak ada anggaran" />
    </div>
  );
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
