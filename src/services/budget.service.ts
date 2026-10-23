import { api } from "@/utils/api";
import type { Budget, BudgetComparison, BudgetPeriod, ID } from "@/types";

export interface FetchBudgetComparisonParams {
  /** YYYY-MM */
  from: string;
  /** YYYY-MM */
  to: string;
  [key: string]: unknown;
}

export function fetchBudgetComparison(
  params: FetchBudgetComparisonParams,
): Promise<BudgetComparison> {
  return api().get<BudgetComparison>("/budgets/comparison", { params });
}

export interface FetchBudgetsParams {
  year: number;
  month: number;
  [key: string]: unknown;
}

export function fetchBudgets(params: FetchBudgetsParams): Promise<Budget[]> {
  return api().get<Budget[]>("/budgets", { params });
}

export interface CreateBudgetPayload {
  categoryId: ID;
  period: BudgetPeriod;
  amount: number;
}

export function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  return api().post<Budget>("/budgets", payload);
}

export function updateBudget(id: ID, amount: number): Promise<Budget> {
  return api().patch<Budget>(`/budgets/${id}`, { amount });
}

export function deleteBudget(id: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/budgets/${id}`);
}

/**
 * @deprecated Anggaran sekarang recurring per kategori — endpoint ini
 * dihapus. Disisakan stub no-op untuk kompatibilitas jika ada caller.
 */
export function copyBudgetsFromPrevious(period: BudgetPeriod): Promise<Budget[]> {
  void period;
  return Promise.resolve([]);
}
