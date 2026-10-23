import type { PlanItemCategory } from "@/types";

/**
 * Daftar kategori bahan untuk item grup Menu Masak (meal). Urutan ini juga
 * dipakai saat menampilkan rincian per-kategori pada panel "Rincian" group.
 */
export const PLAN_ITEM_CATEGORIES: Array<{ value: PlanItemCategory; label: string }> = [
  { value: "sayuran", label: "Sayuran" },
  { value: "protein", label: "Protein" },
  { value: "karbohidrat", label: "Karbohidrat" },
  { value: "bumbu", label: "Bumbu" },
  { value: "buah", label: "Buah" },
  { value: "lainnya", label: "Lainnya" },
];

export const PLAN_ITEM_CATEGORY_LABEL: Record<PlanItemCategory, string> =
  Object.fromEntries(PLAN_ITEM_CATEGORIES.map((c) => [c.value, c.label])) as Record<
    PlanItemCategory,
    string
  >;
