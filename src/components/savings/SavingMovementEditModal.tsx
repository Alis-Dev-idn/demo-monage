import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import { updateSavingMovement } from "@/hooks/useSavings";
import type { ID, SavingMovement } from "@/types";

interface SavingMovementEditModalProps {
  savingId: ID;
  movement: SavingMovement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SavingMovementEditModal({
  savingId,
  movement,
  isOpen,
  onClose,
}: SavingMovementEditModalProps) {
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState<ID | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill tiap kali movement berubah / modal dibuka (sinkronisasi prop→state).
  useEffect(() => {
    if (!movement) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount(movement.amount);
    setAccountId(movement.accountId);
    setNote(movement.note ?? "");
  }, [movement]);

  if (!movement) return null;

  const isDeposit = movement.type === "deposit";

  const handleSubmit = async () => {
    if (amount <= 0) {
      notify.warning("Nominal harus lebih dari 0");
      return;
    }
    if (!accountId) {
      notify.warning("Pilih dompet");
      return;
    }
    setBusy(true);
    try {
      await notify.promise(
        updateSavingMovement(savingId, movement._id, {
          amount,
          accountId,
          note: note ? note : null,
        }),
        {
          loading: "Menyimpan…",
          success: "Riwayat diperbarui ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
        },
      );
      onClose();
    } catch {
      // surfaced via notify
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalShell
        icon={isDeposit ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
        title={isDeposit ? "Edit Setoran" : "Edit Penarikan"}
        subtitle="Saldo tabungan & dompet akan disesuaikan otomatis."
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button onClick={() => void handleSubmit()} isLoading={busy}>
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nominal" required>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </FormField>

          <FormField label={isDeposit ? "Diambil dari Dompet" : "Masuk ke Dompet"} required>
            <AccountSelect value={accountId} onChange={setAccountId} />
          </FormField>

          <FormField label="Catatan (opsional)">
            <Input
              placeholder={isDeposit ? "Mis. setoran bulanan" : "Mis. ambil untuk darurat"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
        </div>
      </ModalShell>
    </Modal>
  );
}
