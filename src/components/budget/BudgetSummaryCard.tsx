import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ProgressBar } from "@dep/ui/progress";
import { CurrencyText } from "@/components/common/CurrencyText";
import { formatPeriodLabel } from "@/utils/budgetPeriod";

export interface BudgetTotals {
  /** Total semua anggaran. */
  totalBudget: number;
  /** Total terpakai semua anggaran. */
  totalSpent: number;
  /** Subtotal anggaran kategori yang BELUM melampaui (status safe + warn). */
  safeBudget: number;
  /** Subtotal terpakai kategori safe + warn. */
  safeSpent: number;
  /** Subtotal anggaran kategori yang SUDAH melampaui. */
  overBudget: number;
  /** Subtotal terpakai kategori over. */
  overSpent: number;
  /** Jumlah kategori safe+warn vs over. */
  safeCount: number;
  overCount: number;
}

export type BudgetStatusFilter = "safe" | "over" | null;

interface BudgetSummaryCardProps {
  totals: BudgetTotals;
  period: { year: number; month: number };
  cycleStartDay?: number;
  /** Filter status aktif — kartu yang sesuai ditandai. */
  activeFilter?: BudgetStatusFilter;
  /** Klik kartu Aman/Terlampaui untuk toggle filter daftar anggaran. */
  onFilterChange?: (next: BudgetStatusFilter) => void;
}

export function BudgetSummaryCard({
  totals,
  period,
  cycleStartDay = 1,
  activeFilter = null,
  onFilterChange,
}: BudgetSummaryCardProps) {
  const { totalBudget, totalSpent, safeBudget, safeSpent, overBudget, overSpent, safeCount, overCount } = totals;
  const remaining = totalBudget - totalSpent;
  const percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const variant = percent >= 100 ? "danger" : percent >= 75 ? "warning" : "success";

  const safeRemaining = Math.max(0, safeBudget - safeSpent);
  const overExcess = Math.max(0, overSpent - overBudget);

  return (
    // Semua box berjajar menyamping (scroll horizontal di mobile) seperti
    // "Dompet Saya" di dashboard. Di ≥sm box mengisi rata (flex-1). Stat di
    // dalam pakai grid-cols-3 biasa (tanpa scroll-dalam, agar tak ada scrollbar
    // ganda & nominal tidak terpotong). (#Q1/#R2 + revisi)
    <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {/* Box 1 — Ringkasan umum */}
      <div className="flex min-w-[320px] flex-shrink-0 flex-col rounded-2xl border border-emerald-100 bg-emerald-50 p-4 lg:min-w-0 lg:flex-1">
        <header className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-emerald-700">
            Anggaran {formatPeriodLabel(period, cycleStartDay)}
          </p>
          <span className="flex-shrink-0 text-xs font-medium text-emerald-700">
            {percent}% terpakai
          </span>
        </header>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-emerald-700/70">Total Anggaran</p>
            <CurrencyText amount={totalBudget} type="neutral" size="sm" />
          </div>
          <div>
            <p className="text-xs text-emerald-700/70">Sudah Terpakai</p>
            <CurrencyText amount={totalSpent} type="out" size="sm" showSign={false} />
          </div>
          <div>
            <p className="text-xs text-emerald-700/70">
              {remaining >= 0 ? "Sisa" : "Kelebihan"}
            </p>
            <CurrencyText
              amount={Math.abs(remaining)}
              type={remaining >= 0 ? "in" : "out"}
              size="sm"
              showSign={false}
            />
          </div>
        </div>

        <div className="mt-auto pt-3">
          <ProgressBar value={Math.min(percent, 100)} variant={variant} size="md" />
        </div>
      </div>

      {/* Box 2 — Aman (klik untuk filter daftar) */}
      <button
        type="button"
        onClick={() => onFilterChange?.(activeFilter === "safe" ? null : "safe")}
        aria-pressed={activeFilter === "safe"}
        className={`flex min-w-[320px] flex-shrink-0 flex-col rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm lg:min-w-0 lg:flex-1 ${
          activeFilter === "safe"
            ? "border-emerald-400 ring-2 ring-emerald-300"
            : "border-emerald-200"
        }`}
      >
        <header className="flex items-center justify-between gap-2 text-emerald-700">
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="flex-shrink-0" />
            <h3 className="truncate text-sm font-semibold">Aman ({safeCount} kategori)</h3>
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-emerald-700/70">
            {activeFilter === "safe" ? "Filter aktif ✕" : "Ketuk untuk filter"}
          </span>
        </header>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Anggaran</p>
            <CurrencyText amount={safeBudget} type="neutral" size="sm" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Terpakai</p>
            <CurrencyText amount={safeSpent} type="out" size="sm" showSign={false} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Belum Terpakai</p>
            <CurrencyText amount={safeRemaining} type="in" size="sm" showSign={false} />
          </div>
        </div>
        <p className="mt-auto pt-2 text-xs text-neutral-500">
          Total dana yang masih bisa dipakai tanpa melampaui anggaran.
        </p>
      </button>

      {/* Box 3 — Terlampaui (klik untuk filter daftar; nonaktif jika tak ada) */}
      <button
        type="button"
        disabled={overCount === 0}
        onClick={() => onFilterChange?.(activeFilter === "over" ? null : "over")}
        aria-pressed={activeFilter === "over"}
        className={`flex min-w-[320px] flex-shrink-0 flex-col rounded-2xl border p-4 text-left transition lg:min-w-0 lg:flex-1 ${
          overCount > 0
            ? activeFilter === "over"
              ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-300 hover:shadow-sm"
              : "border-rose-200 bg-rose-50/40 hover:shadow-sm"
            : "cursor-default border-neutral-200 bg-neutral-50/60"
        }`}
      >
        <header
          className={`flex items-center justify-between gap-2 ${
            overCount > 0 ? "text-rose-700" : "text-neutral-500"
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <h3 className="truncate text-sm font-semibold">
              Terlampaui ({overCount} kategori)
            </h3>
          </span>
          {overCount > 0 && (
            <span className="flex-shrink-0 text-xs font-medium text-rose-700/70">
              {activeFilter === "over" ? "Filter aktif ✕" : "Ketuk untuk filter"}
            </span>
          )}
        </header>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Anggaran</p>
            <CurrencyText amount={overBudget} type="neutral" size="sm" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Terpakai</p>
            <CurrencyText amount={overSpent} type="out" size="sm" showSign={false} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Kelebihan</p>
            <CurrencyText amount={overExcess} type="out" size="sm" showSign={false} />
          </div>
        </div>
        <p className="mt-auto pt-2 text-xs text-neutral-500">
          {overCount > 0
            ? "Cek kategori yang melebihi anggaran di card di bawah."
            : "Tidak ada kategori yang melebihi anggaran. 👌"}
        </p>
      </button>
    </section>
  );
}
