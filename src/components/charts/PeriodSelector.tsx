import { DatePicker } from "@/components/common/DatePicker";
import { currentBudgetPeriod, resolveBudgetRange } from "@/utils/budgetPeriod";

export type PeriodType = "week" | "month" | "year" | "custom";

export interface PeriodValue {
  type: PeriodType;
  from?: Date;
  to?: Date;
}

interface PeriodSelectorProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  className?: string;
  /** Hari mulai siklus anggaran — preset "Bulan" mengikuti siklus ini. */
  cycleStartDay?: number;
}

const PRESETS: Array<{ value: PeriodType; label: string }> = [
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
  { value: "year", label: "Tahun" },
  { value: "custom", label: "Kustom" },
];

function rangeFor(type: PeriodType, cycleStartDay = 1): { from: Date; to: Date } {
  const now = new Date();
  if (type === "year") {
    // Tahun penuh kalender berjalan (Jan–Des) supaya tabel perbandingan
    // anggaran tampil 12 bulan utuh.
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  if (type === "month") {
    // "Bulan" mengikuti siklus anggaran user (cycleStartDay), bukan 30 hari
    // kalender — agar selaras dengan halaman Anggaran.
    return resolveBudgetRange(currentBudgetPeriod(cycleStartDay), cycleStartDay);
  }
  const to = new Date();
  const from = new Date();
  if (type === "week") from.setDate(from.getDate() - 6);
  return { from, to };
}

export function PeriodSelector({
  value,
  onChange,
  className = "",
  cycleStartDay = 1,
}: PeriodSelectorProps) {
  const handlePreset = (type: PeriodType) => {
    if (type === "custom") {
      onChange({ type, from: value.from ?? new Date(), to: value.to ?? new Date() });
    } else {
      const { from, to } = rangeFor(type, cycleStartDay);
      onChange({ type, from, to });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div role="tablist" className="inline-flex rounded-xl bg-neutral-100 p-1">
        {PRESETS.map((preset) => {
          const isActive = preset.value === value.type;
          return (
            <button
              key={preset.value}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => handlePreset(preset.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {value.type === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={value.from ?? null}
            onChange={(d) => onChange({ ...value, from: d ?? undefined })}
            max={value.to ?? undefined}
          />
          <DatePicker
            value={value.to ?? null}
            onChange={(d) => onChange({ ...value, to: d ?? undefined })}
            min={value.from ?? undefined}
            max={new Date()}
          />
        </div>
      )}
    </div>
  );
}
