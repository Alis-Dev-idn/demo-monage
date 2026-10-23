import { z } from "zod";

const baseShape = {
  amount: z
    .number({ message: "Nominal wajib" })
    .int("Nominal harus bilangan bulat")
    .positive("Nominal harus lebih dari 0")
    .max(999_999_999_999, "Nominal terlalu besar"),
  adminFee: z
    .number()
    .int()
    .nonnegative("Biaya admin tidak boleh negatif")
    .max(999_999_999, "Biaya admin terlalu besar")
    .optional(),
  occurredAt: z.string().min(1, "Tanggal wajib"),
  note: z.string().max(500).optional(),
};

export const transactionInOutSchema = z.object({
  ...baseShape,
  type: z.enum(["in", "out"]),
  accountId: z.string().min(1, "Pilih akun"),
  categoryId: z.string().min(1, "Pilih kategori"),
  subcategoryId: z.string().optional(),
});

export const transactionTransferSchema = z
  .object({
    ...baseShape,
    type: z.literal("transfer"),
    fromAccountId: z.string().min(1, "Pilih akun asal"),
    toAccountId: z.string().min(1, "Pilih akun tujuan"),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "Akun asal dan tujuan harus berbeda",
    path: ["toAccountId"],
  });

export const transactionSchema = z.discriminatedUnion("type", [
  transactionInOutSchema,
  transactionTransferSchema,
]);

export type TransactionInOutFormData = z.infer<typeof transactionInOutSchema>;
export type TransactionTransferFormData = z.infer<typeof transactionTransferSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
