import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel } from "@/utils/format";

interface MonthPickerProps {
  value: { year: number; month: number };
  onChange: (value: { year: number; month: number }) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className = "" }: MonthPickerProps) {
  const shift = (delta: number) => {
    const year = value.year;
    const month = value.month + delta;
    if (month < 1) onChange({ year: year - 1, month: 12 });
    else if (month > 12) onChange({ year: year + 1, month: 1 });
    else onChange({ year, month });
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 ${className}`}
    >
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        onClick={() => shift(-1)}
        className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium text-neutral-800">
        {formatMonthLabel(value.year, value.month)}
      </span>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        onClick={() => shift(1)}
        className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
