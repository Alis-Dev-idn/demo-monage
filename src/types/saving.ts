import type { ID, IDRAmount, ISODate, Tone } from "./common";

export interface Saving {
  _id: ID;
  userId: ID;
  /** Pembukuan tempat tabungan ini berada. */
  bookId?: ID;
  name: string;
  icon: string;
  tone: Tone;
  goalAmount: IDRAmount;
  currentAmount: IDRAmount;
  /**
   * Target setoran rutin per bulan (opsional). Boleh dilampaui atau kurang —
   * sebagai indikator komitmen tabungan, bukan hard rule.
   */
  monthlyDeposit?: IDRAmount;
  targetDate?: ISODate;
  note?: string;
  archived: boolean;
  order: number;
  createdAt: ISODate;
}

export interface SavingMovement {
  _id: ID;
  savingId: ID;
  type: "deposit" | "withdraw";
  amount: IDRAmount;
  accountId: ID;
  note?: string;
  occurredAt: ISODate;
}

export interface SavingsSummary {
  /** Total target nominal semua tabungan. */
  totalGoal: IDRAmount;
  /** Total terkumpul semua tabungan. */
  totalCurrent: IDRAmount;
  /** Jumlah setoran AKTUAL bulan tersebut (gabungan semua tabungan). */
  totalDepositedThisMonth: IDRAmount;
  /** Jumlah TARGET setoran bulanan (sum monthlyDeposit semua tabungan). */
  totalMonthlyDepositTarget: IDRAmount;
  period: { year: number; month: number };
}
