import type { ID, IDRAmount, ISODate } from "./common";

export type TransactionType = "in" | "out" | "transfer";

/** Asal transaksi (#1.2). Default `manual`. */
export type TransactionSource = "manual" | "plan" | "business";

/** Detail terstruktur transaksi dari Perencanaan Bulanan (#2.3). */
export interface PlanTxRef {
  planId: ID;
  planName: string;
  groupId?: ID;
  groupName?: string;
  itemId?: ID;
  itemName?: string;
  ingredientName?: string;
}

export interface TransactionBase {
  _id: ID;
  userId: ID;
  /** Pembukuan tempat transaksi ini tercatat. */
  bookId?: ID;
  type: TransactionType;
  amount: IDRAmount;
  /**
   * Biaya tambahan (admin/bank/platform fee) di luar `amount` utama.
   * - Transfer: dikurangi dari `fromAccountId` (selain `amount`)
   * - Out: ditambahkan ke pengeluaran (saldo akun ⇒ dikurangi `amount + adminFee`)
   * - In: dikurangi dari penerimaan (saldo akun ⇒ ditambah `amount - adminFee`)
   */
  adminFee?: IDRAmount;
  note?: string;
  /** Asal transaksi (#1.2). Tak diisi = `manual`. */
  source?: TransactionSource;
  /** Detail perencanaan asal (#2.3) — hanya saat `source === "plan"`. */
  planRef?: PlanTxRef;
  occurredAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface TransactionInOut extends TransactionBase {
  type: "in" | "out";
  accountId: ID;
  categoryId: ID;
  subcategoryId?: ID;
  /**
   * Bila diisi: transaksi ini adalah cermin setor/tarik tabungan (transfer
   * internal). Tidak punya kategori; dikecualikan dari laporan/anggaran;
   * dikelola dari menu Tabungan (read-only di Riwayat). Dirender via cabang
   * `savingId` lebih dulu sehingga `categoryId` tak pernah dibaca untuk baris ini.
   */
  savingId?: ID;
}

export interface TransactionTransfer extends TransactionBase {
  type: "transfer";
  fromAccountId: ID;
  toAccountId: ID;
}

export type Transaction = TransactionInOut | TransactionTransfer;

export interface TransactionFilter {
  type?: TransactionType;
  accountId?: ID;
  categoryId?: ID;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  size?: number;
}
