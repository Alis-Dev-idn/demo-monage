import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as budgetService from "@/services/budget.service";
import type { CreateBudgetPayload } from "@/services/budget.service";
import { eventBus } from "@/utils/eventBus";
import type { Budget, BudgetPeriod, ID } from "@/types";

export interface UseBudgetListResult {
  data: Budget[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useBudgetList(period: BudgetPeriod): UseBudgetListResult {
  const [data, setData] = useState<Budget[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const key = `${period.year}-${period.month}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetService.fetchBudgets({ year: period.year, month: period.month });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const offBud = eventBus.on("budget:changed", () => void load());
    const offTx = eventBus.on("transaction:changed", () => void load());
    return () => {
      offBud();
      offTx();
    };
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  const created = await budgetService.createBudget(payload);
  eventBus.emit("budget:changed");
  return created;
}

export async function updateBudget(id: ID, amount: number): Promise<Budget> {
  const updated = await budgetService.updateBudget(id, amount);
  eventBus.emit("budget:changed");
  return updated;
}

export async function deleteBudget(id: ID): Promise<void> {
  await budgetService.deleteBudget(id);
  eventBus.emit("budget:changed");
}

/** @deprecated Anggaran sekarang recurring per kategori — tidak perlu disalin. */
export async function copyBudgetsFromPrevious(period: BudgetPeriod): Promise<Budget[]> {
  const created = await budgetService.copyBudgetsFromPrevious(period);
  eventBus.emit("budget:changed");
  return created;
}
