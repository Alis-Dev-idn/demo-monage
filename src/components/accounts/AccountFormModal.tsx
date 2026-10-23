import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { Select, type SelectOption } from "@dep/ui/select";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ModalShell } from "@/components/common/ModalShell";
import { TonePicker } from "@/components/categories/TonePicker";
import { IconPicker } from "@/components/categories/IconPicker";
import { accountFormSchema, type AccountFormData } from "@/schemas/account";
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPES, ACCOUNT_TYPE_ICON } from "@/constants/accountTypes";
import { createAccount, updateAccount } from "@/hooks/useAccounts";
import type { Account, AccountType } from "@/types";

interface AccountFormModalProps {
  account?: Account;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (account: Account) => void;
}

const TYPE_OPTIONS: SelectOption<AccountType>[] = ACCOUNT_TYPES.map((type) => ({
  value: type,
  label: ACCOUNT_TYPE_LABEL[type],
}));

export function AccountFormModal({
  account,
  isOpen,
  onClose,
  onSaved,
}: AccountFormModalProps) {
  const isEdit = !!account;

  const defaultValues = useMemo<AccountFormData>(
    () => ({
      name: account?.name ?? "",
      type: account?.type ?? "cash",
      icon: account?.icon ?? ACCOUNT_TYPE_ICON.cash,
      tone: account?.tone ?? "emerald",
      // Saat edit, tampilkan saldo TERKINI (yang user lihat di kartu dompet),
      // bukan saldo awal. Backend menyetel currentBalance = nilai ini saat patch.
      initialBalance: account?.currentBalance ?? 0,
    }),
    [account],
  );

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    values: defaultValues,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const saved = await notify.promise(
        isEdit ? updateAccount(account._id, data) : createAccount(data),
        {
          loading: isEdit ? "Menyimpan perubahan…" : "Menambah dompet…",
          success: isEdit ? "Dompet diperbarui ✓" : "Dompet berhasil dibuat ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
        },
      );
      onSaved?.(saved);
      onClose();
      form.reset(defaultValues);
    } catch {
      // notify.promise sudah surface error ke user
    }
  });

  const onTypeChange = (next: AccountType) => {
    form.setValue("type", next, { shouldValidate: true });
    form.setValue("icon", ACCOUNT_TYPE_ICON[next], { shouldValidate: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Wallet size={20} />}
          title={isEdit ? "Edit Dompet" : "Tambah Dompet"}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {isEdit ? "Simpan Perubahan" : "Buat Dompet"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Nama Dompet"
              required
              errorMessage={form.formState.errors.name?.message}
            >
              <Input
                autoFocus
                placeholder="contoh: BCA, GoPay, Tunai"
                {...form.register("name")}
              />
            </FormField>

            <FormField
              label="Jenis"
              required
              errorMessage={form.formState.errors.type?.message}
            >
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={TYPE_OPTIONS.find((o) => o.value === field.value)}
                    options={TYPE_OPTIONS}
                    onChange={(opt) => opt && onTypeChange(opt.value)}
                    isClearable={false}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Saldo Awal"
              required
              errorMessage={form.formState.errors.initialBalance?.message}
              helperText="Saldo yang ada di dompet saat ini."
            >
              <Controller
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                )}
              />
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
