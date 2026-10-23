import type { ID, IDRAmount, ISODate, Tone } from "./common";

export type AccountType = "cash" | "bank" | "ewallet" | "investment" | "other";

export interface Account {
  _id: ID;
  userId: ID;
  /** Pembukuan tempat dompet ini berada. */
  bookId?: ID;
  name: string;
  type: AccountType;
  icon: string;
  tone: Tone;
  initialBalance: IDRAmount;
  currentBalance: IDRAmount;
  archived: boolean;
  order: number;
  createdAt: ISODate;
}

/**
 * Agregat masuk/keluar per dompet untuk satu rentang waktu (default: bulan
 * berjalan). Dipakai AccountsPage untuk menampilkan ringkasan & menyoroti
 * dompet dengan pengeluaran terbesar.
 *
 * Catatan:
 * - `income`/`expense` HANYA hitung tx type "in"/"out". Transfer dipisah.
 * - `transferIn`/`transferOut` = sum amount transfer yang masuk/keluar dompet
 *   ini. Tidak masuk income/expense supaya angka mencerminkan arus uang real
 *   (transfer antar dompet sendiri bukan pengeluaran).
 * - `adminFee` selalu di-include pada `expense` (sesuai aturan saldo §5.1).
 */
export interface AccountMonthlySummary {
  accountId: ID;
  period: { from: ISODate; to: ISODate };
  income: IDRAmount;
  expense: IDRAmount;
  transferIn: IDRAmount;
  transferOut: IDRAmount;
  txCount: number;
}
