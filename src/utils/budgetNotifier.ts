import { notify } from "@dep/notify";
import * as budgetService from "@/services/budget.service";
import { formatCurrency } from "@/utils/format";
import type { Category, UserPreferences } from "@/types";

interface CheckBudgetThresholdParams {
  categoryId: string;
  occurredAt: string;
  preferences: UserPreferences | null | undefined;
  categories: Category[];
}

/**
 * Setelah transaksi pengeluaran tersimpan, cek apakah anggaran kategori sudah
 * melewati threshold user dan munculkan notifikasi sesuai.
 */
export async function checkBudgetThreshold({
  categoryId,
  occurredAt,
  preferences,
  categories,
}: CheckBudgetThresholdParams): Promise<void> {
  if (!preferences?.budgetNotification.enabled) return;
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  let budgets;
  try {
    budgets = await budgetService.fetchBudgets({ year, month });
  } catch {
    return;
  }

  const budget = budgets.find((b) => b.categoryId === categoryId);
  if (!budget) return;

  const category = categories.find((c) => c._id === categoryId);
  const name = category?.name ?? "kategori ini";

  const { warnThreshold, overThreshold } = preferences.budgetNotification;
  const remainingFmt = formatCurrency(Math.abs(budget.remaining));

  if (budget.percentUsed >= overThreshold) {
    notify.error(
      `Anggaran "${name}" sudah ${budget.percentUsed}% — terlampaui ${remainingFmt}`,
    );
  } else if (budget.percentUsed >= warnThreshold) {
    notify.warning(
      `Anggaran "${name}" sudah ${budget.percentUsed}% — sisa ${remainingFmt}`,
    );
  }
}
