import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import type { CategoryKind } from "@/types";

interface CategoryTypeTabsProps {
  value: CategoryKind;
  onChange: (kind: CategoryKind) => void;
  className?: string;
}

const TABS: Array<{
  value: CategoryKind;
  label: string;
  icon: typeof TrendingDown;
  activeClass: string;
}> = [
  {
    value: "expense",
    label: "Pengeluaran",
    icon: TrendingDown,
    activeClass: "bg-orange-100 text-orange-700",
  },
  {
    value: "income",
    label: "Pemasukan",
    icon: TrendingUp,
    activeClass: "bg-emerald-100 text-emerald-700",
  },
];

export function CategoryTypeTabs({ value, onChange, className = "" }: CategoryTypeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Jenis kategori"
      className={`inline-flex rounded-xl bg-neutral-100 p-1 ${className}`}
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
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive ? tab.activeClass + " shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Icon size={16} aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface CategoryAddButtonProps {
  onClick: () => void;
}

export function CategoryAddButton({ onClick }: CategoryAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-500 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
    >
      <Plus size={20} />
      <span className="text-xs font-medium">Tambah</span>
    </button>
  );
}
