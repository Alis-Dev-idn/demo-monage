import { TransactionRow } from "@/components/transactions/TransactionRow";
import { EmptyState } from "@/components/common/EmptyState";
import type { Transaction } from "@/types";

interface TopExpensesListProps {
  transactions: Transaction[];
  limit?: number;
  onSelect?: (tx: Transaction) => void;
}

export function TopExpensesList({
  transactions,
  limit = 5,
  onSelect,
}: TopExpensesListProps) {
  const top = [...transactions]
    .filter((t) => t.type === "out")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  if (top.length === 0) {
    return (
      <EmptyState
        icon="TrendingDown"
        title="Belum ada pengeluaran besar"
        description="Top pengeluaran akan muncul setelah ada transaksi keluar."
      />
    );
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
      {top.map((tx) => (
        <TransactionRow key={tx._id} transaction={tx} onClick={onSelect} />
      ))}
    </div>
  );
}
