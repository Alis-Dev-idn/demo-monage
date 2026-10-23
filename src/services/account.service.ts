import { api } from "@/utils/api";
import type { Account, AccountMonthlySummary, ID } from "@/types";
import type { AccountFormData } from "@/schemas/account";

export interface FetchAccountsParams {
  archived?: boolean;
  [key: string]: unknown;
}

export function fetchAccounts(params?: FetchAccountsParams): Promise<Account[]> {
  return api().get<Account[]>("/accounts", { params });
}

export function fetchAccount(id: ID): Promise<Account> {
  return api().get<Account>(`/accounts/${id}`);
}

export function createAccount(data: AccountFormData): Promise<Account> {
  return api().post<Account>("/accounts", data);
}

export function updateAccount(
  id: ID,
  data: Partial<AccountFormData>,
): Promise<Account> {
  return api().patch<Account>(`/accounts/${id}`, data);
}

export interface DeleteAccountOptions {
  moveTransactionsTo?: ID;
}

export function deleteAccount(
  id: ID,
  opts: DeleteAccountOptions = {},
): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/accounts/${id}`, {
    params: opts.moveTransactionsTo ? { moveTransactionsTo: opts.moveTransactionsTo } : undefined,
  });
}

export function reorderAccounts(
  orders: Array<{ _id: ID; order: number }>,
): Promise<Account[]> {
  return api().patch<Account[]>("/accounts/reorder", { orders });
}

export interface FetchAccountsSummaryParams {
  /** ISO datetime. Default: awal bulan berjalan. */
  from?: string;
  /** ISO datetime. Default: akhir bulan berjalan. */
  to?: string;
  [key: string]: unknown;
}

/**
 * Agregat masuk/keluar per dompet untuk rentang waktu tertentu.
 * Default: bulan kalender berjalan.
 */
export function fetchAccountsSummary(
  params?: FetchAccountsSummaryParams,
): Promise<AccountMonthlySummary[]> {
  return api().get<AccountMonthlySummary[]>("/accounts/summary", { params });
}
