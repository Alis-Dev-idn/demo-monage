import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, Wallet } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField } from "@dep/ui/form";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { CurrencyText } from "@/components/common/CurrencyText";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { useTransactionList } from "@/hooks/useTransactions";
import { updateBudget, deleteBudget } from "@/hooks/useBudget";
import { resolveBudgetRange } from "@/utils/budgetPeriod";
import type { Budget, Category, Transaction } from "@/types";

interface BudgetDetailModalProps {
  budget: Budget | null;
  category: Category | null;
  cycleStartDay?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Detail anggaran satu kategori: ringkasan + daftar transaksi terkait (bisa
 * diklik untuk edit/hapus), plus edit nominal & hapus anggaran. Menggantikan
 * modal edit-only sebelumnya (#N5).
 */
export function BudgetDetailModal({
  budget,
  category,
  cycleStartDay = 1,
  isOpen,
  onClose,
}: BudgetDetailModalProps) {
  const [amount, setAmount] = useState(budget?.amount ?? 0);
  const [busy, setBusy] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setAmount(budget?.amount ?? 0);
  }, [isOpen, budget?.amount]);

  const range = useMemo(
    () => (budget ? resolveBudgetRange(budget.period, cycleStartDay) : null),
    [budget, cycleStartDay],
  );

  const filter = useMemo(
    () => ({
      type: "out" as const,
      categoryId: budget?.categoryId,
      from: range?.from.toISOString(),
      to: range?.to.toISOString(),
      size: 100,
    }),
    [budget, range],
  );

  const { data: transactions, isLoading } = useTransactionList(filter);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.amount - a.amount),
    [transactions],
  );

  if (!budget || !category) return null;

  const remaining = budget.remaining;
  const amountDirty = amount !== budget.amount;

  const handleSave = async () => {
    if (amount <= 0) {
      notify.warning("Nominal anggaran harus lebih dari 0");
      return;
    }
    setBusy(true);
    try {
      await notify.promise(updateBudget(budget._id, amount), {
        loading: "Menyimpan anggaran…",
        success: "Anggaran diperbarui ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
      });
    } catch {
      // surfaced via notify
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Hapus anggaran?",
      message: `Anggaran kategori "${category.name}" akan dihapus. Transaksinya tidak terpengaruh.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await notify.promise(deleteBudget(budget._id), {
        loading: "Menghapus…",
        success: "Anggaran dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      onClose();
    } catch {
      // surfaced via notify
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalShell
          icon={<Wallet size={20} />}
          title={`Anggaran "${category.name}"`}
          subtitle={`${budget.percentUsed}% terpakai`}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                variant="danger-outline"
                type="button"
                leftIcon={<Trash2 size={14} />}
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                Hapus
              </Button>
              <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
                Tutup
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-neutral-50 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-500">Anggaran</p>
                <CurrencyText amount={budget.amount} type="neutral" size="md" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Terpakai</p>
                <CurrencyText amount={budget.spent} type="out" size="md" showSign={false} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">
                  {remaining >= 0 ? "Sisa" : "Kelebihan"}
                </p>
                <CurrencyText
                  amount={Math.abs(remaining)}
                  type={remaining >= 0 ? "in" : "out"}
                  size="md"
                  showSign={false}
                />
              </div>
            </div>

            <FormField label="Ubah Nominal Anggaran">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CurrencyInput value={amount} onChange={setAmount} />
                </div>
                <Button
                  type="button"
                  leftIcon={<Save size={14} />}
                  onClick={() => void handleSave()}
                  isLoading={busy}
                  disabled={!amountDirty}
                >
                  Simpan
                </Button>
              </div>
            </FormField>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                Transaksi terkait kategori ini
              </h3>
              {isLoading ? (
                <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                  Memuat…
                </p>
              ) : sorted.length === 0 ? (
                <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                  Belum ada transaksi pada periode ini.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
                  {sorted.map((tx) => (
                    <TransactionRow
                      key={tx._id}
                      transaction={tx}
                      onClick={setSelectedTx}
                    />
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-neutral-500">
                Klik transaksi untuk melihat detail, mengedit, atau menghapusnya.
              </p>
            </div>
          </div>
        </ModalShell>
      </Modal>

      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
}
