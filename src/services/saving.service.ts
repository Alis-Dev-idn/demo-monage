import { api } from "@/utils/api";
import type { ID, Saving, SavingMovement, SavingsSummary } from "@/types";
import type { SavingFormData, SavingMovementFormData } from "@/schemas/saving";

export function fetchSavings(): Promise<Saving[]> {
  return api().get<Saving[]>("/savings");
}

export interface FetchSavingsSummaryParams {
  year: number;
  month: number;
  [key: string]: unknown;
}

export function fetchSavingsSummary(
  params: FetchSavingsSummaryParams,
): Promise<SavingsSummary> {
  return api().get<SavingsSummary>("/savings/summary", { params });
}

export function fetchSaving(id: ID): Promise<Saving> {
  return api().get<Saving>(`/savings/${id}`);
}

export function fetchSavingMovements(id: ID): Promise<SavingMovement[]> {
  return api().get<SavingMovement[]>(`/savings/${id}/movements`);
}

/** Semua movement dalam book aktif — untuk ditampilkan di Riwayat Transaksi. */
export function fetchAllSavingMovements(): Promise<SavingMovement[]> {
  return api().get<SavingMovement[]>("/savings/movements");
}

export function createSaving(data: SavingFormData): Promise<Saving> {
  return api().post<Saving>("/savings", data);
}

export function updateSaving(
  id: ID,
  data: Partial<SavingFormData>,
): Promise<Saving> {
  return api().patch<Saving>(`/savings/${id}`, data);
}

export function deleteSaving(id: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/savings/${id}`);
}

export function depositSaving(
  id: ID,
  payload: SavingMovementFormData,
): Promise<Saving> {
  return api().post<Saving>(`/savings/${id}/deposit`, payload);
}

export function withdrawSaving(
  id: ID,
  payload: SavingMovementFormData,
): Promise<Saving> {
  return api().post<Saving>(`/savings/${id}/withdraw`, payload);
}

export interface SavingMovementPatch {
  amount?: number;
  accountId?: ID;
  note?: string | null;
  occurredAt?: string;
}

export function updateSavingMovement(
  savingId: ID,
  movementId: ID,
  payload: SavingMovementPatch,
): Promise<SavingMovement> {
  return api().patch<SavingMovement>(
    `/savings/${savingId}/movements/${movementId}`,
    payload,
  );
}

export function deleteSavingMovement(
  savingId: ID,
  movementId: ID,
): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(
    `/savings/${savingId}/movements/${movementId}`,
  );
}
