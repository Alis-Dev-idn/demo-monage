import { useContext, useMemo } from "react";
import {
  SubscriptionContext,
  type SubscriptionContextValue,
} from "@/contexts/SubscriptionContext";
import type { ID } from "@/types";

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error(
      "useSubscription() harus dipanggil di dalam <SubscriptionProvider>",
    );
  return ctx;
}

export interface QuotaState {
  /** Quota habis 100% — UI harus block aksi. */
  isAtLimit: boolean;
  /** ≥80% — UI tampil banner peringatan. */
  isNearLimit: boolean;
  /** 0-100+. null = unlimited (selalu allowed). */
  percentUsed: number | null;
  used: number;
  /** null = unlimited. */
  limit: number | null;
}

const WARN_THRESHOLD = 80;

function deriveState(used: number, limit: number | null): QuotaState {
  if (limit === null) {
    return {
      isAtLimit: false,
      isNearLimit: false,
      percentUsed: null,
      used,
      limit: null,
    };
  }
  const pct = Math.round((used / limit) * 100);
  return {
    isAtLimit: used >= limit,
    isNearLimit: pct >= WARN_THRESHOLD,
    percentUsed: pct,
    used,
    limit,
  };
}

/** Status kuota jumlah pembukuan. */
export function useBookQuota(): QuotaState {
  const { usage } = useSubscription();
  return useMemo(() => {
    if (!usage) return { isAtLimit: false, isNearLimit: false, percentUsed: null, used: 0, limit: null };
    return deriveState(usage.books.used, usage.books.limit);
  }, [usage]);
}

/**
 * Status kuota transaksi per pembukuan tertentu untuk bulan berjalan.
 * Pass `null` untuk dapat default (pembukuan aktif tidak dipakai di sini —
 * caller bertanggung jawab kasih bookId).
 */
export function useTransactionQuota(bookId: ID | null | undefined): QuotaState {
  const { usage } = useSubscription();
  return useMemo(() => {
    if (!usage || !bookId) return emptyState();
    const row = usage.transactionsPerBook.find((r) => r.bookId === bookId);
    if (!row)
      return {
        isAtLimit: false,
        isNearLimit: false,
        percentUsed: null,
        used: 0,
        limit: usage.transactionsPerBook[0]?.limit ?? null,
      };
    return deriveState(row.used, row.limit);
  }, [usage, bookId]);
}

/**
 * Status kuota anggota (member + invitation pending) per pembukuan.
 * Dikenakan pada plan owner pembukuan, bukan plan caller.
 */
export function useMemberQuota(bookId: ID | null | undefined): QuotaState {
  const { usage } = useSubscription();
  return useMemo(() => {
    if (!usage || !bookId) return emptyState();
    if(!usage.membersPerBook)
      return emptyState();
    const row = usage.membersPerBook.find((r) => r.bookId === bookId);
    if (!row) return emptyState();
    return deriveState(row.used, row.limit);
  }, [usage, bookId]);
}

/** Kuota dompet aktif per pembukuan. */
export function useAccountQuota(bookId: ID | null | undefined): QuotaState {
  const { usage } = useSubscription();
  return useMemo(() => {
    if (!usage || !bookId) return emptyState();
    const row = usage.accountsPerBook?.find((r) => r.bookId === bookId);
    if (!row) return emptyState();
    return deriveState(row.used, row.limit);
  }, [usage, bookId]);
}

/** Kuota tabungan aktif per pembukuan. */
export function useSavingQuota(bookId: ID | null | undefined): QuotaState {
  const { usage } = useSubscription();
  return useMemo(() => {
    if (!usage || !bookId) return emptyState();
    const row = usage.savingsPerBook?.find((r) => r.bookId === bookId);
    if (!row) return emptyState();
    return deriveState(row.used, row.limit);
  }, [usage, bookId]);
}

function emptyState(): QuotaState {
  return {
    isAtLimit: false,
    isNearLimit: false,
    percentUsed: null,
    used: 0,
    limit: null,
  };
}
