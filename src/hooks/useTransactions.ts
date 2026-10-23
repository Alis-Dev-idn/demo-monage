import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as transactionService from "@/services/transaction.service";
import type { TransactionInput } from "@/services/transaction.service";
import { eventBus } from "@/utils/eventBus";
import { checkBudgetThreshold } from "@/utils/budgetNotifier";
import { getActiveBookId } from "@/utils/activeBook";
import { newId, enqueue, opsForBook } from "@/lib/offline/outbox";
import type {
  Category,
  ID,
  Paginated,
  Transaction,
  TransactionFilter,
  UserPreferences,
} from "@/types";

/** Transaksi optimistik (belum tersinkron) — punya flag `__pending`. */
export type PendingTransaction = Transaction & { __pending: true };

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

interface TxOverlay {
  /** Transaksi create offline (optimistik), sudah terfilter & terbaru-dulu. */
  creates: PendingTransaction[];
  /** id → field yang diubah (edit offline), untuk override data server. */
  updates: Record<string, Partial<Transaction>>;
  /** id transaksi yang dihapus offline → disembunyikan dari list. */
  deleteIds: string[];
}

const EMPTY_OVERLAY: TxOverlay = { creates: [], updates: {}, deleteIds: [] };

function matchesFilter(tx: Transaction, filter: TransactionFilter): boolean {
  if (filter.type && tx.type !== filter.type) return false;
  if (filter.search && !(tx.note ?? "").toLowerCase().includes(filter.search.toLowerCase()))
    return false;
  if (filter.accountId) {
    const hit =
      tx.type !== "transfer"
        ? tx.accountId === filter.accountId
        : tx.fromAccountId === filter.accountId || tx.toAccountId === filter.accountId;
    if (!hit) return false;
  }
  return true;
}

/** id transaksi dari url op `/transactions/<id>`. */
function txIdFromUrl(url: string): string {
  return url.split("/").pop() ?? "";
}

/** Susun overlay optimistik (create/update/delete offline) untuk book aktif. */
async function loadTxOverlay(filter: TransactionFilter): Promise<TxOverlay> {
  const bookId = getActiveBookId();
  if (!bookId) return EMPTY_OVERLAY;
  const ops = (await opsForBook(bookId)).filter((o) => o.entity === "transaction");

  const creates: PendingTransaction[] = [];
  const updates: Record<string, Partial<Transaction>> = {};
  const deleteIds: string[] = [];

  for (const o of ops) {
    if (o.action === "create" && o.optimistic) {
      const tx = { ...(o.optimistic as Transaction), __pending: true as const };
      if (matchesFilter(tx, filter)) creates.push(tx);
    } else if (o.action === "update") {
      updates[txIdFromUrl(o.url)] = (o.body ?? {}) as Partial<Transaction>;
    } else if (o.action === "delete") {
      deleteIds.push(txIdFromUrl(o.url));
    }
  }
  creates.reverse(); // terbaru dulu
  return { creates, updates, deleteIds };
}

export interface CreateTransactionContext {
  preferences?: UserPreferences | null;
  categories?: Category[];
}

export interface UseTransactionListResult {
  data: Transaction[];
  meta: Paginated<Transaction>["meta"] | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useTransactionList(filter: TransactionFilter): UseTransactionListResult {
  const [data, setData] = useState<Transaction[]>([]);
  const [overlay, setOverlay] = useState<TxOverlay>(EMPTY_OVERLAY);
  const [meta, setMeta] = useState<Paginated<Transaction>["meta"] | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isFetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const filterKey = JSON.stringify({ ...filter, page: undefined });

  const loadPending = useCallback(() => {
    void loadTxOverlay(filter).then(setOverlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const load = useCallback(
    async (page: number) => {
      const isInitial = page === 1;
      if (isInitial) setLoading(true);
      else setFetchingMore(true);
      setError(null);
      try {
        const res = await transactionService.fetchTransactions({ ...filter, page });
        setMeta(res.meta);
        setData((prev) => (isInitial ? res.data : [...prev, ...res.data]));
      } catch (err) {
        if (err instanceof ApiError) setError(err);
      } finally {
        if (isInitial) setLoading(false);
        else setFetchingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
    loadPending();
  }, [load, loadPending]);

  useEffect(() => {
    const off1 = eventBus.on("transaction:changed", () => {
      void load(1);
      loadPending();
    });
    const off2 = eventBus.on("outbox:changed", loadPending);
    return () => {
      off1();
      off2();
    };
  }, [load, loadPending]);

  const refetch = useCallback(() => load(1), [load]);
  const loadMore = useCallback(() => {
    if (!meta || meta.page >= meta.totalPages) return Promise.resolve();
    return load(meta.page + 1);
  }, [load, meta]);

  // Overlay optimistik: sembunyikan yang dihapus offline, terapkan edit offline,
  // lalu prepend create offline (dedupe by _id — setelah sync server kembalikan
  // _id sama → overlay otomatis hilang).
  const merged = (() => {
    const { creates, updates, deleteIds } = overlay;
    if (creates.length === 0 && deleteIds.length === 0 && Object.keys(updates).length === 0) {
      return data;
    }
    const deleted = new Set(deleteIds);
    const base = data
      .filter((t) => !deleted.has(t._id))
      .map((t) =>
        updates[t._id]
          ? ({ ...t, ...updates[t._id], __pending: true } as unknown as Transaction)
          : t,
      );
    const ids = new Set(base.map((t) => t._id));
    const extra = creates.filter((c) => !ids.has(c._id) && !deleted.has(c._id));
    return extra.length ? [...extra, ...base] : base;
  })();

  return {
    data: merged,
    meta,
    isLoading,
    isFetchingMore,
    error,
    refetch,
    loadMore,
    hasMore: !!meta && meta.page < meta.totalPages,
  };
}

function emitTxChanged(): void {
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
  eventBus.emit("budget:changed");
}

/** Apakah error layak di-antre offline (network/timeout)? */
function isNetworkErr(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

export async function createTransaction(
  payload: TransactionInput,
  ctx: CreateTransactionContext = {},
): Promise<Transaction> {
  const _id = newId();
  const bookId = getActiveBookId() ?? "";
  const body = { ...payload, _id } as TransactionInput & { _id: ID };

  // Bentuk transaksi optimistik untuk tampil seketika (offline / sebelum sync).
  const now = new Date().toISOString();
  const optimistic = {
    ...payload,
    _id,
    userId: "",
    bookId,
    createdAt: now,
    updatedAt: now,
  } as unknown as Transaction;

  const queueOffline = async (): Promise<Transaction> => {
    await enqueue({
      id: _id,
      bookId,
      entity: "transaction",
      action: "create",
      method: "POST",
      url: "/transactions",
      body,
      optimistic,
    });
    eventBus.emit("outbox:changed");
    emitTxChanged();
    return optimistic;
  };

  if (!isOnline()) return queueOffline();

  try {
    const created = await transactionService.createTransaction(body, {
      idempotencyKey: _id,
    });
    emitTxChanged();
    if (created.type === "out" && ctx.preferences && ctx.categories) {
      void checkBudgetThreshold({
        categoryId: created.categoryId,
        occurredAt: created.occurredAt,
        preferences: ctx.preferences,
        categories: ctx.categories,
      });
    }
    return created;
  } catch (err) {
    if (isNetworkErr(err)) return queueOffline(); // koneksi putus → antre
    throw err; // quota/validasi/dll → surface ke pemanggil
  }
}

export async function updateTransaction(
  id: ID,
  payload: Partial<TransactionInput>,
): Promise<Transaction> {
  const idemKey = newId();
  const run = () =>
    transactionService.updateTransaction(id, payload, { idempotencyKey: idemKey });

  if (!isOnline()) {
    await enqueue({
      id: idemKey,
      bookId: getActiveBookId() ?? "",
      entity: "transaction",
      action: "update",
      method: "PATCH",
      url: `/transactions/${id}`,
      body: payload,
    });
    eventBus.emit("outbox:changed");
    emitTxChanged();
    return { _id: id, ...payload } as unknown as Transaction;
  }

  try {
    const updated = await run();
    emitTxChanged();
    return updated;
  } catch (err) {
    if (isNetworkErr(err)) {
      await enqueue({
        id: idemKey,
        bookId: getActiveBookId() ?? "",
        entity: "transaction",
        action: "update",
        method: "PATCH",
        url: `/transactions/${id}`,
        body: payload,
      });
      eventBus.emit("outbox:changed");
      emitTxChanged();
      return { _id: id, ...payload } as unknown as Transaction;
    }
    throw err;
  }
}

export async function deleteTransaction(id: ID): Promise<void> {
  const idemKey = newId();
  const enqueueDelete = async () => {
    await enqueue({
      id: idemKey,
      bookId: getActiveBookId() ?? "",
      entity: "transaction",
      action: "delete",
      method: "DELETE",
      url: `/transactions/${id}`,
    });
    eventBus.emit("outbox:changed");
    emitTxChanged();
  };

  if (!isOnline()) return enqueueDelete();

  try {
    await transactionService.deleteTransaction(id, { idempotencyKey: idemKey });
    emitTxChanged();
  } catch (err) {
    if (isNetworkErr(err)) return enqueueDelete();
    throw err;
  }
}
