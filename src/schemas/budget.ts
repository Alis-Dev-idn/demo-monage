import { z } from "zod";

export const budgetPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Pilih kategori"),
  period: budgetPeriodSchema,
  amount: z
    .number({ message: "Nominal wajib" })
    .int()
    .positive("Nominal harus lebih dari 0")
    .max(999_999_999_999),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;
