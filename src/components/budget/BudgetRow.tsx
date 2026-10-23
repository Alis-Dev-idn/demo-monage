/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { resolveIcon } from "@/constants/iconRegistry";
import { ProgressBar } from "@dep/ui/progress";
import { IconChip } from "@dep/ui/card";
import { TO_LIB_TONE } from "@/constants/tones";
import { formatCurrency } from "@/utils/format";
import type { Budget, Category } from "@/types";

interface BudgetRowProps {
  budget: Budget;
  category: Category;
  onClick?: (budget: Budget) => void;
}

const VARIANT: Record<Budget["status"], "success" | "warning" | "danger"> = {
  safe: "success",
  warn: "warning",
  over: "danger",
};

export function BudgetRow({ budget, category, onClick }: BudgetRowProps) {
  const Icon = resolveIcon(category.icon, "Tag");

  return (
    <button
      type="button"
      onClick={() => onClick?.(budget)}
      disabled={!onClick}
      className="flex w-full flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm disabled:cursor-default"
    >
      <div className="flex items-center gap-3">
        <IconChip tone={TO_LIB_TONE[category.tone]} size="md">
          <Icon size={18} aria-hidden />
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{category.name}</p>
          <p className="text-xs text-neutral-500">
            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
          </p>
        </div>
        <span
          className={`text-sm font-semibold ${
            budget.status === "over"
              ? "text-rose-600"
              : budget.status === "warn"
              ? "text-amber-600"
              : "text-emerald-600"
          }`}
        >
          {budget.percentUsed}%
        </span>
      </div>
      <ProgressBar
        value={Math.min(budget.percentUsed, 100)}
        variant={VARIANT[budget.status]}
        size="sm"
      />
      {budget.status === "over" ? (
        budget.remaining === 0 ? (
          <p className="text-xs text-rose-600">Anggaran habis (100% terpakai).</p>
        ) : (
          <p className="text-xs text-rose-600">
            Anggaran terlampaui sebesar {formatCurrency(Math.abs(budget.remaining))}
          </p>
        )
      ) : budget.status === "warn" ? (
        <p className="text-xs text-amber-600">
          Sisa {formatCurrency(budget.remaining)} — mendekati batas.
        </p>
      ) : (
        <p className="text-xs text-emerald-600">
          Sisa {formatCurrency(budget.remaining)} — masih aman.
        </p>
      )}
    </button>
  );
}
