import { useCategoriesByKind } from "@/hooks/useLookup";
import { CategoryGrid } from "./CategoryGrid";
import type { CategoryKind, ID } from "@/types";

interface CategoryPickerProps {
  kind: CategoryKind;
  value: ID | null;
  onChange: (id: ID) => void;
  error?: string;
  /** Kategori yang disembunyikan dari grid (mis. yang sudah punya anggaran). */
  excludeIds?: ID[];
  /** Pesan saat semua kategori tersaring habis oleh `excludeIds`. */
  emptyExcludedMessage?: string;
}

export function CategoryPicker({
  kind,
  value,
  onChange,
  error,
  excludeIds,
  emptyExcludedMessage = "Semua kategori sudah dipakai.",
}: CategoryPickerProps) {
  const all = useCategoriesByKind(kind);
  const categories =
    excludeIds && excludeIds.length > 0
      ? all.filter((c) => !excludeIds.includes(c._id))
      : all;

  if (all.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-center text-sm text-neutral-500">
        Belum ada kategori. Tambahkan dulu di menu Kategori.
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-center text-sm text-neutral-500">
        {emptyExcludedMessage}
      </p>
    );
  }

  return (
    <div>
      <CategoryGrid
        categories={categories}
        selectedId={value}
        mode="select"
        onSelect={(cat) => onChange(cat._id)}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
