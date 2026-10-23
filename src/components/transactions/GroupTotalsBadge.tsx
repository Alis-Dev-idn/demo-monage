import { CurrencyText } from "@/components/common/CurrencyText";
import type { GroupTotals } from "@/utils/transactionTotals";

/**
 * Ringkasan nominal grup transaksi: pemasukan (atas) & pengeluaran (bawah),
 * dipisah. Hanya menampilkan baris yang ada nilainya — bila grup cuma berisi
 * salah satu jenis, hanya jenis itu yang tampil.
 */
export function GroupTotalsBadge({ income, expense }: GroupTotals) {
  if (income === 0 && expense === 0) return null;
  return (
    <div className="flex flex-col items-end gap-0.5">
      {income > 0 && (
        <CurrencyText amount={income} type="in" size="sm" showSign compact />
      )}
      {expense > 0 && (
        <CurrencyText amount={expense} type="out" size="sm" showSign compact />
      )}
    </div>
  );
}
