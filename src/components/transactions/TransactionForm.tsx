import { useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@dep/ui/button";
import { FormField, Textarea } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { TransactionTypeTabs } from "./TransactionTypeTabs";
import { TransferAccountPair } from "./TransferAccountPair";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { DatePicker } from "@/components/common/DatePicker";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import { CategorySelect } from "@/components/categories/CategorySelect";
import {
  transactionSchema,
  type TransactionFormData,
} from "@/schemas/transaction";
import {
  createTransaction,
  updateTransaction,
} from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useLookup } from "@/hooks/useLookup";
import { toDateOnlyISO, fromDateOnlyISO } from "@/utils/date";
import type { Transaction, TransactionType } from "@/types";

interface TransactionFormProps {
  initialValue?: Transaction;
  defaultType?: TransactionType;
  onSubmitted?: (tx: Transaction) => void;
  onCancel?: () => void;
  /** Dipanggil saat backend balas QUOTA_EXCEEDED (422). Caller bisa tampilkan modal upgrade. */
  onQuotaExceeded?: (message: string) => void;
}

function toFormDefault(
  tx: Transaction | undefined,
  defaultType: TransactionType,
): TransactionFormData {
  if (!tx) {
    return defaultType === "transfer"
      ? {
          type: "transfer",
          amount: 0,
          adminFee: 0,
          occurredAt: toDateOnlyISO(new Date()),
          note: undefined,
          fromAccountId: "",
          toAccountId: "",
        }
      : {
          type: defaultType,
          amount: 0,
          adminFee: 0,
          occurredAt: toDateOnlyISO(new Date()),
          note: undefined,
          accountId: "",
          categoryId: "",
        };
  }
  if (tx.type === "transfer") {
    return {
      type: "transfer",
      amount: tx.amount,
      adminFee: tx.adminFee ?? 0,
      occurredAt: tx.occurredAt,
      // Backend bisa kirim `null` untuk note; skema FE hanya terima string|undefined.
      note: tx.note ?? undefined,
      fromAccountId: tx.fromAccountId,
      toAccountId: tx.toAccountId,
    };
  }
  return {
    type: tx.type,
    amount: tx.amount,
    adminFee: tx.adminFee ?? 0,
    occurredAt: tx.occurredAt,
    note: tx.note ?? undefined,
    accountId: tx.accountId,
    categoryId: tx.categoryId,
    subcategoryId: tx.subcategoryId ?? undefined,
  };
}

export function TransactionForm({
  initialValue,
  defaultType = "out",
  onSubmitted,
  onCancel,
  onQuotaExceeded,
}: TransactionFormProps) {
  const isEdit = !!initialValue;
  const [type, setType] = useState<TransactionType>(initialValue?.type ?? defaultType);
  const { user } = useAuth();
  const { categories } = useLookup();

  const defaultValues = useMemo(
    () => toFormDefault(initialValue, defaultType),
    [initialValue, defaultType],
  );

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormData>,
    defaultValues,
  });

  useEffect(() => {
    form.reset(toFormDefault(initialValue, type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, initialValue]);

  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        const saved = await notify.promise(
          isEdit
            ? updateTransaction(initialValue._id, data)
            : createTransaction(data, {
                preferences: user?.preferences,
                categories,
              }),
          {
            loading: "Menyimpan transaksi…",
            success: isEdit ? "Transaksi diperbarui ✓" : "Transaksi tersimpan ✓",
            error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
          },
        );
        onSubmitted?.(saved);
      } catch (err) {
        if (!isEdit && err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
          onQuotaExceeded?.(err.message);
        }
        // selain quota: sudah disurface via notify.promise
      }
    },
    // onInvalid — tanpa ini, klik "Simpan" saat ada error validasi tidak
    // memunculkan apa pun (tombol terlihat "tidak jalan"). Surface pesan
    // pertama lewat notify supaya user tahu apa yang kurang.
    (formErrors) => {
      const first = Object.values(formErrors).find((e) => e?.message)?.message;
      notify.error(
        typeof first === "string" ? first : "Periksa kembali isian formulir.",
      );
    },
  );

  // Transaksi dari Perencanaan (#2.3): tunjukkan konteks asal supaya user paham
  // bahwa nominal/dompet terhubung ke ceklis perencanaan. Catatan tetap khusus
  // deskripsi user (planRef tak diubah dari sini).
  const planRef = initialValue?.source === "plan" ? initialValue.planRef : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {planRef && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <CalendarRange size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium">Transaksi dari Perencanaan</p>
            <p className="text-emerald-700">
              {[
                planRef.planName,
                planRef.groupName,
                [planRef.itemName, planRef.ingredientName]
                  .filter(Boolean)
                  .join(" · "),
              ]
                .filter(Boolean)
                .join(" › ")}
            </p>
          </div>
        </div>
      )}

      <TransactionTypeTabs value={type} onChange={(t) => setType(t)} />

      <FormField
        label="Nominal"
        required
        errorMessage={errors.amount?.message}
      >
        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => (
            <CurrencyInput
              value={field.value}
              onChange={field.onChange}
              autoFocus
              allowCalc
            />
          )}
        />
      </FormField>

      {type === "transfer" ? (
        <Controller
          control={form.control}
          name="fromAccountId"
          render={({ field: fromField }) => (
            <Controller
              control={form.control}
              name="toAccountId"
              render={({ field: toField }) => {
                const transferErrors = errors as typeof errors & {
                  fromAccountId?: { message?: string };
                  toAccountId?: { message?: string };
                };
                return (
                  <TransferAccountPair
                    fromAccountId={fromField.value || null}
                    toAccountId={toField.value || null}
                    onFromChange={(id) => fromField.onChange(id)}
                    onToChange={(id) => toField.onChange(id)}
                    error={{
                      from: transferErrors.fromAccountId?.message,
                      to: transferErrors.toAccountId?.message,
                    }}
                  />
                );
              }}
            />
          )}
        />
      ) : (
        <>
          <FormField
            label="Dompet"
            required
            errorMessage={(errors as typeof errors & { accountId?: { message?: string } }).accountId?.message}
          >
            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <AccountSelect value={field.value || null} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField
            label={type === "in" ? "Sumber Pemasukan" : "Kategori Pengeluaran"}
            required
            errorMessage={(errors as typeof errors & { categoryId?: { message?: string } }).categoryId?.message}
          >
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <CategorySelect
                  kind={type === "in" ? "income" : "expense"}
                  value={field.value || null}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </>
      )}

      <FormField
        label={
          type === "transfer"
            ? "Biaya Admin / Bank (opsional)"
            : "Biaya Tambahan (opsional)"
        }
        helperText={
          type === "transfer"
            ? "Mis. biaya transfer antar bank — dikurangi dari dompet asal."
            : type === "out"
            ? "Mis. fee ojek/platform — ditambahkan ke pengeluaran."
            : "Mis. fee penerimaan — dikurangi dari nominal masuk."
        }
        errorMessage={errors.adminFee?.message}
      >
        <Controller
          control={form.control}
          name="adminFee"
          render={({ field }) => (
            <CurrencyInput
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v)}
              allowCalc
            />
          )}
        />
      </FormField>

      <FormField
        label="Tanggal"
        required
        errorMessage={errors.occurredAt?.message}
      >
        <Controller
          control={form.control}
          name="occurredAt"
          render={({ field }) => (
            <DatePicker
              value={fromDateOnlyISO(field.value)}
              onChange={(d) => field.onChange(d ? toDateOnlyISO(d) : "")}
              max={new Date()}
            />
          )}
        />
      </FormField>

      <FormField label="Catatan (opsional)" errorMessage={errors.note?.message}>
        <Textarea rows={2} placeholder="contoh: Makan siang di kantor" {...form.register("note")} />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" isLoading={form.formState.isSubmitting} fullWidth={!onCancel}>
          {isEdit ? "Simpan Perubahan" : "Catat Transaksi"}
        </Button>
      </div>
    </form>
  );
}
