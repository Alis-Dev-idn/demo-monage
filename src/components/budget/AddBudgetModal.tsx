import { useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ModalShell } from "@/components/common/ModalShell";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { createBudget } from "@/hooks/useBudget";
import { formatPeriodLabel } from "@/utils/budgetPeriod";
import type { ID } from "@/types";

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: { year: number; month: number };
  cycleStartDay?: number;
  /** ID kategori yang sudah punya anggaran — disable agar tidak duplikat. */
  existingCategoryIds?: ID[];
}

export function AddBudgetModal({
  isOpen,
  onClose,
  period,
  cycleStartDay = 1,
  existingCategoryIds = [],
}: AddBudgetModalProps) {
  const [categoryId, setCategoryId] = useState<ID | null>(null);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const periodLabel = useMemo(
    () => formatPeriodLabel(period, cycleStartDay),
    [period, cycleStartDay],
  );

  const reset = () => {
    setCategoryId(null);
    setAmount(0);
  };

  const handleSave = async () => {
    if (!categoryId) {
      notify.warning("Pilih kategori dulu");
      return;
    }
    if (amount <= 0) {
      notify.warning("Nominal anggaran harus lebih dari 0");
      return;
    }
    setBusy(true);
    try {
      await notify.promise(createBudget({ categoryId, period, amount }), {
        loading: "Membuat anggaran…",
        success: "Anggaran dibuat ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
      });
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
      size="md"
    >
      <ModalShell
        icon={<PiggyBank size={20} />}
        title="Tambah Anggaran"
        subtitle={`Periode: ${periodLabel}`}
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
            <Button onClick={() => void handleSave()} isLoading={busy}>
              Buat Anggaran
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Kategori" required>
            <CategoryPicker
              kind="expense"
              value={categoryId}
              onChange={setCategoryId}
              excludeIds={existingCategoryIds}
              emptyExcludedMessage="Semua kategori pengeluaran sudah punya anggaran bulan ini — edit langsung di daftar."
            />
            {existingCategoryIds.length > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                Kategori yang sudah dianggarkan tidak ditampilkan di sini — edit
                langsung di daftar anggaran.
              </p>
            )}
          </FormField>

          <FormField label="Nominal Anggaran" required>
            <CurrencyInput value={amount} onChange={setAmount} />
          </FormField>
        </div>
      </ModalShell>
    </Modal>
  );
}
