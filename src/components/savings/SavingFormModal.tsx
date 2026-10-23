import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField, Input, Textarea } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { DatePicker } from "@/components/common/DatePicker";
import { IconPicker } from "@/components/categories/IconPicker";
import { TonePicker } from "@/components/categories/TonePicker";
import { savingFormSchema, type SavingFormData } from "@/schemas/saving";
import { createSaving, updateSaving } from "@/hooks/useSavings";
import { toDateOnlyISO, fromDateOnlyISO } from "@/utils/date";
import type { Saving } from "@/types";

interface SavingFormModalProps {
  saving?: Saving | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SavingFormModal({ saving, isOpen, onClose }: SavingFormModalProps) {
  const isEdit = !!saving;

  // Snapshot nilai dari saving — hanya di-recompute saat ID berubah
  // (bukan setiap refetch parent), supaya `useForm`'s `values` reset tidak
  // ke-trigger tiap render parent yang menghapus input user yang lagi diketik.
  const savingId = saving?._id ?? null;
  const defaultValues = useMemo<SavingFormData>(
    () => ({
      name: saving?.name ?? "",
      icon: saving?.icon ?? "PiggyBank",
      tone: saving?.tone ?? "emerald",
      goalAmount: saving?.goalAmount ?? 0,
      currentAmount: saving?.currentAmount ?? 0,
      monthlyDeposit: saving?.monthlyDeposit ?? 0,
      targetDate: saving?.targetDate ?? "",
      note: saving?.note ?? undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savingId],
  );

  const form = useForm<SavingFormData>({
    resolver: zodResolver(savingFormSchema),
    defaultValues,
  });

  // Reset form HANYA saat modal dibuka atau saving target berganti — tidak
  // pada setiap render parent (yang menyebabkan input revert ke nilai lama).
  useEffect(() => {
    if (isOpen) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, savingId]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await notify.promise(
        isEdit
          ? updateSaving(saving._id, data)
          : createSaving(data),
        {
          loading: isEdit ? "Menyimpan…" : "Membuat tabungan…",
          success: isEdit ? "Tabungan diperbarui ✓" : "Tabungan dibuat ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
        },
      );
      onClose();
      form.reset(defaultValues);
    } catch {
      // surfaced via notify
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<PiggyBank size={20} />}
          title={isEdit ? "Edit Tabungan" : "Tabungan Baru"}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {isEdit ? "Simpan Perubahan" : "Buat Tabungan"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Nama Tujuan"
              required
              errorMessage={form.formState.errors.name?.message}
            >
              <Input
                autoFocus
                placeholder="contoh: Dana Darurat, Liburan Bali"
                {...form.register("name")}
              />
            </FormField>

            <FormField
              label="Target Nominal"
              required
              errorMessage={form.formState.errors.goalAmount?.message}
              helperText="Jumlah yang ingin Anda capai."
            >
              <Controller
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            {isEdit && (
              <FormField
                label="Saldo Saat Ini"
                helperText="Koreksi saldo awal tabungan. Tidak memindahkan saldo dompet — hanya menyesuaikan angka tabungan."
                errorMessage={form.formState.errors.currentAmount?.message}
              >
                <Controller
                  control={form.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value ?? 0}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
              </FormField>
            )}

            <FormField
              label="Target Setoran Bulanan (opsional)"
              helperText="Komitmen menabung rutin per bulan — boleh dilampaui atau kurang."
              errorMessage={form.formState.errors.monthlyDeposit?.message}
            >
              <Controller
                control={form.control}
                name="monthlyDeposit"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Target Tanggal (opsional)"
              errorMessage={form.formState.errors.targetDate?.message}
            >
              <Controller
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <DatePicker
                    value={fromDateOnlyISO(field.value)}
                    onChange={(d) => field.onChange(d ? toDateOnlyISO(d) : "")}
                    min={new Date()}
                  />
                )}
              />
            </FormField>

            <FormField label="Catatan (opsional)" errorMessage={form.formState.errors.note?.message}>
              <Textarea rows={2} placeholder="Alasan menabung…" {...form.register("note")} />
            </FormField>

            <FormField label="Ikon" errorMessage={form.formState.errors.icon?.message}>
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <IconPicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            <FormField label="Warna" errorMessage={form.formState.errors.tone?.message}>
              <Controller
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <TonePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}
