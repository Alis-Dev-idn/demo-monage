import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import { depositSaving, withdrawSaving } from "@/hooks/useSavings";
import type { ID, Saving } from "@/types";

interface SavingMovementModalProps {
  saving: Saving | null;
  mode: "deposit" | "withdraw";
  isOpen: boolean;
  onClose: () => void;
}

export function SavingMovementModal({
  saving,
  mode,
  isOpen,
  onClose,
}: SavingMovementModalProps) {
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState<ID | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!saving) return null;

  const isDeposit = mode === "deposit";
  const title = isDeposit ? "Setor ke Tabungan" : "Tarik dari Tabungan";
  const subtitle = saving.name;

  const reset = () => {
    setAmount(0);
    setAccountId(null);
    setNote("");
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      notify.warning("Nominal harus lebih dari 0");
      return;
    }
    if (!accountId) {
      notify.warning("Pilih dompet asal/tujuan");
      return;
    }
    setBusy(true);
    try {
      const fn = isDeposit ? depositSaving : withdrawSaving;
      await notify.promise(
        fn(saving._id, { amount, accountId, note: note || undefined }),
        {
          loading: isDeposit ? "Menyetor…" : "Menarik…",
          success: isDeposit ? "Setoran berhasil ✓" : "Penarikan berhasil ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal memproses."),
        },
      );
      reset();
      onClose();
    } catch {
      // surfaced via notify
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      size="sm"
    >
      <ModalShell
        icon={isDeposit ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
        title={title}
        subtitle={subtitle}
        footer={
          <>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={busy}
            >
              Batal
            </Button>
            <Button onClick={() => void handleSubmit()} isLoading={busy}>
              {isDeposit ? "Setor" : "Tarik"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nominal" required>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </FormField>

          <FormField label={isDeposit ? "Ambil dari Dompet" : "Masukkan ke Dompet"} required>
            <AccountSelect value={accountId} onChange={setAccountId} />
          </FormField>

          <FormField label="Catatan (opsional)">
            <Input
              placeholder={isDeposit ? "Mis. setoran bulanan" : "Mis. ambil untuk darurat"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>

          {isDeposit && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              💡 Setoran dikurangi dari saldo dompet pilihan dan ditambahkan ke
              tabungan. Ikut tercatat sebagai pengeluaran bulan ini.
            </p>
          )}
        </div>
      </ModalShell>
    </Modal>
  );
}
