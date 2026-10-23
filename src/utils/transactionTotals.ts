import type { ID, Transaction } from "@/types";

export interface GroupTotals {
  /** Total pemasukan (magnitudo positif). */
  income: number;
  /** Total pengeluaran (magnitudo positif). */
  expense: number;
}

/**
 * Total pemasukan & pengeluaran sekelompok transaksi, dipisah (bukan net).
 *
 * Transfer netral pada daftar global (perpindahan internal antar dompet tidak
 * mengubah total kekayaan). Bila `accountId` diberikan (mis. di Detail Dompet),
 * transfer dihitung relatif terhadap dompet: masuk → pemasukan bila dompet
 * tujuan, keluar → pengeluaran bila dompet sumber.
 */
export function groupTotals(list: Transaction[], accountId?: ID): GroupTotals {
  let income = 0;
  let expense = 0;
  for (const tx of list) {
    if (tx.type === "transfer") {
      // transfer — hanya relevan untuk dompet tertentu
      if (accountId) {
        if (tx.toAccountId === accountId) income += tx.amount;
        if (tx.fromAccountId === accountId) expense += tx.amount;
      }
    } else if (tx.type === "in") {
      if (!accountId || tx.accountId === accountId) income += tx.amount;
    } else {
      if (!accountId || tx.accountId === accountId) expense += tx.amount;
    }
  }
  return { income, expense };
}
