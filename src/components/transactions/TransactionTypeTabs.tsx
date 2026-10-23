import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import type { TransactionType } from "@/types";

interface TransactionTypeTabsProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  className?: string;
}

const TABS: Array<{
  value: TransactionType;
  label: string;
  icon: typeof ArrowDownLeft;
  activeClass: string;
}> = [
  {
    value: "in",
    label: "Uang Masuk",
    icon: ArrowDownLeft,
    activeClass: "bg-emerald-500 text-white",
  },
  {
    value: "out",
    label: "Uang Keluar",
    icon: ArrowUpRight,
    activeClass: "bg-orange-500 text-white",
  },
  {
    value: "transfer",
    label: "Transfer",
    icon: ArrowLeftRight,
    activeClass: "bg-blue-500 text-white",
  },
];

export function TransactionTypeTabs({
  value,
  onChange,
  className = "",
}: TransactionTypeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Jenis transaksi"
      className={`grid grid-cols-3 gap-2 ${className}`}
    >
      {TABS.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${
              isActive
                ? `${tab.activeClass} border-transparent shadow-sm`
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            }`}
          >
            <Icon size={18} aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
