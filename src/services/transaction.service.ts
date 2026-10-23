import { api } from "@/utils/api";
import type {
  ID,
  Paginated,
  Transaction,
  TransactionFilter,
  TransactionInOut,
  TransactionTransfer,
} from "@/types";

export type TransactionInput =
  | (Omit<TransactionInOut, "_id" | "userId" | "createdAt" | "updatedAt">)
  | (Omit<TransactionTransfer, "_id" | "userId" | "createdAt" | "updatedAt">);

export function fetchTransactions(
  filter: TransactionFilter = {},
): Promise<Paginated<Transaction>> {
  return api().get<Paginated<Transaction>>("/transactions", {
    params: filter as Record<string, unknown>,
  });
}

export function fetchTransaction(id: ID): Promise<Transaction> {
  return api().get<Transaction>(`/transactions/${id}`);
}

/** Opsi mutasi — `idempotencyKey` dikirim sbg header anti-duplikat (Batch O2/O3). */
export interface MutateOpts {
  idempotencyKey?: string;
}

function idemHeaders(opts?: MutateOpts) {
  return opts?.idempotencyKey
    ? { headers: { "Idempotency-Key": opts.idempotencyKey } }
    : undefined;
}

export function createTransaction(
  payload: TransactionInput & { _id?: ID },
  opts?: MutateOpts,
): Promise<Transaction> {
  return api().post<Transaction>("/transactions", payload, idemHeaders(opts));
}

export function updateTransaction(
  id: ID,
  payload: Partial<TransactionInput>,
  opts?: MutateOpts,
): Promise<Transaction> {
  return api().patch<Transaction>(`/transactions/${id}`, payload, idemHeaders(opts));
}

export function deleteTransaction(id: ID, opts?: MutateOpts): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/transactions/${id}`, idemHeaders(opts));
}
