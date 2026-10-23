import { useState } from "react";
import { CalendarRange, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { ModalShell } from "@/components/common/ModalShell";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { CurrencyText } from "@/components/common/CurrencyText";
import { TransactionForm } from "./TransactionForm";
import { useAccountById, useCategoryById } from "@/hooks/useLookup";
import { deleteTransaction } from "@/hooks/useTransactions";
import { formatDate } from "@/utils/format";
import { TRANSACTION_TYPE } from "@/constants/transactionTypes";
import type { Transaction } from "@/types";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fromAccount = useAccountById(
    transaction?.type === "transfer" ? transaction.fromAccountId : transaction?.type ? transaction.accountId : null,
  );
  const toAccount = useAccountById(
    transaction?.type === "transfer" ? transaction.toAccountId : null,
  );
  const category = useCategoryById(
    transaction && transaction.type !== "transfer" ? transaction.categoryId : null,
  );

  if (!transaction) return null;

  // Transaksi cermin setor/tarik tabungan (ber-`savingId`) bersifat read-only di
  // Riwayat — dikelola dari menu Tabungan. Sembunyikan tombol Edit/Hapus.
  const isSaving = transaction.type !== "transfer" && !!transaction.savingId;

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Hapus transaksi?",
      message: "Tindakan ini tidak bisa dibatalkan dan saldo akun akan dikembalikan.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await notify.promise(deleteTransaction(transaction._id), {
        loading: "Menghapus…",
        success: "Transaksi dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      onClose();
    } catch {
      // surfaced via notify
    } finally {
      setDeleting(false);
    }
  };

  const meta = TRANSACTION_TYPE[transaction.type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalShell
        title={editing ? "Edit Transaksi" : "Detail Transaksi"}
        footer={
          editing || isSaving ? undefined : (
            <>
              <Button
                variant="danger-outline"
                leftIcon={<Trash2 size={14} />}
                onClick={() => void handleDelete()}
                isLoading={deleting}
              >
                Hapus
              </Button>
              <Button
                leftIcon={<Pencil size={14} />}
                onClick={() => setEditing(true)}
                disabled={deleting}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {editing ? (
          <TransactionForm
            initialValue={transaction}
            onSubmitted={() => {
              setEditing(false);
              onClose();
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: meta.bgVar, color: meta.colorVar }}
            >
              <p className="text-xs font-medium uppercase tracking-wide">{meta.label}</p>
              <CurrencyText
                amount={transaction.amount}
                type={transaction.type}
                size="lg"
                className="mt-1"
              />
            </div>

            <dl className="grid grid-cols-3 gap-3 text-sm">
              {transaction.type === "transfer" ? (
                <>
                  <dt className="text-neutral-500">Dari</dt>
                  <dd className="col-span-2 text-neutral-900">{fromAccount?.name ?? "—"}</dd>
                  <dt className="text-neutral-500">Ke</dt>
                  <dd className="col-span-2 text-neutral-900">{toAccount?.name ?? "—"}</dd>
                </>
              ) : (
                <>
                  <dt className="text-neutral-500">Dompet</dt>
                  <dd className="col-span-2 text-neutral-900">{fromAccount?.name ?? "—"}</dd>
                  <dt className="text-neutral-500">Kategori</dt>
                  <dd className="col-span-2 text-neutral-900">{category?.name ?? "—"}</dd>
                </>
              )}
              {(transaction.adminFee ?? 0) > 0 && (
                <>
                  <dt className="text-neutral-500">Biaya Admin</dt>
                  <dd className="col-span-2 text-neutral-900">
                    <CurrencyText
                      amount={transaction.adminFee ?? 0}
                      type="out"
                      size="sm"
                      showSign={false}
                    />
                  </dd>
                </>
              )}
              <dt className="text-neutral-500">Tanggal</dt>
              <dd className="col-span-2 text-neutral-900">
                {formatDate(transaction.occurredAt, "long")}
              </dd>
              {transaction.source === "plan" && transaction.planRef && (
                <>
                  <dt className="text-neutral-500">Asal</dt>
                  <dd className="col-span-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CalendarRange size={12} /> Perencanaan
                    </span>
                  </dd>
                  <dt className="text-neutral-500">Perencanaan</dt>
                  <dd className="col-span-2 text-neutral-900">
                    {transaction.planRef.planName}
                  </dd>
                  {transaction.planRef.groupName && (
                    <>
                      <dt className="text-neutral-500">Grup</dt>
                      <dd className="col-span-2 text-neutral-900">
                        {transaction.planRef.groupName}
                      </dd>
                    </>
                  )}
                  {transaction.planRef.itemName && (
                    <>
                      <dt className="text-neutral-500">Item</dt>
                      <dd className="col-span-2 text-neutral-900">
                        {transaction.planRef.itemName}
                      </dd>
                    </>
                  )}
                  {transaction.planRef.ingredientName && (
                    <>
                      <dt className="text-neutral-500">Bahan</dt>
                      <dd className="col-span-2 text-neutral-900">
                        {transaction.planRef.ingredientName}
                      </dd>
                    </>
                  )}
                </>
              )}
              {transaction.note && (
                <>
                  <dt className="text-neutral-500">Catatan</dt>
                  <dd className="col-span-2 whitespace-pre-line text-neutral-900">
                    {transaction.note}
                  </dd>
                </>
              )}
            </dl>

            {isSaving && (
              <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Transaksi ini berasal dari setor/tarik tabungan dan hanya bisa
                diubah atau dihapus dari menu Tabungan.
              </p>
            )}
          </div>
        )}
      </ModalShell>
    </Modal>
  );
}
