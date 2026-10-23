import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * IndexedDB untuk mode offline (Batch O3).
 * - `outbox`: antrean mutasi yang harus di-push ke server saat online.
 * - `cache`: penyimpanan key→value sederhana (mis. snapshot list) — pelengkap
 *   cache service worker untuk data yang perlu di-query lokal.
 */

export type OutboxEntity = "transaction" | "savingMovement";
export type OutboxAction = "create" | "update" | "delete";

export interface OutboxOp {
  /** Auto-increment FIFO. */
  seq?: number;
  /** uuid operasi = nilai header `Idempotency-Key`. */
  id: string;
  bookId: string;
  entity: OutboxEntity;
  action: OutboxAction;
  method: "POST" | "PATCH" | "DELETE";
  /** URL relatif tanpa prefix `/api` (api() menambah prefix). */
  url: string;
  body?: unknown;
  /**
   * Data ringkas untuk render optimistik di UI (mis. transaksi pending).
   * Disimpan apa adanya; bentuknya mengikuti tipe entity terkait.
   */
  optimistic?: unknown;
  createdAt: string;
  status: "pending" | "failed";
  attempts: number;
  lastError?: string;
}

interface MonageDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxOp;
    indexes: { "by-book": string };
  };
  cache: {
    key: string;
    value: { key: string; value: unknown; updatedAt: string };
  };
}

const DB_NAME = "monage-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MonageDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MonageDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MonageDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("outbox")) {
          const store = db.createObjectStore("outbox", {
            keyPath: "seq",
            autoIncrement: true,
          });
          store.createIndex("by-book", "bookId");
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

/** Hapus seluruh data offline (dipanggil saat logout). */
export async function clearOfflineData(): Promise<void> {
  const db = await getDB();
  await db.clear("outbox");
  await db.clear("cache");
}
