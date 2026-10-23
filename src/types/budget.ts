import type { ID, IDRAmount, Tone } from "./common";

export interface BudgetPeriod {
  year: number;
  month: number;
}

export type BudgetStatus = "safe" | "warn" | "over";

export interface Budget {
  _id: ID;
  userId: ID;
  /** Pembukuan tempat anggaran ini berlaku. */
  bookId?: ID;
  categoryId: ID;
  period: BudgetPeriod;
  amount: IDRAmount;
  spent: IDRAmount;
  remaining: IDRAmount;
  percentUsed: number;
  status: BudgetStatus;
}

export interface BudgetComparisonCell {
  year: number;
  month: number;
  /** 0 berarti tidak ada anggaran di bulan tsb. */
  amount: IDRAmount;
  spent: IDRAmount;
  status: BudgetStatus | "none";
}

export interface BudgetComparisonRow {
  categoryId: ID;
  categoryName: string;
  icon: string;
  tone: Tone;
  cells: BudgetComparisonCell[];
}

export interface BudgetComparison {
  period: { from: BudgetPeriod; to: BudgetPeriod };
  months: BudgetPeriod[];
  rows: BudgetComparisonRow[];
}
