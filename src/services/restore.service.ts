import { api } from "@/utils/api";
import type { ID } from "@/types";

export interface RestoreSummary {
  mode: "merge" | "dry-run";
  books: number;
  accounts: number;
  categories: number;
  transactions: number;
  budgets: number;
  savings: number;
  savingMovements: number;
  products: number;
  sales: number;
  stockMovements: number;
  businessSettings: number;
  bookTransfers: number;
  monthlyPlans: number;
  createdBookIds: ID[];
  warnings: string[];
}

export interface RestoreRequest {
  bundle: Record<string, unknown>;
  mode?: "merge" | "dry-run";
  bookLabelPrefix?: string;
  /** Restore ke pembukuan existing milik user (bukan buat baru). */
  targetBookId?: ID;
}

/**
 * Restore (or preview, with `mode=dry-run`) a JSON export bundle into the
 * current user's account. The server creates a brand-new book for every
 * book in the bundle so the user can compare against / migrate from their
 * existing data manually rather than risking an irreversible overwrite.
 */
export function restoreBundle(req: RestoreRequest): Promise<RestoreSummary> {
  return api().post<RestoreSummary>("/restore", req);
}
