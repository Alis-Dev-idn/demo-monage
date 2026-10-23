import { z } from "zod";
import { toneSchema } from "./account";

export const savingFormSchema = z.object({
  name: z.string().min(1, "Nama wajib").max(60),
  icon: z.string().min(1, "Pilih ikon"),
  tone: toneSchema,
  goalAmount: z
    .number({ message: "Target nominal wajib" })
    .int()
    .positive("Target harus lebih dari 0")
    .max(999_999_999_999),
  /** Saldo saat ini (koreksi saldo awal) — hanya dipakai saat edit. */
  currentAmount: z
    .number()
    .int()
    .nonnegative("Saldo tidak boleh negatif")
    .max(999_999_999_999)
    .optional(),
  monthlyDeposit: z
    .number()
    .int()
    .nonnegative("Target setoran bulanan tidak boleh negatif")
    .max(999_999_999_999)
    .optional(),
  targetDate: z.string().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

export const savingMovementSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib" })
    .int()
    .positive("Nominal harus lebih dari 0"),
  accountId: z.string().min(1, "Pilih dompet"),
  note: z.string().max(500).optional(),
});

export type SavingFormData = z.infer<typeof savingFormSchema>;
export type SavingMovementFormData = z.infer<typeof savingMovementSchema>;
