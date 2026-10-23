import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as budgetService from "@/services/budget.service";
import { eventBus } from "@/utils/eventBus";
import type { BudgetComparison } from "@/types";

interface UseBudgetComparisonResult {
  data: BudgetComparison | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Tabel perbandingan anggaran per bulan untuk semua kategori dalam range
 * `[from, to]` (inklusif). Format: `YYYY-MM`.
 */
export function useBudgetComparison(
  from: string,
  to: string,
): UseBudgetComparisonResult {
  const [data, setData] = useState<BudgetComparison | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetService.fetchBudgetComparison({ from, to });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off1 = eventBus.on("budget:changed", () => void load());
    const off2 = eventBus.on("transaction:changed", () => void load());
    return () => {
      off1();
      off2();
    };
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
