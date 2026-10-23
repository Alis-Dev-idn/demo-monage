import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { useBudgetList } from "@/hooks/useBudget";
import { useCategoriesByKind } from "@/hooks/useLookup";
import { usePreferences } from "@/hooks/usePreferences";
import { BudgetRow } from "@/components/budget/BudgetRow";
import { BudgetSummaryCard } from "@/components/budget/BudgetSummaryCard";
import type { BudgetStatusFilter } from "@/components/budget/BudgetSummaryCard";
import { AddBudgetModal } from "@/components/budget/AddBudgetModal";
import { OverBudgetCard } from "@/components/budget/OverBudgetCard";
import { BudgetDetailModal } from "@/components/budget/BudgetDetailModal";
import { BudgetYearlyTrend } from "@/components/budget/BudgetYearlyTrend";
import { MonthPicker } from "@/components/common/MonthPicker";
import { currentBudgetPeriod } from "@/utils/budgetPeriod";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { ReadOnlyBanner } from "@/components/common/ReadOnlyBanner";
import type { Budget, Category } from "@/types";

type ViewMode = "monthly" | "yearly";

const BudgetPage = () => {
  const { preferences } = usePreferences();
  const cycleStartDay = preferences.budgetCycleStartDay ?? 1;
  // Default ke periode siklus yang sedang berjalan — bukan sekadar bulan
  // kalender — agar di awal bulan (cycleStartDay > 1) data tidak terlihat hilang.
  const [period, setPeriod] = useState(() => currentBudgetPeriod(cycleStartDay));
  const [view, setView] = useState<ViewMode>("monthly");

  // `cycleStartDay` bisa datang async: saat render pertama preferences mungkin
  // belum termuat (jatuh ke default 1), sehingga initializer useState menghitung
  // periode untuk siklus tanggal-1 (mis. Juni) dan TIDAK pernah dikoreksi saat
  // nilai sebenarnya (mis. 25) masuk. Selama user belum memilih periode manual,
  // selaraskan ulang default begitu `cycleStartDay` tersedia/berubah.
  const userPickedPeriod = useRef(false);
  const changePeriod = useCallback<typeof setPeriod>((next) => {
    userPickedPeriod.current = true;
    setPeriod(next);
  }, []);
  useEffect(() => {
    if (!userPickedPeriod.current) {
      setPeriod(currentBudgetPeriod(cycleStartDay));
    }
  }, [cycleStartDay]);

  const { data: budgets, isLoading, error, refetch } = useBudgetList(period);
  const expenseCategories = useCategoriesByKind("expense");

  // Satu modal detail untuk klik baris anggaran maupun kartu "terlampaui".
  const [detail, setDetail] = useState<{ budget: Budget; category: Category } | null>(
    null,
  );
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  // Filter daftar berdasarkan status, dipicu dari klik kartu Aman/Terlampaui.
  const [statusFilter, setStatusFilter] = useState<BudgetStatusFilter>(null);

  const categoryById = useMemo(
    () => new Map(expenseCategories.map((c) => [c._id, c])),
    [expenseCategories],
  );

  const rows = useMemo(
    () =>
      budgets
        .map((b) => ({ budget: b, category: categoryById.get(b.categoryId) }))
        .filter((r): r is { budget: Budget; category: Category } => !!r.category),
    [budgets, categoryById],
  );

  // Hanya kategori yang benar-benar melebihi (kelebihan > 0), bukan yang pas 0.
  const overRows = useMemo(
    () => rows.filter((r) => r.budget.spent > r.budget.amount),
    [rows],
  );

  const totals = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let safeBudget = 0;
    let safeSpent = 0;
    let overBudget = 0;
    let overSpent = 0;
    let safeCount = 0;
    let overCount = 0;
    for (const b of budgets) {
      totalBudget += b.amount;
      totalSpent += b.spent;
      if (b.status === "over") {
        overBudget += b.amount;
        overSpent += b.spent;
        overCount += 1;
      } else {
        safeBudget += b.amount;
        safeSpent += b.spent;
        safeCount += 1;
      }
    }
    return {
      totalBudget,
      totalSpent,
      safeBudget,
      safeSpent,
      overBudget,
      overSpent,
      safeCount,
      overCount,
    };
  }, [budgets]);

  const existingCategoryIds = useMemo(
    () => budgets.map((b) => b.categoryId),
    [budgets],
  );

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "over" && r.budget.status !== "over") return false;
      if (statusFilter === "safe" && r.budget.status === "over") return false;
      if (q && !r.category.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <ReadOnlyBanner />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Anggaran</h1>
          <p className="text-sm text-neutral-500">
            Tetapkan batas pengeluaran per kategori dan pantau realisasinya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowAdd(true)}
          >
            Tambah Anggaran
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-xl bg-neutral-100 p-1">
          <button
            role="tab"
            type="button"
            aria-selected={view === "monthly"}
            onClick={() => setView("monthly")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "monthly"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Bulanan
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={view === "yearly"}
            onClick={() => setView("yearly")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "yearly"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Tahunan
          </button>
        </div>
        {view === "monthly" && <MonthPicker value={period} onChange={changePeriod} />}
        {view === "yearly" && (
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-sm">
            <button
              type="button"
              onClick={() => changePeriod((p) => ({ ...p, year: p.year - 1 }))}
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
              aria-label="Tahun sebelumnya"
            >
              ‹
            </button>
            <span className="min-w-[60px] text-center font-medium">{period.year}</span>
            <button
              type="button"
              onClick={() => changePeriod((p) => ({ ...p, year: p.year + 1 }))}
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
              aria-label="Tahun berikutnya"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {cycleStartDay > 1 && (
        <p className="text-xs text-neutral-500">
          Siklus anggaran reset setiap tanggal <strong>{cycleStartDay}</strong> — bisa
          diubah di Pengaturan.
        </p>
      )}

      {view === "monthly" ? (
        <>
          <BudgetSummaryCard
            totals={totals}
            period={period}
            cycleStartDay={cycleStartDay}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {overRows.length > 0 && (
            <OverBudgetCard
              rows={overRows}
              onSelect={(r) => setDetail({ budget: r.budget, category: r.category })}
            />
          )}

          {isLoading && budgets.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          )}

          {error && budgets.length === 0 && (
            <InfoBox
              variant="error"
              title="Gagal memuat anggaran"
              description={error.message}
              action={{ label: "Coba lagi", onClick: () => void refetch() }}
            />
          )}

          {!isLoading && budgets.length === 0 && !error ? (
            <div className="space-y-3">
              <EmptyState
                icon="PiggyBank"
                title="Belum ada anggaran"
                description="Anggaran berlaku berulang setiap bulan — cukup atur sekali per kategori."
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="primary"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setShowAdd(true)}
                >
                  Tambah Anggaran
                </Button>
              </div>
            </div>
          ) : (
            rows.length > 0 && (
              <div className="space-y-2">
                <DebouncedSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari kategori anggaran…"
                />
                {statusFilter && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter(null)}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                  >
                    Filter: {statusFilter === "safe" ? "Aman" : "Terlampaui"} ✕
                  </button>
                )}
                {visibleRows.length === 0 ? (
                  <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                    {search
                      ? `Tidak ada anggaran cocok dengan "${search}".`
                      : statusFilter === "over"
                        ? "Tidak ada kategori yang melebihi anggaran."
                        : "Tidak ada kategori dalam batas aman."}
                  </p>
                ) : (
                  visibleRows.map(({ budget, category }) => (
                    <BudgetRow
                      key={budget._id}
                      budget={budget}
                      category={category}
                      onClick={() => setDetail({ budget, category })}
                    />
                  ))
                )}
              </div>
            )
          )}
        </>
      ) : (
        <BudgetYearlyTrend
          year={period.year}
          onSelectMonth={(year, month) => {
            changePeriod({ year, month });
            setView("monthly");
          }}
        />
      )}

      {/* key per-anggaran → modal remount bersih, tak menampilkan data anggaran
          sebelumnya saat loading (#M5). */}
      <BudgetDetailModal
        key={detail?.budget._id ?? "none"}
        budget={detail?.budget ?? null}
        category={detail?.category ?? null}
        cycleStartDay={cycleStartDay}
        isOpen={!!detail}
        onClose={() => setDetail(null)}
      />

      <AddBudgetModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        period={period}
        cycleStartDay={cycleStartDay}
        existingCategoryIds={existingCategoryIds}
      />
    </div>
  );
};

export default BudgetPage;
