import { api } from "@/utils/api";
import type {
  ID,
  MonthlyPlan,
  MonthlyPlanProgress,
  PlanItemCategory,
} from "@/types";

export interface FetchMonthlyPlanParams {
  year: number;
  month: number;
  /** Default: pembukuan aktif (auto-inject). */
  bookId?: ID;
  [key: string]: unknown;
}

/**
 * Ambil plan untuk bulan tertentu. Server return 1 plan per (book, period)
 * — backend WAJIB return `null` (200) jika belum ada, supaya FE bisa tampilkan
 * tombol "Buat Plan Bulan Ini".
 */
export function fetchMonthlyPlan(
  params: FetchMonthlyPlanParams,
): Promise<MonthlyPlan | null> {
  return api().get<MonthlyPlan | null>("/monthly-plans", { params });
}

/** Semua plan pada periode tertentu — mendukung multi-plan (#M7). */
export function fetchMonthlyPlans(
  params: FetchMonthlyPlanParams,
): Promise<MonthlyPlan[]> {
  return api().get<MonthlyPlan[]>("/monthly-plans/list", { params });
}

export function fetchMonthlyPlanById(id: ID): Promise<MonthlyPlan> {
  return api().get<MonthlyPlan>(`/monthly-plans/${id}`);
}

export function fetchMonthlyPlanProgress(id: ID): Promise<MonthlyPlanProgress> {
  return api().get<MonthlyPlanProgress>(`/monthly-plans/${id}/progress`);
}

export interface CreateMonthlyPlanPayload {
  name: string;
  period: { year: number; month: number };
  totalBudget?: number;
  bookId?: ID;
  /** Plan sumber untuk menyalin group+item (lintas bulan). */
  copyFromPlanId?: ID;
  /** Batasi group yang disalin dari `copyFromPlanId` (default: semua). */
  copyGroupIds?: ID[];
}

export function createMonthlyPlan(
  payload: CreateMonthlyPlanPayload,
): Promise<MonthlyPlan> {
  return api().post<MonthlyPlan>("/monthly-plans", payload);
}

export type UpdateMonthlyPlanPayload = Partial<
  Pick<MonthlyPlan, "name" | "totalBudget" | "weeks">
>;

export function updateMonthlyPlan(
  id: ID,
  payload: UpdateMonthlyPlanPayload,
): Promise<MonthlyPlan> {
  return api().patch<MonthlyPlan>(`/monthly-plans/${id}`, payload);
}

export function deleteMonthlyPlan(id: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/monthly-plans/${id}`);
}

/** Toggle / patch satu item. Bisa pakai untuk done, linkedAccountId, name, dll. */
export function patchPlanItem(
  planId: ID,
  itemId: ID,
  payload: Partial<{
    done: boolean;
    name: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    linkedAccountId: ID | null;
    notes: string;
  }>,
): Promise<MonthlyPlan> {
  return api().patch<MonthlyPlan>(`/monthly-plans/${planId}/items/${itemId}`, payload);
}

/** Toggle / patch satu bahan dalam item meal. */
export function patchPlanIngredient(
  planId: ID,
  itemId: ID,
  ingredientId: ID,
  payload: Partial<{
    done: boolean;
    name: string;
    category: PlanItemCategory | null;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    linkedAccountId: ID | null;
  }>,
): Promise<MonthlyPlan> {
  return api().patch<MonthlyPlan>(
    `/monthly-plans/${planId}/items/${itemId}/ingredients/${ingredientId}`,
    payload,
  );
}

/** @deprecated pakai `patchPlanItem`. */
export function togglePlanItemDone(
  planId: ID,
  itemId: ID,
  done: boolean,
): Promise<MonthlyPlan> {
  return patchPlanItem(planId, itemId, { done });
}
