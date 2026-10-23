import { z } from "zod";

export const accountKindSchema = z.enum([
  "cash",
  "bank",
  "ewallet",
  "investment",
  "other",
]);

export const toneSchema = z.enum([
  "emerald",
  "orange",
  "blue",
  "amber",
  "cyan",
  "violet",
  "rose",
  "accent",
  "neutral",
]);

export const accountFormSchema = z.object({
  name: z.string().min(1, "Nama wajib").max(40),
  type: accountKindSchema,
  icon: z.string().min(1, "Pilih ikon"),
  tone: toneSchema,
  initialBalance: z
    .number({ message: "Nominal wajib" })
    .int()
    .nonnegative("Nominal tidak boleh negatif"),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;
