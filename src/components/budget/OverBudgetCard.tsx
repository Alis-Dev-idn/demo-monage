import { AlertTriangle, ChevronRight } from "lucide-react";
import { resolveIcon } from "@/constants/iconRegistry";
import { TO_LIB_TONE } from "@/constants/tones";
import { CurrencyText } from "@/components/common/CurrencyText";
import type { Budget, Category } from "@/types";

export interface OverBudgetRow {
  budget: Budget;
  category: Category;
}

interface OverBudgetCardProps {
  rows: OverBudgetRow[];
  onSelect: (row: OverBudgetRow) => void;
}

export function OverBudgetCard({ rows, onSelect }: OverBudgetCardProps) {
  if (rows.length === 0) return null;

  const totalOver = rows.reduce(
    (s, r) => s + Math.max(0, r.budget.spent - r.budget.amount),
    0,
  );

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <header className="mb-3 flex items-center gap-2 text-rose-700">
        <AlertTriangle size={16} />
        <h2 className="text-sm font-semibold">
          {rows.length} kategori melebihi anggaran
        </h2>
      </header>
      <p className="mb-3 text-xs text-rose-700/80">
        Total kelebihan: <CurrencyText amount={totalOver} type="out" size="sm" showSign={false} />
      </p>
      <ul className="space-y-1.5">
        {rows.map(({ budget, category }) => {
          const Icon = resolveIcon(category.icon, "Tag");
          const palette = TO_LIB_TONE[category.tone];
          return (
            <li key={budget._id}>
              <button
                type="button"
                onClick={() => onSelect({ budget, category })}
                className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left transition hover:shadow-sm"
              >
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg`}
                  data-tone={palette}
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {category.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {budget.percentUsed}% terpakai · lebih{" "}
                    <CurrencyText
                      amount={Math.max(0, budget.spent - budget.amount)}
                      type="out"
                      size="sm"
                      showSign={false}
                    />
                  </p>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-neutral-400" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
