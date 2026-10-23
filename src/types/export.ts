import type { ID, ISODate } from "./common";

export type ExportFormat = "json" | "xlsx" | "csv";

/**
 * Domain data yang ingin di-export. Pilih semua untuk backup penuh, atau
 * sub-set tertentu untuk file lebih kecil. Default: SEMUA.
 */
export type ExportScope =
  | "profile"
  | "books"
  | "accounts"
  | "categories"
  | "transactions"
  | "budgets"
  | "savings"
  | "savingMovements";

export type ExportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

/**
 * Job export — asynchronous untuk file besar. Server boleh menyelesaikan
 * langsung (status `completed` di response POST) atau enqueue dulu.
 * Frontend selalu polling/refetch `/export/jobs/:id` sampai status final.
 */
export interface ExportJob {
  id: ID;
  format: ExportFormat;
  scope: ExportScope[];
  /** Filter rentang waktu. null = sejak awal. */
  from: ISODate | null;
  to: ISODate | null;
  /** Filter pembukuan. null = SEMUA pembukuan yang user adalah anggota. */
  bookId: ID | null;
  status: ExportJobStatus;
  requestedAt: ISODate;
  completedAt: ISODate | null;
  /**
   * URL untuk download file ketika `status === "completed"`. Boleh berupa:
   * - URL absolut ke object storage (preferred backend prod), atau
   * - `blob:` URL lokal (mock / FE-driven fallback).
   * Frontend langsung anchor download tanpa proses tambahan.
   */
  downloadUrl: string | null;
  /** Estimasi ukuran file bytes (opsional, untuk UI progress). */
  fileSizeBytes: number | null;
  /** Pesan error jika `status === "failed"`. */
  errorMessage: string | null;
}

export interface RequestExportPayload {
  format: ExportFormat;
  /** Default: SEMUA scope. */
  scope?: ExportScope[];
  from?: ISODate;
  to?: ISODate;
  /** Filter satu pembukuan. Kosong = semua pembukuan user. */
  bookId?: ID;
}

/**
 * Bundled JSON export — struktur file `.json` yang dihasilkan saat
 * `format = "json"`. Backend & frontend sepakati shape ini agar restore
 * konsisten. Dipakai juga untuk auto-backup (§4.14 Backup).
 */
export interface ExportBundle {
  exportedAt: ISODate;
  format: "json";
  schemaVersion: number;       // bump saat shape berubah
  user: unknown;               // User
  books: unknown[];            // Book[]
  accounts: unknown[];         // Account[]
  categories: unknown[];       // Category[]
  transactions: unknown[];     // Transaction[]
  budgets: unknown[];          // Budget[]
  savings: unknown[];          // Saving[]
  savingMovements: unknown[];  // SavingMovement[]
}
