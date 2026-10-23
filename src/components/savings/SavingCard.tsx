/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { resolveIcon } from "@/constants/iconRegistry";
import { ProgressBar } from "@dep/ui/progress";
import { IconChip } from "@dep/ui/card";
import { TO_LIB_TONE } from "@/constants/tones";
import { CurrencyText } from "@/components/common/CurrencyText";
import { formatDate } from "@/utils/format";
import type { Saving } from "@/types";

interface SavingCardProps {
  saving: Saving;
  onClick?: (saving: Saving) => void;
}

export function SavingCard({ saving, onClick }: SavingCardProps) {
  const Icon = resolveIcon(saving.icon, "PiggyBank");
  const percent =
    saving.goalAmount > 0
      ? Math.min(100, Math.round((saving.currentAmount / saving.goalAmount) * 100))
      : 0;
  const remaining = Math.max(0, saving.goalAmount - saving.currentAmount);

  const variant = percent >= 100 ? "success" : percent >= 75 ? "info" : "default";

  return (
    <button
      type="button"
      onClick={() => onClick?.(saving)}
      disabled={!onClick}
      className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm disabled:cursor-default"
    >
      <div className="flex items-center gap-3">
        <IconChip tone={TO_LIB_TONE[saving.tone]} size="md">
          <Icon size={18} aria-hidden />
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{saving.name}</p>
          <p className="text-xs text-neutral-500">
            {saving.targetDate ? `Target ${formatDate(saving.targetDate, "long")}` : "Tanpa target waktu"}
          </p>
        </div>
        <span className="text-sm font-semibold text-emerald-700">{percent}%</span>
      </div>

      <ProgressBar value={percent} variant={variant} size="sm" />

      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-baseline gap-1 min-w-0">
          Terkumpul
          <CurrencyText
            amount={saving.currentAmount}
            type="neutral"
            size="sm"
            compact
            className="text-neutral-800"
          />
        </span>
        <span className="inline-flex items-baseline gap-1 min-w-0">
          {percent >= 100 ? (
            "Tercapai 🎉"
          ) : (
            <>
              Sisa
              <CurrencyText amount={remaining} type="neutral" size="sm" compact />
            </>
          )}
        </span>
      </div>
    </button>
  );
}
