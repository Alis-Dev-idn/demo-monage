import { z } from "zod";
import { toneSchema } from "./account";

export const categoryKindSchema = z.enum(["income", "expense"]);

export const categoryFormSchema = z.object({
  kind: categoryKindSchema,
  name: z.string().min(1, "Nama wajib").max(40),
  icon: z.string().min(1, "Pilih ikon"),
  tone: toneSchema,
});

export const subcategoryFormSchema = z.object({
  name: z.string().min(1, "Nama subkategori wajib").max(40),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type SubcategoryFormData = z.infer<typeof subcategoryFormSchema>;
